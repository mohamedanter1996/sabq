namespace Sabq.Domain.Entities;

/// <summary>
/// Log entry for archive job executions.
/// Tracks job runs, performance metrics, and errors.
/// </summary>
public class ArchiveJobLog
{
    public long Id { get; set; }
    public DateTime RunAtUtc { get; set; } = DateTime.UtcNow;
    public int RetentionDays { get; set; }
    public int BatchSize { get; set; }
    public long ArchivedAnswersCount { get; set; }
    public int AffectedRoomsCount { get; set; }
    public long DurationMs { get; set; }
    public string Status { get; set; } = "Success"; // Success / Failed
    public string? ErrorMessage { get; set; }
}
