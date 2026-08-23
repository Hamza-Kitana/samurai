using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SamuraiRealm.Api.DTOs;
using SamuraiRealm.Api.Services;
using System.Security.Claims;

namespace SamuraiRealm.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AuthService auth) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterRequest req)
    {
        try
        {
            return Ok(await auth.RegisterAsync(req));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginRequest req)
    {
        try
        {
            return Ok(await auth.LoginAsync(req));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("google")]
    public async Task<ActionResult<AuthResponseDto>> Google(GoogleLoginRequest req)
    {
        try
        {
            return Ok(await auth.GoogleLoginAsync(req));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<AuthUserDto>> Me()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (id == null) return Unauthorized();
        var user = await auth.GetMeAsync(id);
        return user == null ? Unauthorized() : Ok(user);
    }
}

[ApiController]
[Route("api/products")]
public class ProductsController(CatalogService catalog) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ProductDto>>> List(
        [FromQuery] string? category,
        [FromQuery] bool featured = false,
        [FromQuery] bool include_inactive = false) =>
        Ok(await catalog.GetProductsAsync(category, featured, include_inactive));

    [HttpGet("{slug}")]
    public async Task<ActionResult<ProductDto>> BySlug(string slug)
    {
        var product = await catalog.GetBySlugAsync(slug);
        return product == null ? NotFound() : Ok(product);
    }
}

[ApiController]
[Route("api/categories")]
public class CategoriesController(CatalogService catalog) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> List() =>
        Ok(await catalog.GetCategoriesAsync());
}

[ApiController]
[Route("api/orders")]
public class OrdersController(OrderService orders) : ControllerBase
{
    [Authorize]
    [HttpPost]
    public async Task<ActionResult<OrderDto>> Checkout(CheckoutRequest req)
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (id == null) return Unauthorized();
        try
        {
            return Ok(await orders.CheckoutAsync(id, req));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<List<OrderDto>>> MyOrders()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (id == null) return Unauthorized();
        return Ok(await orders.GetUserOrdersAsync(id));
    }

    [Authorize(Roles = "admin")]
    [HttpGet]
    public async Task<ActionResult<List<OrderDto>>> All() =>
        Ok(await orders.GetAllOrdersAsync());
}

[ApiController]
[Route("api/downloads")]
public class DownloadsController(OrderService orders, FileStorageService files, Data.AppDbContext db) : ControllerBase
{
    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<List<ProductFileDto>>> MyDownloads()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (id == null) return Unauthorized();
        return Ok(await orders.GetUserDownloadsAsync(id));
    }

    [Authorize]
    [HttpGet("{productId}/file")]
    public async Task<IActionResult> DownloadFile(string productId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var owned = await orders.GetUserDownloadsAsync(userId);
        if (!owned.Any(f => f.ProductId == productId))
            return Forbid();

        var fileMeta = await db.ProductFiles.FirstOrDefaultAsync(f => f.ProductId == productId);
        var path = files.GetPackagePath(fileMeta?.StoragePath);
        if (path == null)
            return NotFound(new { message = "No file uploaded for this product" });

        var fileName = fileMeta?.FileName ?? Path.GetFileName(path);
        return PhysicalFile(path, fileMeta?.ContentType ?? "application/octet-stream", fileName);
    }
}

[ApiController]
[Route("api/interest")]
public class InterestController(InterestService interest) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Log(LogInterestRequest req)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        await interest.LogAsync(req.ProductId, req.Kind, userId);
        return Ok();
    }

    [Authorize(Roles = "admin")]
    [HttpGet]
    public async Task<ActionResult<List<InterestDto>>> All() =>
        Ok(await interest.GetAllAsync());
}

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "admin")]
public class AdminController(
    CatalogService catalog,
    AuthService auth,
    FileStorageService files) : ControllerBase
{
    [HttpGet("products")]
    public async Task<ActionResult<List<ProductDto>>> Products() =>
        Ok(await catalog.GetProductsAsync(null, false, true));

    [HttpPost("products")]
    public async Task<ActionResult<ProductDto>> CreateProduct(UpsertProductRequest req)
    {
        try
        {
            return Ok(await catalog.UpsertProductAsync(req));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("products/{id}")]
    public async Task<ActionResult<ProductDto>> UpdateProduct(string id, UpsertProductRequest req)
    {
        try
        {
            req = req with { Id = id };
            return Ok(await catalog.UpsertProductAsync(req));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("products/{id}")]
    public async Task<IActionResult> DeleteProduct(string id)
    {
        await catalog.DeleteProductAsync(id, files);
        return NoContent();
    }

    [HttpGet("products/{id}/file")]
    public async Task<ActionResult<ProductFileDto>> GetProductFile(string id)
    {
        var meta = await catalog.GetProductFileMetaAsync(id);
        return meta == null ? NotFound() : Ok(meta);
    }

    [HttpPost("products/{id}/file")]
    [RequestSizeLimit(524_288_000)]
    public async Task<ActionResult<ProductFileDto>> UploadFile(string id, IFormFile file)
    {
        if (file.Length == 0) return BadRequest(new { message = "Empty file" });

        await using var stream = file.OpenReadStream();
        var (storagePath, publicUrl, size, contentType) =
            await files.SavePackageAsync(id, file.FileName, stream, file.ContentType);

        var dto = await catalog.UpsertProductFileAsync(
            id,
            file.FileName,
            publicUrl,
            storagePath,
            size,
            contentType,
            files,
            clearFile: false);

        return Ok(dto);
    }

    [HttpDelete("products/{id}/file")]
    public async Task<ActionResult<ProductFileDto>> DeleteFile(string id)
    {
        var product = await catalog.GetEntityByIdAsync(id);
        var slug = product?.Slug ?? id;
        var dto = await catalog.UpsertProductFileAsync(
            id,
            $"{slug}.zip",
            $"#download-{slug}",
            null,
            null,
            null,
            files,
            clearFile: true);
        return Ok(dto);
    }

    [HttpPost("categories")]
    public async Task<ActionResult<CategoryDto>> UpsertCategory(UpsertCategoryRequest req)
    {
        try
        {
            return Ok(await catalog.UpsertCategoryAsync(req));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("categories/{id}")]
    public async Task<ActionResult<CategoryDto>> UpdateCategory(string id, UpsertCategoryRequest req)
    {
        try
        {
            req = req with { Id = id };
            return Ok(await catalog.UpsertCategoryAsync(req));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("categories/{id}")]
    public async Task<IActionResult> DeleteCategory(string id)
    {
        try
        {
            await catalog.DeleteCategoryAsync(id);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("users/{id}")]
    public async Task<ActionResult<UserLookupDto>> GetUser(string id)
    {
        var user = await auth.GetUserLookupAsync(id);
        return user == null ? NotFound() : Ok(user);
    }
}
