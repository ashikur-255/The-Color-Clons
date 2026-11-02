using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Coloring.Application.DTOs.Auth;
using Coloring.Application.Interfaces.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Coloring.Infrastructure.Identity;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly JwtSettings _jwtSettings;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        IOptions<JwtSettings> jwtSettings)
    {
        _userManager = userManager;
        _jwtSettings = jwtSettings.Value;
    }

    public async Task<AuthResultDto> RegisterAsync(
        string displayName,
        string email,
        string password)
    {
        var existingUser = await _userManager.FindByEmailAsync(email);

        if (existingUser != null)
        {
            throw new InvalidOperationException(
                "A user with this email already exists.");
        }

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            DisplayName = displayName,
            IsActive = true
        };

        var result = await _userManager.CreateAsync(
            user,
            password);

        if (!result.Succeeded)
        {
            var errors = string.Join(
                " ",
                result.Errors.Select(x => x.Description));

            throw new InvalidOperationException(errors);
        }

        return await GenerateAuthResult(user);
    }

    public async Task<AuthResultDto?> LoginAsync(
        string email,
        string password)
    {
        var user = await _userManager.FindByEmailAsync(email);

        if (user == null || !user.IsActive)
        {
            return null;
        }

        var passwordValid =
            await _userManager.CheckPasswordAsync(
                user,
                password);

        if (!passwordValid)
        {
            return null;
        }

        return await GenerateAuthResult(user);
    }

    private async Task<AuthResultDto> GenerateAuthResult(
        ApplicationUser user)
    {
        var expiresAt = DateTime.UtcNow.AddMinutes(
            _jwtSettings.ExpiryMinutes);

        // Get user's roles
        var roles = await _userManager.GetRolesAsync(user);

        var claims = new List<Claim>
        {
            new(
                JwtRegisteredClaimNames.Sub,
                user.Id.ToString()),

            new(
                JwtRegisteredClaimNames.Email,
                user.Email ?? string.Empty),

            new(
                ClaimTypes.NameIdentifier,
                user.Id.ToString()),

            new(
                ClaimTypes.Name,
                user.DisplayName),

            new(
                ClaimTypes.Email,
                user.Email ?? string.Empty)
        };

        // Add role claims
        foreach (var role in roles)
        {
            claims.Add(
                new Claim(
                    ClaimTypes.Role,
                    role));
        }

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_jwtSettings.Key));

        var credentials = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials);

        var tokenString =
            new JwtSecurityTokenHandler()
                .WriteToken(token);

        return new AuthResultDto
        {
            UserId = user.Id,
            DisplayName = user.DisplayName,
            Email = user.Email ?? string.Empty,
            Token = tokenString,
            ExpiresAt = expiresAt,
            Roles = roles.ToList()
        };
    }
}