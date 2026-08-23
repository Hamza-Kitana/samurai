namespace SamuraiRealm.Api.Entities;

public class Order
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = "";
    public decimal Total { get; set; }
    public string Status { get; set; } = "paid";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public ICollection<OrderItem> OrderItems { get; set; } = [];
}
