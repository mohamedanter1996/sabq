namespace Sabq.Domain.Entities;

public class GameRoomQuestion
{
    public Guid RoomId { get; set; }
    public Guid QuestionId { get; set; }
    public int OrderIndex { get; set; }

    // Navigation
    public GameRoom Room { get; set; } = null!;
    public Question Question { get; set; } = null!;
}
