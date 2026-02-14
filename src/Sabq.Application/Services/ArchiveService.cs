using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Sabq.Domain.Entities;
using Sabq.Infrastructure.Data;
using Sabq.Shared.DTOs;
using System.Data;

namespace Sabq.Application.Services;

/// <summary>
/// Service for archiving old game answers and managing data retention.
/// </summary>
public class ArchiveService
{
    private readonly SabqDbContext _context;
    private readonly ILogger<ArchiveService> _logger;

    // Configuration constants
    public const int DefaultRetentionDays = 90;
    public const int DefaultBatchSize = 10000;

    public ArchiveService(SabqDbContext context, ILogger<ArchiveService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Calculates the cutoff date for archival based on retention days.
    /// </summary>
    public static DateTime CalculateCutoffDate(int retentionDays = DefaultRetentionDays)
    {
        return DateTime.UtcNow.AddDays(-retentionDays);
    }

    /// <summary>
    /// Executes the archive and summarize stored procedure.
    /// </summary>
    public async Task<ArchiveJobResultDto> ArchiveOldGamesAsync(
        int retentionDays = DefaultRetentionDays,
        int batchSize = DefaultBatchSize,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "Starting archive job with RetentionDays={RetentionDays}, BatchSize={BatchSize}",
            retentionDays, batchSize);

        var startedAt = DateTime.UtcNow;

        try
        {
            var retentionDaysParam = new SqlParameter("@RetentionDays", SqlDbType.Int) { Value = retentionDays };
            var batchSizeParam = new SqlParameter("@BatchSize", SqlDbType.Int) { Value = batchSize };

            // Execute stored procedure and read results
            var connection = _context.Database.GetDbConnection();
            await connection.OpenAsync(cancellationToken);

            using var command = connection.CreateCommand();
            command.CommandText = "EXEC dbo.usp_ArchiveAndSummarizeOldGames @RetentionDays, @BatchSize";
            command.Parameters.Add(retentionDaysParam);
            command.Parameters.Add(batchSizeParam);
            command.CommandTimeout = 3600; // 1 hour timeout for large archives

            long archivedAnswersCount = 0;
            int affectedRoomsCount = 0;
            DateTime finishedAtUtc = DateTime.UtcNow;
            long durationMs = 0;

            using var reader = await command.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                archivedAnswersCount = reader.GetInt64(reader.GetOrdinal("ArchivedAnswersCount"));
                affectedRoomsCount = reader.GetInt32(reader.GetOrdinal("AffectedRoomsCount"));
                startedAt = reader.GetDateTime(reader.GetOrdinal("StartedAtUtc"));
                finishedAtUtc = reader.GetDateTime(reader.GetOrdinal("FinishedAtUtc"));
                durationMs = reader.GetInt64(reader.GetOrdinal("DurationMs"));
            }

            _logger.LogInformation(
                "Archive job completed: ArchivedAnswers={ArchivedAnswers}, AffectedRooms={AffectedRooms}, Duration={DurationMs}ms",
                archivedAnswersCount, affectedRoomsCount, durationMs);

            return new ArchiveJobResultDto(
                archivedAnswersCount,
                affectedRoomsCount,
                startedAt,
                finishedAtUtc,
                durationMs);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Archive job failed");
            throw;
        }
    }

    /// <summary>
    /// Checks if a room should return summary-only data (archived or older than retention).
    /// </summary>
    public async Task<bool> IsRoomArchivedAsync(Guid roomId, CancellationToken cancellationToken = default)
    {
        // First check if explicitly archived in summary table
        var summary = await _context.GameRoomSummaries
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.RoomId == roomId, cancellationToken);

        if (summary?.IsArchived == true)
            return true;

        // Check if room is older than retention period
        var cutoff = CalculateCutoffDate();
        var room = await _context.GameRooms
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == roomId, cancellationToken);

        return room != null && room.CreatedAt < cutoff;
    }

    /// <summary>
    /// Gets the summary for an archived room.
    /// </summary>
    public async Task<GameRoomSummaryDto?> GetRoomSummaryAsync(
        Guid roomId,
        CancellationToken cancellationToken = default)
    {
        var summary = await _context.GameRoomSummaries
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.RoomId == roomId, cancellationToken);

        if (summary == null)
            return null;

        // Get player summaries
        var playerSummaries = await _context.GameRoomPlayerSummaries
            .AsNoTracking()
            .Where(ps => ps.RoomId == roomId)
            .ToListAsync(cancellationToken);

        // Get player display names
        var playerIds = playerSummaries.Select(ps => ps.PlayerId).ToList();
        var players = await _context.Players
            .AsNoTracking()
            .Where(p => playerIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, p => p.DisplayName, cancellationToken);

        // Get winner display name
        string? winnerDisplayName = null;
        if (summary.WinnerPlayerId.HasValue)
        {
            var winner = await _context.Players
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == summary.WinnerPlayerId.Value, cancellationToken);
            winnerDisplayName = winner?.DisplayName;
        }

        var playerSummaryDtos = playerSummaries.Select(ps => new GameRoomPlayerSummaryDto(
            ps.PlayerId,
            players.TryGetValue(ps.PlayerId, out var name) ? name : "Unknown",
            ps.Score,
            ps.AnsweredCount,
            ps.CorrectAnswers,
            ps.WrongAnswers,
            ps.AnsweredCount > 0 ? Math.Round((double)ps.CorrectAnswers / ps.AnsweredCount * 100, 2) : 0
        )).OrderByDescending(p => p.Score).ToList();

        return new GameRoomSummaryDto(
            summary.RoomId,
            summary.CreatedAtUtc,
            summary.FinishedAtUtc,
            summary.TotalPlayers,
            summary.TotalQuestions,
            summary.WinnerPlayerId,
            winnerDisplayName,
            summary.MaxScore,
            summary.IsArchived,
            playerSummaryDtos
        );
    }

    /// <summary>
    /// Gets recent archive job logs.
    /// </summary>
    public async Task<List<ArchiveJobLog>> GetRecentJobLogsAsync(
        int count = 10,
        CancellationToken cancellationToken = default)
    {
        return await _context.ArchiveJobLogs
            .AsNoTracking()
            .OrderByDescending(l => l.RunAtUtc)
            .Take(count)
            .ToListAsync(cancellationToken);
    }
}
