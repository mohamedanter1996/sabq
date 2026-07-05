using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Sabq.Domain.Enums;
using Sabq.Infrastructure.Data;
using Sabq.Shared.DTOs;

namespace Sabq.Application.Services;

public class AdminStatsService
{
    private readonly SabqDbContext _context;
    private readonly int _lobbyTimeoutMinutes;
    private readonly int _runningStaleMinutes;

    public AdminStatsService(SabqDbContext context, IConfiguration? configuration = null)
    {
        _context = context;
        _lobbyTimeoutMinutes = ReadPositiveInt(configuration, "RoomLifecycle:LobbyTimeoutMinutes", 60);
        _runningStaleMinutes = ReadPositiveInt(configuration, "RoomLifecycle:RunningStaleMinutes", 30);
    }

    public async Task<AdminStatsSummaryDto> GetSummaryAsync(CancellationToken cancellationToken = default)
    {
        var nowUtc = DateTime.UtcNow;
        var sevenDaysAgo = nowUtc.AddDays(-7);
        var thirtyDaysAgo = nowUtc.AddDays(-30);
        var lobbyCutoffUtc = nowUtc.AddMinutes(-_lobbyTimeoutMinutes);
        var runningCutoffUtc = nowUtc.AddMinutes(-_runningStaleMinutes);

        var totalAnswers = await _context.GameAnswers.AsNoTracking().LongCountAsync(cancellationToken);
        var correctAnswers = await _context.GameAnswers.AsNoTracking()
            .LongCountAsync(answer => answer.IsCorrect, cancellationToken);
        var rooms = _context.GameRooms.AsNoTracking();

        var topCategories = await (
            from answer in _context.GameAnswers.AsNoTracking()
            join question in _context.Questions.AsNoTracking() on answer.QuestionId equals question.Id
            join category in _context.Categories.AsNoTracking() on question.CategoryId equals category.Id
            group answer by new
            {
                category.Slug,
                category.NameAr,
                category.NameEn
            } into categoryAnswers
            orderby categoryAnswers.Count() descending
            select new AdminCategoryUsageDto(
                categoryAnswers.Key.Slug,
                categoryAnswers.Key.NameAr,
                categoryAnswers.Key.NameEn,
                categoryAnswers.Count())
        )
        .Take(10)
        .ToListAsync(cancellationToken);

        return new AdminStatsSummaryDto(
            TotalPlayers: await _context.Players.AsNoTracking().LongCountAsync(cancellationToken),
            TotalRooms: await rooms.LongCountAsync(cancellationToken),
            ActiveRooms: await rooms.LongCountAsync(room =>
                (room.Status == RoomStatus.Lobby && (room.LastActivityAtUtc ?? room.CreatedAt) > lobbyCutoffUtc) ||
                (room.Status == RoomStatus.Running && (room.LastActivityAtUtc ?? room.CreatedAt) > runningCutoffUtc),
                cancellationToken),
            LobbyRooms: await rooms.LongCountAsync(room => room.Status == RoomStatus.Lobby, cancellationToken),
            RunningRooms: await rooms.LongCountAsync(room => room.Status == RoomStatus.Running, cancellationToken),
            FinishedRooms: await rooms
                .LongCountAsync(room => room.Status == RoomStatus.Finished, cancellationToken),
            AbandonedRooms: await rooms.LongCountAsync(room => room.Status == RoomStatus.Abandoned, cancellationToken),
            StaleRooms: await rooms.LongCountAsync(room =>
                (room.Status == RoomStatus.Lobby && (room.LastActivityAtUtc ?? room.CreatedAt) <= lobbyCutoffUtc) ||
                (room.Status == RoomStatus.Running && (room.LastActivityAtUtc ?? room.CreatedAt) <= runningCutoffUtc),
                cancellationToken),
            TotalAnswers: totalAnswers,
            CorrectAnswers: correctAnswers,
            CorrectAnswerRate: totalAnswers == 0 ? 0 : Math.Round((double)correctAnswers / totalAnswers * 100, 2),
            TotalQuestions: await _context.Questions.AsNoTracking().LongCountAsync(cancellationToken),
            ActiveQuestions: await _context.Questions.AsNoTracking()
                .LongCountAsync(question => question.IsActive, cancellationToken),
            TotalCategories: await _context.Categories.AsNoTracking().LongCountAsync(cancellationToken),
            ContactMessages: await _context.ContactMessages.AsNoTracking().LongCountAsync(cancellationToken),
            UnreadContactMessages: await _context.ContactMessages.AsNoTracking()
                .LongCountAsync(message => !message.IsRead, cancellationToken),
            LastUpdatedAtUtc: nowUtc,
            Last7Days: await GetActivityAsync(sevenDaysAgo, cancellationToken),
            Last30Days: await GetActivityAsync(thirtyDaysAgo, cancellationToken),
            TopCategories: topCategories);
    }

    private async Task<AdminActivityStatsDto> GetActivityAsync(DateTime sinceUtc, CancellationToken cancellationToken)
    {
        return new AdminActivityStatsDto(
            NewPlayers: await _context.Players.AsNoTracking()
                .LongCountAsync(player => player.CreatedAt >= sinceUtc, cancellationToken),
            NewRooms: await _context.GameRooms.AsNoTracking()
                .LongCountAsync(room => room.CreatedAt >= sinceUtc, cancellationToken),
            NewAnswers: await _context.GameAnswers.AsNoTracking()
                .LongCountAsync(answer => answer.AnsweredAtUtc >= sinceUtc, cancellationToken));
    }

    private static int ReadPositiveInt(IConfiguration? configuration, string key, int fallback)
    {
        if (!int.TryParse(configuration?[key], out var value) || value <= 0)
            return fallback;

        return value;
    }
}
