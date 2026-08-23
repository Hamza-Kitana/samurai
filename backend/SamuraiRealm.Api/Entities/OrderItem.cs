namespace SamuraiRealm.Api.Entities;

public class OrderItem
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string OrderId { get; set; } = "";
    public string ProductId { get; set; } = "";
    public string Title { get; set; } = "";
    public string? TitleEn { get; set; }
    public decimal Price { get; set; }
    public string? ProductSlug { get; set; }
    public string? ProductTitleAr { get; set; }
    public string? ProductTitleEn { get; set; }
    public string? ProductCategory { get; set; }
    public string? ProductImageUrl { get; set; }

    public Order Order { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
