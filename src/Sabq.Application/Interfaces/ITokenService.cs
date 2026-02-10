using Sabq.Domain.Entities;

namespace Sabq.Application.Interfaces;

public interface ITokenService
{
    string GenerateToken(Player player);
    Guid? ValidateToken(string token);
}
