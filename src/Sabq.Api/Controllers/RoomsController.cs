using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sabq.Application.Services;
using Sabq.Shared.DTOs;
using System.Security.Claims;

namespace Sabq.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RoomsController : ControllerBase
{
    private readonly RoomService _roomService;
    private readonly CategoryService _categoryService;
    private readonly GameService _gameService;

    public RoomsController(RoomService roomService, CategoryService categoryService, GameService gameService)
    {
        _roomService = roomService;
        _categoryService = categoryService;
        _gameService = gameService;
    }

    [HttpGet("categories")]
    public async Task<ActionResult<List<CategoryDto>>> GetCategories()
    {
        var categories = await _categoryService.GetActiveCategoriesAsync();
        return Ok(categories);
    }

    [HttpPost]
    public async Task<ActionResult<CreateRoomResponse>> CreateRoom([FromBody] CreateRoomRequest request)
    {
        var playerId = GetPlayerId();
        if (playerId == null)
            return Unauthorized();

        if (request.CategoryIds.Count == 0)
            return BadRequest("At least one category is required");

        if (request.Difficulties.Count == 0)
            return BadRequest("At least one difficulty is required");

        if (request.QuestionCount < 5 || request.QuestionCount > 50)
            return BadRequest("Question count must be between 5 and 50");

        var response = await _roomService.CreateRoomAsync(request, playerId.Value);
        return Ok(response);
    }

    [HttpPost("{code}/join")]
    public async Task<ActionResult<JoinRoomResponse>> JoinRoom(string code)
    {
        var playerId = GetPlayerId();
        if (playerId == null)
            return Unauthorized();

        try
        {
            var snapshot = await _roomService.JoinRoomAsync(code.ToUpper(), playerId.Value);
            if (snapshot == null)
                return NotFound("Room not found");

            return Ok(new JoinRoomResponse(snapshot));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{code}/start")]
    public async Task<ActionResult> StartGame(string code)
    {
        var playerId = GetPlayerId();
        if (playerId == null)
            return Unauthorized();

        try
        {
            await _gameService.StartGameAsync(code.ToUpper(), playerId.Value);
            return Ok();
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    private Guid? GetPlayerId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (claim == null)
            return null;

        return Guid.TryParse(claim.Value, out var id) ? id : null;
    }
}
