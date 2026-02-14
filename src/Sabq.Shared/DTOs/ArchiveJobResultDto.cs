namespace Sabq.Shared.DTOs;

/// <summary>
/// Response from the archive maintenance job.
/// </summary>
public record ArchiveJobResultDto(
    long ArchivedAnswersCount,
    int AffectedRoomsCount,
    DateTime StartedAtUtc,
    DateTime FinishedAtUtc,
    long DurationMs
);
