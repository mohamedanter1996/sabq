namespace Sabq.Shared.DTOs;

public record GuestLoginResponse(Guid PlayerId, string DisplayName, string Token);
