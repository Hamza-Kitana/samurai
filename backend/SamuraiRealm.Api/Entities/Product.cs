namespace SamuraiRealm.Api.Entities;

public class Product
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Slug { get; set; } = "";
    public string TitleAr { get; set; } = "";
    public string TitleEn { get; set; } = "";
    public string? ShortAr { get; set; }
    public string? ShortEn { get; set; }
    public string? DescriptionAr { get; set; }
    public string? DescriptionEn { get; set; }
    public string CategorySlug { get; set; } = "";
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    public string ImagesJson { get; set; } = "[]";
    public string FeaturesArJson { get; set; } = "[]";
    public string FeaturesEnJson { get; set; } = "[]";
    public string InstallArJson { get; set; } = "[]";
    public string InstallEnJson { get; set; } = "[]";
    public bool IsFeatured { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Category? Category { get; set; }
    public ProductFile? File { get; set; }
    public ICollection<OrderItem> OrderItems { get; set; } = [];
    public ICollection<InterestEvent> InterestEvents { get; set; } = [];
}
