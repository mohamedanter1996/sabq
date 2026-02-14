namespace Sabq.Domain.Entities;

/// <summary>
/// Archive table for game answers older than retention period.
/// Used for compliance and historical queries only.
/// </summary>
public class GameAnswerArchive
{
    public Guid Id { get; set; }
    public Guid RoomId { get; set; }
    public Guid QuestionId { get; set; }
    public Guid PlayerId { get; set; }
    public Guid OptionId { get; set; }
    public bool IsCorrect { get; set; }
    public DateTime AnsweredAtUtc { get; set; }
    public DateTime ArchivedAtUtc { get; set; } = DateTime.UtcNow;
}
