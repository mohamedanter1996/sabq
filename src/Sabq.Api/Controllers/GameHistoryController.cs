using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sabq.Application.Services;
using Sabq.Shared.DTOs;
using System.Security.Claims;

namespace Sabq.Api.Controllers;

/// <summary>
/// Endpoints for retrieving game history.
/// Returns summary-only data for games older than retention period.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GameHistoryController : ControllerBase
{
    private readonly GameHistoryService _gameHistoryService;

    public GameHistoryController(GameHistoryService gameHistoryService)
    {
        _gameHistoryService = gameHistoryService;
    }

    /// <summary>
    /// Gets game history for a specific room.
    /// </summary>
    /// <remarks>
    /// For games older than 90 days (retention period), only summary data is returned.
    /// Detailed answers are never returned for archived games.
    /// </remarks>
    /// <param name="roomId">The room ID</param>
    [HttpGet("rooms/{roomId:guid}")]
    [ProducesResponseType(typeof(GameHistoryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<GameHistoryDto>> GetRoomHistory(
        Guid roomId,
        CancellationToken cancellationToken = default)
    {
        var history = await _gameHistoryService.GetGameHistoryAsync(roomId, cancellationToken);
        
        if (history == null)
            return NotFound();

        return Ok(history);
    }

    /// <summary>
    /// Gets game history for the current player.
    /// </summary>
    /// <param name="page">Page number (1-based)</param>
    /// <param name="pageSize">Items per page (max 50)</param>
    [HttpGet("my")]
    [ProducesResponseType(typeof(List<GameHistoryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<GameHistoryDto>>> GetMyGameHistory(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var playerId = GetPlayerId();
        if (playerId == null)
            return Unauthorized();

        // Clamp page size
        pageSize = Math.Min(pageSize, 50);

        var history = await _gameHistoryService.GetPlayerGameHistoryAsync(
            playerId.Value,
            page,
            pageSize,
            cancellationToken);

        return Ok(history);
    }

    /// <summary>
    /// Gets game history for a specific player (admin only).
    /// </summary>
    [HttpGet("players/{playerId:guid}")]
    [Authorize(Policy = "Admin")]
    [ProducesResponseType(typeof(List<GameHistoryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<GameHistoryDto>>> GetPlayerHistory(
        Guid playerId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        pageSize = Math.Min(pageSize, 50);

        var history = await _gameHistoryService.GetPlayerGameHistoryAsync(
            playerId,
            page,
            pageSize,
            cancellationToken);

        return Ok(history);
    }

    private Guid? GetPlayerId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (claim == null)
            return null;

        return Guid.TryParse(claim.Value, out var id) ? id : null;
    }
}
