using SamuraiRealm.Api.DTOs;
using SamuraiRealm.Api.Entities;

namespace SamuraiRealm.Api.Mappers;

public static class EntityMappers
{
    public static CategoryDto ToDto(this Category c) =>
        new(c.Id, c.Slug, c.NameAr, c.NameEn);

    public static ProductDto ToDto(this Product p) =>
        new(
            p.Id,
            p.Slug,
            p.TitleAr,
            p.TitleEn,
            p.ShortAr,
            p.ShortEn,
            p.DescriptionAr,
            p.DescriptionEn,
            p.CategorySlug,
            p.Price,
            p.ImageUrl,
            JsonHelper.ParseList(p.ImagesJson),
            JsonHelper.ParseList(p.FeaturesArJson),
            JsonHelper.ParseList(p.FeaturesEnJson),
            JsonHelper.ParseList(p.InstallArJson),
            JsonHelper.ParseList(p.InstallEnJson),
            p.IsFeatured,
            p.IsActive,
            p.CreatedAt.ToString("O"));

    public static ProductSnapshotDto ToSnapshot(this Product p) =>
        new(p.Id, p.Slug, p.TitleAr, p.TitleEn, p.CategorySlug, p.ImageUrl);

    public static ProductSnapshotDto ToSnapshot(this OrderItem item) =>
        new(
            item.ProductId,
            item.ProductSlug ?? "",
            item.ProductTitleAr ?? item.Title,
            item.ProductTitleEn ?? item.TitleEn ?? "",
            item.ProductCategory ?? "",
            item.ProductImageUrl);

    public static OrderItemDto ToDto(this OrderItem item) =>
        new(
            item.Id,
            item.ProductId,
            item.Title,
            item.TitleEn,
            item.Price,
            item.ToSnapshot());

    public static OrderDto ToDto(this Order order) =>
        new(
            order.Id,
            order.UserId,
            order.Total,
            order.Status,
            order.CreatedAt.ToString("O"),
            order.OrderItems.Select(i => i.ToDto()).ToList(),
            order.User?.ToLookup());

    public static ProductFileDto ToDto(this ProductFile file, Product? product = null)
    {
        ProductFileProductDto? snapshot = null;
        if (product != null)
        {
            snapshot = new ProductFileProductDto(
                product.Slug,
                product.TitleAr,
                product.TitleEn,
                product.CategorySlug,
                product.ImageUrl);
        }

        return new ProductFileDto(
            file.Id,
            file.ProductId,
            file.FileName,
            file.FileUrl,
            snapshot);
    }

    public static InterestDto ToDto(this InterestEvent e, Product? product = null)
    {
        InterestProductDto? snapshot = null;
        if (product != null)
        {
            snapshot = new InterestProductDto(product.TitleAr, product.TitleEn, product.Slug);
        }

        return new InterestDto(
            e.Id,
            e.ProductId,
            e.UserId,
            e.Kind,
            e.CreatedAt.ToString("O"),
            snapshot);
    }

    public static AuthUserDto ToAuthDto(this User u) =>
        new(u.Id, u.Email, u.DisplayName, u.Avatar, u.Role == "admin");

    public static UserLookupDto ToLookup(this User u) =>
        new(u.Id, u.Email, u.DisplayName, u.Avatar);
}
