namespace Sabq.Shared.DTOs;

public class ContactMessageRequest
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public class ContactMessageResponse
{
    public bool Success { get; set; }
    public string MessageAr { get; set; } = string.Empty;
    public string MessageEn { get; set; } = string.Empty;
}

public class ContactMessageDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
    public bool IsRead { get; set; }
    public bool IsReplied { get; set; }
    public string? ReplyText { get; set; }
    public DateTime? RepliedAtUtc { get; set; }
}
