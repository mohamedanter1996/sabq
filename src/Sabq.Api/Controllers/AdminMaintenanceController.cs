using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sabq.Application.Services;
using Sabq.Shared.DTOs;

namespace Sabq.Api.Controllers;

/// <summary>
/// Admin-only endpoints for system maintenance operations.
/// </summary>
[ApiController]
[Route("api/admin/maintenance")]
[Authorize(Policy = "Admin")]
public class AdminMaintenanceController : ControllerBase
{
    private readonly ArchiveService _archiveService;
    private readonly ILogger<AdminMaintenanceController> _logger;

    public AdminMaintenanceController(ArchiveService archiveService, ILogger<AdminMaintenanceController> logger)
    {
        _archiveService = archiveService;
        _logger = logger;
    }

    /// <summary>
    /// Archives old game answers and creates summaries for games older than retention period.
    /// </summary>
    /// <remarks>
    /// This endpoint triggers the archive stored procedure which:
    /// 1. Identifies rooms with all answers older than 90 days
    /// 2. Creates/updates summary records for those rooms
    /// 3. Moves answer data to archive table in batches
    /// 4. Removes archived answers from hot table
    /// </remarks>
    /// <param name="retentionDays">Days to retain data (default: 90)</param>
    /// <param name="batchSize">Batch size for archive operations (default: 10000)</param>
    /// <returns>Summary of archive operation</returns>
    [HttpPost("archive-old-games")]
    [ProducesResponseType(typeof(ArchiveJobResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ArchiveJobResultDto>> ArchiveOldGames(
        [FromQuery] int retentionDays = ArchiveService.DefaultRetentionDays,
        [FromQuery] int batchSize = ArchiveService.DefaultBatchSize,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "Admin {UserId} triggered archive operation with RetentionDays={RetentionDays}, BatchSize={BatchSize}",
            User.Identity?.Name ?? "Unknown",
            retentionDays,
            batchSize);

        try
        {
            var result = await _archiveService.ArchiveOldGamesAsync(retentionDays, batchSize, cancellationToken);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Archive operation failed");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                new { error = "Archive operation failed", details = ex.Message });
        }
    }

    /// <summary>
    /// Gets recent archive job execution logs.
    /// </summary>
    /// <param name="count">Number of recent logs to retrieve (default: 10)</param>
    [HttpGet("archive-logs")]
    [ProducesResponseType(typeof(List<ArchiveJobLogDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<ArchiveJobLogDto>>> GetArchiveLogs(
        [FromQuery] int count = 10,
        CancellationToken cancellationToken = default)
    {
        var logs = await _archiveService.GetRecentJobLogsAsync(count, cancellationToken);
        return Ok(logs.Select(l => new ArchiveJobLogDto(
            l.Id,
            l.RunAtUtc,
            l.RetentionDays,
            l.BatchSize,
            l.ArchivedAnswersCount,
            l.AffectedRoomsCount,
            l.DurationMs,
            l.Status,
            l.ErrorMessage
        )));
    }
}

/// <summary>
/// DTO for archive job log entries.
/// </summary>
public record ArchiveJobLogDto(
    long Id,
    DateTime RunAtUtc,
    int RetentionDays,
    int BatchSize,
    long ArchivedAnswersCount,
    int AffectedRoomsCount,
    long DurationMs,
    string Status,
    string? ErrorMessage
);
