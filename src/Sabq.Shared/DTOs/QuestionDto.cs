using Sabq.Domain.Enums;

namespace Sabq.Shared.DTOs;

public class QuestionDto
{
    public Guid Id { get; set; }
    public string TextAr { get; set; } = string.Empty;
    public Difficulty Difficulty { get; set; }
    public int TimeLimitSec { get; set; }
    public List<OptionDto> Options { get; set; } = new();
}
