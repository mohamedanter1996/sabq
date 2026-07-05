namespace Sabq.Shared.DTOs;

public record AdminStatsSummaryDto(
    long TotalPlayers,
    long TotalRooms,
    long ActiveRooms,
    long FinishedRooms,
    long TotalAnswers,
    long CorrectAnswers,
    double CorrectAnswerRate,
    long TotalQuestions,
    long ActiveQuestions,
    long TotalCategories,
    long ContactMessages,
    long UnreadContactMessages,
    AdminActivityStatsDto Last7Days,
    AdminActivityStatsDto Last30Days,
    IReadOnlyList<AdminCategoryUsageDto> TopCategories);

public record AdminActivityStatsDto(
    long NewPlayers,
    long NewRooms,
    long NewAnswers);

public record AdminCategoryUsageDto(
    string CategorySlug,
    string CategoryNameAr,
    string CategoryNameEn,
    long AnswerCount);
