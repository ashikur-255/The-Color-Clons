namespace Coloring.Application.DTOs.Auth;

public class AuthResultDto
{
    public int UserId { get; set; }

    public string DisplayName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Token { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }

    public List<string> Roles { get; set; } = new();   // ✅ added
}