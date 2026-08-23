using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SamuraiRealm.Api.Data;
using SamuraiRealm.Api.DTOs;
using SamuraiRealm.Api.Entities;
using SamuraiRealm.Api.Mappers;

namespace SamuraiRealm.Api.Services;

public class AuthService(AppDbContext db, IConfiguration config)
{
    public async Task<AuthResponseDto> RegisterAsync(RegisterRequest req)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.Email.ToLower() == email))
            throw new InvalidOperationException("Account already exists");

        var user = new User
        {
            Id = Guid.NewGuid().ToString(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            DisplayName = req.DisplayName.Trim(),
            Role = "user",
            Provider = "local",
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return CreateToken(user);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequest req)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            throw new InvalidOperationException("Invalid credentials");
        return CreateToken(user);
    }

    public async Task<AuthResponseDto> GoogleLoginAsync(GoogleLoginRequest req)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.GoogleId == req.GoogleId)
            ?? await db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email);

        if (user == null)
        {
            user = new User
            {
                Id = Guid.NewGuid().ToString(),
                Email = email,
                PasswordHash = "",
                DisplayName = req.Name.Trim(),
                Role = "user",
                Provider = "google",
                GoogleId = req.GoogleId,
                Avatar = req.Avatar,
            };
            db.Users.Add(user);
        }
        else
        {
            user.GoogleId ??= req.GoogleId;
            user.Provider = "google";
            user.DisplayName = string.IsNullOrWhiteSpace(req.Name) ? user.DisplayName : req.Name.Trim();
            if (!string.IsNullOrWhiteSpace(req.Avatar)) user.Avatar = req.Avatar;
        }

        await db.SaveChangesAsync();
        return CreateToken(user);
    }

    public async Task<AuthUserDto?> GetMeAsync(string userId)
    {
        var user = await db.Users.FindAsync(userId);
        return user?.ToAuthDto();
    }

    public async Task<UserLookupDto?> GetUserLookupAsync(string userId)
    {
        var user = await db.Users.FindAsync(userId);
        return user?.ToLookup();
    }

    private AuthResponseDto CreateToken(User user)
    {
        var key = config["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key missing");
        var issuer = config["Jwt:Issuer"] ?? "SamuraiRealm";
        var audience = config["Jwt:Audience"] ?? "SamuraiRealm";

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role),
        };

        var creds = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer,
            audience,
            claims,
            expires: DateTime.UtcNow.AddDays(30),
            signingCredentials: creds);

        return new AuthResponseDto(
            new JwtSecurityTokenHandler().WriteToken(token),
            user.ToAuthDto());
    }
}
