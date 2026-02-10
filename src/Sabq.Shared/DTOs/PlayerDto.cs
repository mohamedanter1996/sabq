namespace Sabq.Shared.DTOs;

public class PlayerDto
{
    public Guid Id { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public int Score { get; set; }
}
