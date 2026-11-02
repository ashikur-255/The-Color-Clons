using Microsoft.AspNetCore.Identity;

namespace Coloring.Infrastructure.Identity;

public static class IdentitySeeder
{
    public static async Task SeedRolesAsync(
        RoleManager<IdentityRole<int>> roleManager)
    {
        string[] roles =
        {
            "User",
            "Admin"
        };

        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(
                    new IdentityRole<int>(role));
            }
        }
    }
}