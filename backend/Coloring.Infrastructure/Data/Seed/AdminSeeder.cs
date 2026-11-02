using Coloring.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace Coloring.Infrastructure.Data.Seed;

public static class AdminSeeder
{
    public static async Task SeedAsync(
        IServiceProvider services)
    {
        var roleManager =
            services.GetRequiredService<
                RoleManager<IdentityRole<int>>>();

        var userManager =
            services.GetRequiredService<
                UserManager<ApplicationUser>>();

        // ============================================
        // Create Admin Role
        // ============================================

        const string adminRole = "Admin";

        if (!await roleManager.RoleExistsAsync(adminRole))
        {
            var role = new IdentityRole<int>(adminRole);

            var roleResult =
                await roleManager.CreateAsync(role);

            if (!roleResult.Succeeded)
            {
                var errors = string.Join(
                    " ",
                    roleResult.Errors.Select(
                        x => x.Description));

                throw new InvalidOperationException(
                    $"Failed to create Admin role: {errors}");
            }
        }

        // ============================================
        // Admin User Details
        // ============================================

        const string adminEmail =
            "admin@thecolorclone.com";

        const string adminPassword =
            "Admin@123456";

        // ============================================
        // Find Admin User
        // ============================================

        var adminUser =
            await userManager.FindByEmailAsync(
                adminEmail);

        // ============================================
        // Create Admin User if not exists
        // ============================================

        if (adminUser == null)
        {
            adminUser = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                DisplayName = "TheColorClone Admin",
                IsActive = true,
                EmailConfirmed = true
            };

            var userResult =
                await userManager.CreateAsync(
                    adminUser,
                    adminPassword);

            if (!userResult.Succeeded)
            {
                var errors = string.Join(
                    " ",
                    userResult.Errors.Select(
                        x => x.Description));

                throw new InvalidOperationException(
                    $"Failed to create Admin user: {errors}");
            }
        }

        // ============================================
        // Assign Admin Role
        // ============================================

        var isAdmin =
            await userManager.IsInRoleAsync(
                adminUser,
                adminRole);

        if (!isAdmin)
        {
            var roleResult =
                await userManager.AddToRoleAsync(
                    adminUser,
                    adminRole);

            if (!roleResult.Succeeded)
            {
                var errors = string.Join(
                    " ",
                    roleResult.Errors.Select(
                        x => x.Description));

                throw new InvalidOperationException(
                    $"Failed to assign Admin role: {errors}");
            }
        }
    }
}