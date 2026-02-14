namespace Sabq.Domain.Entities;

/// <summary>
/// Summary of a player's performance in a specific game room.
/// Contains aggregate statistics without detailed answer history.
/// </summary>
public class GameRoomPlayerSummary
{
    public Guid RoomId { get; set; }
    public Guid PlayerId { get; set; }
    public int Score { get; set; }
    public int AnsweredCount { get; set; }
    public int CorrectAnswers { get; set; }
    public int WrongAnswers { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
