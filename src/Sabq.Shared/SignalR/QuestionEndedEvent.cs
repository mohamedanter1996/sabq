using Sabq.Shared.DTOs;

namespace Sabq.Shared.SignalR;

public record QuestionEndedEvent(Guid CorrectOptionId, List<PlayerDto> Leaderboard);
