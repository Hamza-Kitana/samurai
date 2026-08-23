using Microsoft.EntityFrameworkCore;
using SamuraiRealm.Api.Data;
using SamuraiRealm.Api.DTOs;
using SamuraiRealm.Api.Entities;
using SamuraiRealm.Api.Mappers;

namespace SamuraiRealm.Api.Services;

public class CatalogService(AppDbContext db)
{
    public async Task<List<CategoryDto>> GetCategoriesAsync()
    {
        var items = await db.Categories.OrderBy(c => c.NameEn).ToListAsync();
        return items.Select(c => c.ToDto()).ToList();
    }

    public async Task<List<ProductDto>> GetProductsAsync(string? category, bool featuredOnly, bool includeInactive)
    {
        var q = db.Products.AsQueryable();
        if (!includeInactive) q = q.Where(p => p.IsActive);
        if (featuredOnly) q = q.Where(p => p.IsFeatured);
        if (!string.IsNullOrWhiteSpace(category) && category != "all")
            q = q.Where(p => p.CategorySlug == category);

        var items = await q.OrderByDescending(p => p.CreatedAt).ToListAsync();
        return items.Select(p => p.ToDto()).ToList();
    }

    public async Task<ProductDto?> GetBySlugAsync(string slug)
    {
        var p = await db.Products.FirstOrDefaultAsync(x => x.Slug == slug && x.IsActive);
        return p?.ToDto();
    }

    public async Task<CategoryDto> UpsertCategoryAsync(UpsertCategoryRequest req)
    {
        var slug = NormalizeSlug(string.IsNullOrWhiteSpace(req.Slug)
            ? req.NameEn.Trim()
            : req.Slug.Trim());

        if (string.IsNullOrWhiteSpace(req.NameAr.Trim()))
            throw new InvalidOperationException("Category name is required");

        Category category;
        if (!string.IsNullOrWhiteSpace(req.Id))
        {
            category = await db.Categories.FindAsync(req.Id)
                ?? throw new InvalidOperationException("Category not found");
            var oldSlug = category.Slug;
            category.Slug = slug;
            category.NameAr = req.NameAr.Trim();
            category.NameEn = string.IsNullOrWhiteSpace(req.NameEn) ? req.NameAr.Trim() : req.NameEn.Trim();

            if (oldSlug != slug)
            {
                var products = await db.Products.Where(p => p.CategorySlug == oldSlug).ToListAsync();
                foreach (var p in products) p.CategorySlug = slug;
            }
        }
        else
        {
            if (await db.Categories.AnyAsync(c => c.Slug == slug))
                throw new InvalidOperationException("Category slug already exists");

            category = new Category
            {
                Id = Guid.NewGuid().ToString(),
                Slug = slug,
                NameAr = req.NameAr.Trim(),
                NameEn = string.IsNullOrWhiteSpace(req.NameEn) ? req.NameAr.Trim() : req.NameEn.Trim(),
            };
            db.Categories.Add(category);
        }

        await db.SaveChangesAsync();
        return category.ToDto();
    }

    public async Task DeleteCategoryAsync(string id)
    {
        var category = await db.Categories.FindAsync(id)
            ?? throw new InvalidOperationException("Category not found");

        if (await db.Products.AnyAsync(p => p.CategorySlug == category.Slug))
            throw new InvalidOperationException("Category in use");

        db.Categories.Remove(category);
        await db.SaveChangesAsync();
    }

    public async Task<ProductDto> UpsertProductAsync(UpsertProductRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Slug) || string.IsNullOrWhiteSpace(req.TitleAr))
            throw new InvalidOperationException("Product slug and title are required");

        if (!await db.Categories.AnyAsync(c => c.Slug == req.Category))
            throw new InvalidOperationException("Category not found");

        Product product;
        if (!string.IsNullOrWhiteSpace(req.Id))
        {
            product = await db.Products.Include(p => p.File).FirstOrDefaultAsync(p => p.Id == req.Id)
                ?? throw new InvalidOperationException("Product not found");
        }
        else
        {
            product = new Product { Id = Guid.NewGuid().ToString() };
            db.Products.Add(product);
            db.ProductFiles.Add(new ProductFile
            {
                Id = Guid.NewGuid().ToString(),
                ProductId = product.Id,
                FileName = $"{req.Slug}.zip",
                FileUrl = $"#download-{req.Slug}",
            });
        }

        var images = req.Images?.Where(i => !string.IsNullOrWhiteSpace(i)).ToList() ?? [];
        product.Slug = req.Slug.Trim();
        product.TitleAr = req.TitleAr.Trim();
        product.TitleEn = req.TitleEn.Trim();
        product.ShortAr = req.ShortAr;
        product.ShortEn = req.ShortEn;
        product.DescriptionAr = req.DescriptionAr;
        product.DescriptionEn = req.DescriptionEn;
        product.CategorySlug = req.Category;
        product.Price = req.Price;
        product.ImageUrl = req.ImageUrl ?? images.FirstOrDefault();
        product.ImagesJson = JsonHelper.ToJson(images);
        product.FeaturesArJson = JsonHelper.ToJson(req.FeaturesAr ?? []);
        product.FeaturesEnJson = JsonHelper.ToJson(req.FeaturesEn ?? []);
        product.InstallArJson = JsonHelper.ToJson(req.InstallAr ?? []);
        product.InstallEnJson = JsonHelper.ToJson(req.InstallEn ?? []);
        product.IsFeatured = req.IsFeatured;
        product.IsActive = req.IsActive;

        if (product.File != null && product.File.FileUrl.StartsWith("#download-"))
        {
            product.File.FileName = $"{product.Slug}.zip";
            product.File.FileUrl = $"#download-{product.Slug}";
        }

        await db.SaveChangesAsync();
        return product.ToDto();
    }

    public async Task<Product?> GetEntityByIdAsync(string id) =>
        await db.Products.Include(p => p.File).FirstOrDefaultAsync(p => p.Id == id);

    public async Task DeleteProductAsync(string id, FileStorageService files)
    {
        var product = await db.Products.Include(p => p.File).FirstOrDefaultAsync(p => p.Id == id);
        if (product == null) return;

        if (product.File?.StoragePath != null)
            files.DeletePackage(product.File.StoragePath);

        db.Products.Remove(product);
        await db.SaveChangesAsync();
    }

    public async Task<ProductFileDto?> GetProductFileMetaAsync(string productId)
    {
        var file = await db.ProductFiles.FirstOrDefaultAsync(f => f.ProductId == productId);
        if (file == null) return null;
        var product = await db.Products.FindAsync(productId);
        return file.ToDto(product);
    }

    public async Task<ProductFileDto> UpsertProductFileAsync(
        string productId,
        string fileName,
        string fileUrl,
        string? storagePath,
        long? size,
        string? contentType,
        FileStorageService files,
        bool clearFile)
    {
        var product = await db.Products.FindAsync(productId)
            ?? throw new InvalidOperationException("Product not found");

        var file = await db.ProductFiles.FirstOrDefaultAsync(f => f.ProductId == productId);
        if (file == null)
        {
            file = new ProductFile { Id = Guid.NewGuid().ToString(), ProductId = productId };
            db.ProductFiles.Add(file);
        }
        else if (clearFile)
        {
            files.DeletePackage(file.StoragePath);
            file.StoragePath = null;
            file.FileSize = null;
            file.ContentType = null;
        }

        file.FileName = fileName;
        file.FileUrl = fileUrl;
        if (storagePath != null)
        {
            if (file.StoragePath != null && file.StoragePath != storagePath)
                files.DeletePackage(file.StoragePath);
            file.StoragePath = storagePath;
            file.FileSize = size;
            file.ContentType = contentType;
        }

        await db.SaveChangesAsync();
        return file.ToDto(product);
    }

    private static string NormalizeSlug(string input) =>
        input.ToLowerInvariant()
            .Replace(" ", "-")
            .Trim();
}
