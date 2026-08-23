using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SamuraiRealm.Api;
using SamuraiRealm.Api.Data;
using SamuraiRealm.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.PropertyNamingPolicy = new SnakeCaseNamingPolicy();
    o.JsonSerializerOptions.DictionaryKeyPolicy = new SnakeCaseNamingPolicy();
});

builder.Services.AddDbContext<AppDbContext>(options =>
{
    var conn = builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Data Source=samurai.db";
    if (conn.Contains("Data Source=", StringComparison.OrdinalIgnoreCase) ||
        conn.EndsWith(".db", StringComparison.OrdinalIgnoreCase))
    {
        options.UseSqlite(conn);
    }
    else
    {
        options.UseSqlServer(conn);
    }
});

builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<CatalogService>();
builder.Services.AddScoped<OrderService>();
builder.Services.AddScoped<InterestService>();
builder.Services.AddSingleton<FileStorageService>();

var jwtKey = builder.Configuration["Jwt:Key"] ?? "SamuraiRealm-Super-Secret-Key-Change-In-Production-2026!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "SamuraiRealm",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "SamuraiRealm",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            RoleClaimType = System.Security.Claims.ClaimTypes.Role,
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
            ?? ["http://localhost:3000", "http://localhost:5173", "https://samurai-rho.vercel.app"];
        policy.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod().AllowCredentials();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    await DbSeeder.SeedAsync(db);
}

var files = app.Services.GetRequiredService<FileStorageService>();
files.EnsureDirectories();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.Combine(app.Environment.ContentRootPath, "uploads")),
    RequestPath = "/uploads",
});

app.MapControllers();

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));

app.Run();
