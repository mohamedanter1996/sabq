using Sabq.Shared.DTOs;

namespace Sabq.Shared.SignalR;

public record GameEndedEvent(List<PlayerDto> FinalLeaderboard);
