using Sabq.Domain.Enums;

namespace Sabq.Shared.DTOs;

public class CreateRoomRequest
{
    public List<Guid> CategoryIds { get; set; } = new();
    public List<Difficulty> Difficulties { get; set; } = new();
    public int QuestionCount { get; set; } = 10;
    public int TimeLimitSec { get; set; } = 15;
    public bool HostParticipates { get; set; } = true;
}
