namespace SamuraiRealm.Api.Entities;

public class Category
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Slug { get; set; } = "";
    public string NameAr { get; set; } = "";
    public string NameEn { get; set; } = "";

    public ICollection<Product> Products { get; set; } = [];
}
