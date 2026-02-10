namespace Sabq.Shared.DTOs;

public class OptionDto
{
    public Guid Id { get; set; }
    public string TextAr { get; set; } = string.Empty;
    public bool? IsCorrect { get; set; } // null when sent to clients, true/false server-side
}
