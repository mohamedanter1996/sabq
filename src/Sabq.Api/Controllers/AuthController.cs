using Microsoft.AspNetCore.Mvc;
using Sabq.Api.Services;
using Sabq.Application.Services;
using Sabq.Shared.DTOs;

namespace Sabq.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly AdminAuthService _adminAuthService;

    public AuthController(AuthService authService, AdminAuthService adminAuthService)
    {
        _authService = authService;
        _adminAuthService = adminAuthService;
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

    [HttpPost("admin")]
    [ProducesResponseType(typeof(AdminLoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public ActionResult<AdminLoginResponse> AdminLogin([FromBody] AdminLoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            return Unauthorized(new { error = "Invalid admin credentials" });

        var response = _adminAuthService.Login(request);
        if (response == null)
            return Unauthorized(new { error = "Invalid admin credentials" });

        return Ok(response);
    }
}
