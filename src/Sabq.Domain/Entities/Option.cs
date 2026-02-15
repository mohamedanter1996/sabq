namespace Sabq.Domain.Entities;

public class Option
{
    public Guid Id { get; set; }
    public Guid QuestionId { get; set; }
    public string TextAr { get; set; } = string.Empty;
    public string TextEn { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int DisplayOrder { get; set; } = 0;

    // Navigation
    public Question Question { get; set; } = null!;
}
