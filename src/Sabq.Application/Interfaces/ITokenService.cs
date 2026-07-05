using Sabq.Domain.Entities;

namespace Sabq.Application.Interfaces;

public interface ITokenService
{
    string GenerateToken(Player player);
    string GenerateAdminToken(string username, DateTime expiresAtUtc);
    Guid? ValidateToken(string token);
}
