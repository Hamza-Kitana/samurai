namespace SamuraiRealm.Api.Services;

public class FileStorageService(IWebHostEnvironment env, IConfiguration config)
{
    private readonly string _root = Path.Combine(env.ContentRootPath, "uploads");

    public string PackagesDir => Path.Combine(_root, "packages");
    public string ImagesDir => Path.Combine(_root, "images");

    public void EnsureDirectories()
    {
        Directory.CreateDirectory(PackagesDir);
        Directory.CreateDirectory(ImagesDir);
    }

    public string PublicBaseUrl => config["PublicBaseUrl"]?.TrimEnd('/') ?? "http://localhost:5000";

    public async Task<(string storagePath, string publicUrl, long size, string contentType)> SavePackageAsync(
        string productId,
        string fileName,
        Stream stream,
        string? contentType)
    {
        EnsureDirectories();
        var safeName = Path.GetFileName(fileName);
        var ext = Path.GetExtension(safeName);
        var storageName = $"{productId}{ext}";
        var fullPath = Path.Combine(PackagesDir, storageName);

        if (File.Exists(fullPath)) File.Delete(fullPath);

        await using var fs = File.Create(fullPath);
        await stream.CopyToAsync(fs);
        var size = new FileInfo(fullPath).Length;
        var url = $"{PublicBaseUrl}/uploads/packages/{storageName}";
        return (storageName, url, size, contentType ?? "application/octet-stream");
    }

    public async Task<(string storagePath, string publicUrl)> SaveImageAsync(string productId, int index, Stream stream, string ext)
    {
        EnsureDirectories();
        var storageName = $"{productId}-{index}{ext}";
        var fullPath = Path.Combine(ImagesDir, storageName);

        await using var fs = File.Create(fullPath);
        await stream.CopyToAsync(fs);
        var url = $"{PublicBaseUrl}/uploads/images/{storageName}";
        return (storageName, url);
    }

    public void DeletePackage(string? storagePath)
    {
        if (string.IsNullOrWhiteSpace(storagePath)) return;
        var full = Path.Combine(PackagesDir, storagePath);
        if (File.Exists(full)) File.Delete(full);
    }

    public string? GetPackagePath(string? storagePath)
    {
        if (string.IsNullOrWhiteSpace(storagePath)) return null;
        var full = Path.Combine(PackagesDir, storagePath);
        return File.Exists(full) ? full : null;
    }
}
