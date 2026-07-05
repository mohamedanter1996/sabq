using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sabq.Application.Services;
using Sabq.Shared.DTOs;

namespace Sabq.Api.Controllers;

[ApiController]
[Route("api/admin/stats")]
[Authorize(Policy = "Admin")]
public class AdminStatsController : ControllerBase
{
    private readonly AdminStatsService _adminStatsService;

    public AdminStatsController(AdminStatsService adminStatsService)
    {
        _adminStatsService = adminStatsService;
    }

    [HttpGet("summary")]
    [ProducesResponseType(typeof(AdminStatsSummaryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<AdminStatsSummaryDto>> GetSummary(CancellationToken cancellationToken = default)
    {
        var summary = await _adminStatsService.GetSummaryAsync(cancellationToken);
        return Ok(summary);
    }
}
