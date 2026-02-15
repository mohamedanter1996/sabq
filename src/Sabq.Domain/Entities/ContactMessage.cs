namespace Sabq.Domain.Entities;

public class ContactMessage
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public bool IsRead { get; set; } = false;
    public bool IsReplied { get; set; } = false;
    public string? ReplyText { get; set; }
    public DateTime? RepliedAtUtc { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
}
