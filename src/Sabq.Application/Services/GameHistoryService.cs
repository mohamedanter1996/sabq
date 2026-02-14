using Microsoft.EntityFrameworkCore;
using Sabq.Domain.Entities;
using Sabq.Infrastructure.Data;
using Sabq.Shared.DTOs;

namespace Sabq.Application.Services;

/// <summary>
/// Service for retrieving game history data.
/// Returns detailed data for recent games and summary-only for archived games.
/// </summary>
public class GameHistoryService
{
    private readonly SabqDbContext _context;
    private readonly ArchiveService _archiveService;

    public GameHistoryService(SabqDbContext context, ArchiveService archiveService)
    {
        _context = context;
        _archiveService = archiveService;
    }

    /// <summary>
    /// Gets game history for a specific room.
    /// Returns summary-only data if the game is archived or older than retention period.
    /// </summary>
    public async Task<GameHistoryDto?> GetGameHistoryAsync(
        Guid roomId,
        CancellationToken cancellationToken = default)
    {
        // Get the room
        var room = await _context.GameRooms
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == roomId, cancellationToken);

        if (room == null)
            return null;

        // Check if archived
        var isArchived = await _archiveService.IsRoomArchivedAsync(roomId, cancellationToken);

        if (isArchived)
        {
            // Return summary only
            return await GetArchivedGameHistoryAsync(room, cancellationToken);
        }
        else
        {
            // Return detailed data
            return await GetDetailedGameHistoryAsync(room, cancellationToken);
        }
    }

    /// <summary>
    /// Gets game history for a player.
    /// Returns list of games with summary-only for archived games.
    /// </summary>
    public async Task<List<GameHistoryDto>> GetPlayerGameHistoryAsync(
        Guid playerId,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        // Get rooms where the player participated
        var roomIds = await _context.GameRoomPlayers
            .AsNoTracking()
            .Where(rp => rp.PlayerId == playerId)
            .OrderByDescending(rp => rp.JoinedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(rp => rp.RoomId)
            .ToListAsync(cancellationToken);

        var results = new List<GameHistoryDto>();
        foreach (var roomId in roomIds)
        {
            var history = await GetGameHistoryAsync(roomId, cancellationToken);
            if (history != null)
                results.Add(history);
        }

        return results;
    }

    private async Task<GameHistoryDto> GetArchivedGameHistoryAsync(
        GameRoom room,
        CancellationToken cancellationToken)
    {
        // Get summary data
        var summary = await _archiveService.GetRoomSummaryAsync(room.Id, cancellationToken);

        // If no summary exists yet (edge case), create a minimal one
        if (summary == null)
        {
            summary = await CreateMinimalSummaryAsync(room, cancellationToken);
        }

        return new GameHistoryDto(
            room.Id,
            room.Code,
            room.CreatedAt,
            summary.FinishedAtUtc,
            summary.TotalPlayers,
            summary.TotalQuestions,
            IsArchived: true,
            Players: null,      // Never return detailed data for archived games
            Answers: null,      // Never return detailed data for archived games
            Summary: summary
        );
    }

    private async Task<GameHistoryDto> GetDetailedGameHistoryAsync(
        GameRoom room,
        CancellationToken cancellationToken)
    {
        // Get players
        var players = await _context.GameRoomPlayers
            .AsNoTracking()
            .Where(rp => rp.RoomId == room.Id)
            .Join(_context.Players,
                rp => rp.PlayerId,
                p => p.Id,
                (rp, p) => new GameHistoryPlayerDto(
                    p.Id,
                    p.DisplayName,
                    rp.Score,
                    rp.JoinedAt))
            .OrderByDescending(p => p.Score)
            .ToListAsync(cancellationToken);

        // Get answers
        var answers = await _context.GameAnswers
            .AsNoTracking()
            .Where(a => a.RoomId == room.Id)
            .Select(a => new GameHistoryAnswerDto(
                a.Id,
                a.PlayerId,
                a.QuestionId,
                a.OptionId,
                a.IsCorrect,
                a.AnsweredAtUtc))
            .ToListAsync(cancellationToken);

        // Get question count
        var totalQuestions = await _context.GameRoomQuestions
            .AsNoTracking()
            .CountAsync(q => q.RoomId == room.Id, cancellationToken);

        // Get finished time (last answer)
        DateTime? finishedAt = answers.Count > 0
            ? answers.Max(a => a.AnsweredAtUtc)
            : null;

        return new GameHistoryDto(
            room.Id,
            room.Code,
            room.CreatedAt,
            finishedAt,
            players.Count,
            totalQuestions,
            IsArchived: false,
            Players: players,
            Answers: answers,
            Summary: null
        );
    }

    private async Task<GameRoomSummaryDto> CreateMinimalSummaryAsync(
        GameRoom room,
        CancellationToken cancellationToken)
    {
        // This handles edge case where archived data exists but summary wasn't created
        var players = await _context.GameRoomPlayers
            .AsNoTracking()
            .Where(rp => rp.RoomId == room.Id)
            .ToListAsync(cancellationToken);

        var totalQuestions = await _context.GameRoomQuestions
            .AsNoTracking()
            .CountAsync(q => q.RoomId == room.Id, cancellationToken);

        var winner = players.OrderByDescending(p => p.Score).FirstOrDefault();

        var playerDisplayNames = await _context.Players
            .AsNoTracking()
            .Where(p => players.Select(pl => pl.PlayerId).Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, p => p.DisplayName, cancellationToken);

        string? winnerName = winner != null && playerDisplayNames.TryGetValue(winner.PlayerId, out var name) 
            ? name 
            : null;

        var playerSummaries = players.Select(p => new GameRoomPlayerSummaryDto(
            p.PlayerId,
            playerDisplayNames.TryGetValue(p.PlayerId, out var n) ? n : "Unknown",
            p.Score,
            0, // Can't calculate without answers
            0,
            0,
            0
        )).OrderByDescending(p => p.Score).ToList();

        return new GameRoomSummaryDto(
            room.Id,
            room.CreatedAt,
            null,
            players.Count,
            totalQuestions,
            winner?.PlayerId,
            winnerName,
            winner?.Score ?? 0,
            IsArchived: true,
            playerSummaries
        );
    }
}
