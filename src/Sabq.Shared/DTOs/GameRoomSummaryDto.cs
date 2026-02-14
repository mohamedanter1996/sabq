namespace Sabq.Shared.DTOs;

/// <summary>
/// Summary DTO for archived game rooms.
/// Used when detailed answer data is no longer available (> 90 days retention).
/// </summary>
public record GameRoomSummaryDto(
    Guid RoomId,
    DateTime CreatedAtUtc,
    DateTime? FinishedAtUtc,
    int TotalPlayers,
    int TotalQuestions,
    Guid? WinnerPlayerId,
    string? WinnerDisplayName,
    int MaxScore,
    bool IsArchived,
    List<GameRoomPlayerSummaryDto> PlayerSummaries
);

/// <summary>
/// Player performance summary in a game room.
/// Contains aggregate statistics without detailed answer history.
/// </summary>
public record GameRoomPlayerSummaryDto(
    Guid PlayerId,
    string DisplayName,
    int Score,
    int AnsweredCount,
    int CorrectAnswers,
    int WrongAnswers,
    double AccuracyPercent
);
