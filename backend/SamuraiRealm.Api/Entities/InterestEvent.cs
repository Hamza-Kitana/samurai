namespace SamuraiRealm.Api.Entities;

public class InterestEvent
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ProductId { get; set; } = "";
    public string? UserId { get; set; }
    public string Kind { get; set; } = "view";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Product Product { get; set; } = null!;
    public User? User { get; set; }
}
