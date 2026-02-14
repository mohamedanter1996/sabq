namespace Sabq.Shared.DTOs;

/// <summary>
/// Game history response that can contain either detailed or summary data.
/// For games older than retention period, only summary is returned.
/// </summary>
public record GameHistoryDto(
    Guid RoomId,
    string RoomCode,
    DateTime CreatedAtUtc,
    DateTime? FinishedAtUtc,
    int TotalPlayers,
    int TotalQuestions,
    bool IsArchived,
    
    // For non-archived games (detailed data available)
    List<GameHistoryPlayerDto>? Players,
    List<GameHistoryAnswerDto>? Answers,
    
    // For archived games (summary only)
    GameRoomSummaryDto? Summary
);

/// <summary>
/// Detailed player information for non-archived games.
/// </summary>
public record GameHistoryPlayerDto(
    Guid PlayerId,
    string DisplayName,
    int Score,
    DateTime JoinedAt
);

/// <summary>
/// Detailed answer information for non-archived games.
/// </summary>
public record GameHistoryAnswerDto(
    Guid Id,
    Guid PlayerId,
    Guid QuestionId,
    Guid OptionId,
    bool IsCorrect,
    DateTime AnsweredAtUtc
);
