using Sabq.Shared.DTOs;

namespace Sabq.Shared.SignalR;

public record ScoresUpdatedEvent(List<PlayerDto> Leaderboard);
