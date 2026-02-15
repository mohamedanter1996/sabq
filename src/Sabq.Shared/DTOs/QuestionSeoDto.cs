namespace Sabq.Shared.DTOs;

public class QuestionSeoDto
{
    public Guid Id { get; set; }
    public string TextAr { get; set; } = string.Empty;
    public string TextEn { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string CategorySlug { get; set; } = string.Empty;
    public string CategoryNameAr { get; set; } = string.Empty;
    public string CategoryNameEn { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public int TimeLimitSec { get; set; }
    public List<OptionSeoDto> Options { get; set; } = new();
    public DateTime? LastModified { get; set; }
}

public class OptionSeoDto
{
    public Guid Id { get; set; }
    public string TextAr { get; set; } = string.Empty;
    public string TextEn { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
}

public class QuestionListRequest : PaginatedRequest
{
    public string? CategorySlug { get; set; }
    public string? Difficulty { get; set; }
    public string? SearchTerm { get; set; }
}

public class SitemapUrl
{
    public string Loc { get; set; } = string.Empty;
    public DateTime? LastMod { get; set; }
    public string ChangeFreq { get; set; } = "weekly";
    public string Priority { get; set; } = "0.5";
}
