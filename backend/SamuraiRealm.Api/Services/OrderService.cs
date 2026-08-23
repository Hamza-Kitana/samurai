using Microsoft.EntityFrameworkCore;
using SamuraiRealm.Api.Data;
using SamuraiRealm.Api.DTOs;
using SamuraiRealm.Api.Entities;
using SamuraiRealm.Api.Mappers;

namespace SamuraiRealm.Api.Services;

public class OrderService(AppDbContext db)
{
    public async Task<OrderDto> CheckoutAsync(string userId, CheckoutRequest req)
    {
        if (req.Items.Count == 0)
            throw new InvalidOperationException("Cart is empty");

        var productIds = req.Items.Select(i => i.Id).Distinct().ToList();
        var products = await db.Products.Where(p => productIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id);

        var order = new Order
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            Status = "paid",
            CreatedAt = DateTime.UtcNow,
        };

        decimal total = 0;
        foreach (var item in req.Items)
        {
            products.TryGetValue(item.Id, out var product);
            var price = item.Price;
            var titleAr = item.TitleAr;
            var titleEn = item.TitleEn;

            if (product != null)
            {
                price = product.Price;
                titleAr = product.TitleAr;
                titleEn = product.TitleEn;
            }

            total += price;
            order.OrderItems.Add(new OrderItem
            {
                Id = Guid.NewGuid().ToString(),
                ProductId = item.Id,
                Title = titleAr,
                TitleEn = titleEn,
                Price = price,
                ProductSlug = product?.Slug,
                ProductTitleAr = product?.TitleAr,
                ProductTitleEn = product?.TitleEn,
                ProductCategory = product?.CategorySlug,
                ProductImageUrl = product?.ImageUrl,
            });
        }

        order.Total = total;
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        return (await GetOrderByIdAsync(order.Id))!.ToDto();
    }

    public async Task<List<OrderDto>> GetUserOrdersAsync(string userId)
    {
        var orders = await db.Orders
            .Include(o => o.OrderItems)
            .Include(o => o.User)
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
        return orders.Select(o => o.ToDto()).ToList();
    }

    public async Task<List<OrderDto>> GetAllOrdersAsync()
    {
        var orders = await db.Orders
            .Include(o => o.OrderItems)
            .Include(o => o.User)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
        return orders.Select(o => o.ToDto()).ToList();
    }

    public async Task<List<ProductFileDto>> GetUserDownloadsAsync(string userId)
    {
        var productIds = await db.OrderItems
            .Where(i => i.Order.UserId == userId && i.Order.Status == "paid")
            .Select(i => i.ProductId)
            .Distinct()
            .ToListAsync();

        var files = await db.ProductFiles
            .Where(f => productIds.Contains(f.ProductId))
            .ToListAsync();

        var products = await db.Products
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id);

        return files.Select(f => f.ToDto(products.GetValueOrDefault(f.ProductId))).ToList();
    }

    private async Task<Order?> GetOrderByIdAsync(string id) =>
        await db.Orders.Include(o => o.OrderItems).FirstOrDefaultAsync(o => o.Id == id);
}

public class InterestService(AppDbContext db)
{
    private const int MaxEvents = 200;

    public async Task LogAsync(string productId, string kind, string? userId)
    {
        if (!await db.Products.AnyAsync(p => p.Id == productId)) return;

        db.InterestEvents.Add(new InterestEvent
        {
            Id = Guid.NewGuid().ToString(),
            ProductId = productId,
            UserId = userId,
            Kind = kind,
            CreatedAt = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        var count = await db.InterestEvents.CountAsync();
        if (count > MaxEvents)
        {
            var excess = await db.InterestEvents
                .OrderBy(e => e.CreatedAt)
                .Take(count - MaxEvents)
                .ToListAsync();
            db.InterestEvents.RemoveRange(excess);
            await db.SaveChangesAsync();
        }
    }

    public async Task<List<InterestDto>> GetAllAsync()
    {
        var events = await db.InterestEvents
            .OrderByDescending(e => e.CreatedAt)
            .Take(MaxEvents)
            .ToListAsync();

        var productIds = events.Select(e => e.ProductId).Distinct().ToList();
        var products = await db.Products
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id);

        return events.Select(e => e.ToDto(products.GetValueOrDefault(e.ProductId))).ToList();
    }
}
