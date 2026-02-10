using Sabq.Domain.Enums;

namespace Sabq.Domain.Entities;

public class GameRoom
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public Guid HostPlayerId { get; set; }
    public RoomStatus Status { get; set; } = RoomStatus.Lobby;
    public string? SettingsJson { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<GameRoomPlayer> Players { get; set; } = new List<GameRoomPlayer>();
    public ICollection<GameRoomQuestion> Questions { get; set; } = new List<GameRoomQuestion>();
}
