namespace Sabq.Domain.Entities;

public class GameRoomPlayer
{
    public Guid RoomId { get; set; }
    public Guid PlayerId { get; set; }
    public int Score { get; set; } = 0;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public GameRoom Room { get; set; } = null!;
    public Player Player { get; set; } = null!;
}
