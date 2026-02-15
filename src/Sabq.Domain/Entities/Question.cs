using Sabq.Domain.Enums;

namespace Sabq.Domain.Entities;

public class Question
{
    public Guid Id { get; set; }
    public Guid CategoryId { get; set; }
    public Difficulty Difficulty { get; set; }
    public string TextAr { get; set; } = string.Empty;
    public string TextEn { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public int TimeLimitSec { get; set; } = 15;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }

    // Navigation
    public Category Category { get; set; } = null!;
    public ICollection<Option> Options { get; set; } = new List<Option>();
}
