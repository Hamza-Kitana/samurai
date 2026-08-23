namespace SamuraiRealm.Api.Entities;

public class ProductFile
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ProductId { get; set; } = "";
    public string FileName { get; set; } = "";
    public string? StoragePath { get; set; }
    public string FileUrl { get; set; } = "";
    public long? FileSize { get; set; }
    public string? ContentType { get; set; }

    public Product Product { get; set; } = null!;
}
