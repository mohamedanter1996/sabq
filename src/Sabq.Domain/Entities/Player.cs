namespace Sabq.Domain.Entities;

public class Player
{
    public Guid Id { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
