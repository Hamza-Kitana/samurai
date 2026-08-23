using SamuraiRealm.Api.Entities;

namespace SamuraiRealm.Api.DTOs;

public record AuthUserDto(string Id, string Email, string DisplayName, string? Avatar, bool IsAdmin);

public record AuthResponseDto(string Token, AuthUserDto User);

public record LoginRequest(string Email, string Password);

public record RegisterRequest(string Email, string Password, string DisplayName);

public record GoogleLoginRequest(string GoogleId, string Email, string Name, string? Avatar);

public record CategoryDto(string Id, string Slug, string NameAr, string NameEn);

public record ProductDto(
    string Id,
    string Slug,
    string TitleAr,
    string TitleEn,
    string? ShortAr,
    string? ShortEn,
    string? DescriptionAr,
    string? DescriptionEn,
    string Category,
    decimal Price,
    string? ImageUrl,
    List<string> Images,
    List<string> FeaturesAr,
    List<string> FeaturesEn,
    List<string> InstallAr,
    List<string> InstallEn,
    bool IsFeatured,
    bool IsActive,
    string CreatedAt);

public record ProductSnapshotDto(
    string Id,
    string Slug,
    string TitleAr,
    string TitleEn,
    string Category,
    string? ImageUrl);

public record OrderItemDto(
    string Id,
    string ProductId,
    string Title,
    string? TitleEn,
    decimal Price,
    ProductSnapshotDto? Products);

public record OrderDto(
    string Id,
    string UserId,
    decimal Total,
    string Status,
    string CreatedAt,
    List<OrderItemDto> OrderItems,
    UserLookupDto? Customer);

public record ProductFileDto(
    string Id,
    string ProductId,
    string FileName,
    string FileUrl,
    ProductFileProductDto? Products);

public record ProductFileProductDto(
    string Slug,
    string TitleAr,
    string TitleEn,
    string Category,
    string? ImageUrl);

public record InterestDto(
    string Id,
    string ProductId,
    string? UserId,
    string Kind,
    string CreatedAt,
    InterestProductDto? Products);

public record InterestProductDto(string TitleAr, string TitleEn, string Slug);

public record CheckoutItemRequest(string Id, string TitleAr, string TitleEn, decimal Price);

public record CheckoutRequest(List<CheckoutItemRequest> Items);

public record LogInterestRequest(string ProductId, string Kind);

public record UpsertCategoryRequest(string? Id, string Slug, string NameAr, string NameEn);

public record UpsertProductRequest(
    string? Id,
    string Slug,
    string TitleAr,
    string TitleEn,
    string? ShortAr,
    string? ShortEn,
    string? DescriptionAr,
    string? DescriptionEn,
    string Category,
    decimal Price,
    string? ImageUrl,
    List<string>? Images,
    List<string>? FeaturesAr,
    List<string>? FeaturesEn,
    List<string>? InstallAr,
    List<string>? InstallEn,
    bool IsFeatured,
    bool IsActive);

public record UserLookupDto(string Id, string Email, string DisplayName, string? Avatar);
