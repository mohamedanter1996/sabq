namespace Sabq.Domain.Entities;

public class Category
{
    public Guid Id { get; set; }
    public string NameAr { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    // Navigation
    public ICollection<Question> Questions { get; set; } = new List<Question>();
}
