using Microsoft.IdentityModel.Tokens;
using Sabq.Application.Interfaces;
using Sabq.Domain.Entities;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Sabq.Application.Services;

public class JwtTokenService : ITokenService
{
    private readonly string _secret;
    private readonly string _issuer;
    private readonly string _audience;

    public JwtTokenService(string secret, string issuer, string audience)
    {
        _secret = secret;
        _issuer = issuer;
        _audience = audience;
    }

    public string GenerateToken(Player player)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, player.Id.ToString()),
            new Claim(ClaimTypes.Name, player.DisplayName),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public Guid? ValidateToken(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_secret);

            tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = _issuer,
                ValidateAudience = true,
                ValidAudience = _audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            }, out SecurityToken validatedToken);

            var jwtToken = (JwtSecurityToken)validatedToken;
            var playerIdClaim = jwtToken.Claims.First(x => x.Type == ClaimTypes.NameIdentifier).Value;
            return Guid.Parse(playerIdClaim);
        }
        catch
        {
            return null;
        }
    }
}
