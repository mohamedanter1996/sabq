using Microsoft.AspNetCore.Mvc;
using Sabq.Application.Services;
using Sabq.Shared.DTOs;

namespace Sabq.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("guest")]
    public async Task<ActionResult<GuestLoginResponse>> GuestLogin([FromBody] GuestLoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.DisplayName))
            return BadRequest("Display name is required");

        if (request.DisplayName.Length > 50)
            return BadRequest("Display name too long");

        var response = await _authService.GuestLoginAsync(request);
        return Ok(response);
    }
}
