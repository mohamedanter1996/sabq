namespace Sabq.Domain.Entities;

/// <summary>
/// Summary of a game room for archived/completed games.
/// Contains aggregate data without detailed answer history.
/// </summary>
public class GameRoomSummary
{
    public Guid RoomId { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? FinishedAtUtc { get; set; }
    public int TotalPlayers { get; set; }
    public int TotalQuestions { get; set; }
    public Guid? WinnerPlayerId { get; set; }
    public int MaxScore { get; set; }
    public bool IsArchived { get; set; }
}
