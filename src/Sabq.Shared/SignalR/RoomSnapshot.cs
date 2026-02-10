using Sabq.Domain.Enums;

namespace Sabq.Shared.SignalR;

public class RoomSnapshot
{
    public string RoomCode { get; set; } = string.Empty;
    public RoomStatus Status { get; set; }
    public Guid HostPlayerId { get; set; }
    public List<DTOs.PlayerDto> Players { get; set; } = new();
    public int TotalQuestions { get; set; }
    public int CurrentQuestionIndex { get; set; }
}
