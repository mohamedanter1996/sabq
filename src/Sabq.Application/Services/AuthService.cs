using Microsoft.EntityFrameworkCore;
using Sabq.Application.Interfaces;
using Sabq.Domain.Entities;
using Sabq.Infrastructure.Data;
using Sabq.Shared.DTOs;

namespace Sabq.Application.Services;

public class AuthService
{
    private readonly SabqDbContext _context;
    private readonly ITokenService _tokenService;

    public AuthService(SabqDbContext context, ITokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    public async Task<GuestLoginResponse> GuestLoginAsync(GuestLoginRequest request)
    {
        var player = new Player
        {
            Id = Guid.NewGuid(),
            DisplayName = request.DisplayName.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _context.Players.Add(player);
        await _context.SaveChangesAsync();

        var token = _tokenService.GenerateToken(player);

        return new GuestLoginResponse(player.Id, player.DisplayName, token);
    }

    public async Task<Player?> GetPlayerAsync(Guid playerId)
    {
        return await _context.Players.FindAsync(playerId);
    }
}
