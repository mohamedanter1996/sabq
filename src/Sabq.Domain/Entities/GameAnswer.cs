namespace Sabq.Domain.Entities;

public class GameAnswer
{
    public Guid Id { get; set; }
    public Guid RoomId { get; set; }
    public Guid QuestionId { get; set; }
    public Guid PlayerId { get; set; }
    public Guid OptionId { get; set; }
    public bool IsCorrect { get; set; }
    public DateTime AnsweredAtUtc { get; set; } = DateTime.UtcNow;

    // Navigation
    public GameRoom Room { get; set; } = null!;
    public Question Question { get; set; } = null!;
    public Player Player { get; set; } = null!;
    public Option Option { get; set; } = null!;
}
