namespace SamuraiRealm.Api.Entities;

public class User
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string Role { get; set; } = "user";
    public string? Provider { get; set; }
    public string? GoogleId { get; set; }
    public string? Avatar { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Order> Orders { get; set; } = [];
    public ICollection<InterestEvent> InterestEvents { get; set; } = [];
}
