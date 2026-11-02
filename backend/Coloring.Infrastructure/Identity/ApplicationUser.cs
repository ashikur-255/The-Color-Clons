using Microsoft.AspNetCore.Identity;

namespace Coloring.Infrastructure.Identity;

public class ApplicationUser : IdentityUser<int>
{
    public string DisplayName { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsActive { get; set; } = true;
}