namespace Sabq.Shared.DTOs;

public class CategoryDto
{
    public Guid Id { get; set; }
    public string NameAr { get; set; } = string.Empty;
    public string? NameEn { get; set; }
    public string? Slug { get; set; }
    public string? Description { get; set; }
    public int QuestionCount { get; set; }
}
