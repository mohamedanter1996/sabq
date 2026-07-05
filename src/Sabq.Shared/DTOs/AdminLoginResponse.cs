namespace Sabq.Shared.DTOs;

public record AdminLoginResponse(string Token, string Username, DateTime ExpiresAtUtc);
