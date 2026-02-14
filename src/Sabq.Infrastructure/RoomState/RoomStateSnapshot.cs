using Sabq.Domain.Enums;
using Sabq.Shared.DTOs;

namespace Sabq.Infrastructure.RoomState;

public class RoomStateSnapshot
{
    public string RoomCode { get; set; } = string.Empty;
    public Guid RoomId { get; set; }
    public Guid HostPlayerId { get; set; }
    public bool HostParticipates { get; set; } = true;
    public RoomStatus Status { get; set; }
    public Dictionary<Guid, PlayerDto> Players { get; set; } = new();
    public List<Guid> QuestionIds { get; set; } = new();
    public int CurrentQuestionIndex { get; set; } = -1;
    public Guid? CurrentQuestionId { get; set; }
    public HashSet<Guid> PlayersAnsweredCurrentQuestion { get; set; } = new();
    public Dictionary<Guid, Guid> PlayerSelectedOptions { get; set; } = new(); // PlayerId -> OptionId
    public DateTime? QuestionStartedAt { get; set; }
}
