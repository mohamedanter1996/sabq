using Microsoft.EntityFrameworkCore;
using Sabq.Domain.Enums;
using Sabq.Infrastructure.Data;
using Sabq.Shared.DTOs;

namespace Sabq.Application.Services;

public class AdminStatsService
{
    private readonly SabqDbContext _context;

    public AdminStatsService(SabqDbContext context)
    {
        _context = context;
    }

    public async Task<AdminStatsSummaryDto> GetSummaryAsync(CancellationToken cancellationToken = default)
    {
        var nowUtc = DateTime.UtcNow;
        var sevenDaysAgo = nowUtc.AddDays(-7);
        var thirtyDaysAgo = nowUtc.AddDays(-30);

        var totalAnswers = await _context.GameAnswers.AsNoTracking().LongCountAsync(cancellationToken);
        var correctAnswers = await _context.GameAnswers.AsNoTracking()
            .LongCountAsync(answer => answer.IsCorrect, cancellationToken);

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
            TotalRooms: await _context.GameRooms.AsNoTracking().LongCountAsync(cancellationToken),
            ActiveRooms: await _context.GameRooms.AsNoTracking()
                .LongCountAsync(room => room.Status == RoomStatus.Lobby || room.Status == RoomStatus.Running, cancellationToken),
            FinishedRooms: await _context.GameRooms.AsNoTracking()
                .LongCountAsync(room => room.Status == RoomStatus.Finished, cancellationToken),
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
}
