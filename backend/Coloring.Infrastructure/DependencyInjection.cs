using Coloring.Application.Interfaces.Repositories;
using Coloring.Application.Interfaces.Services;
using Coloring.Application.Interfaces.Storage;
using Coloring.Infrastructure.Data;
using Coloring.Infrastructure.Identity;
using Coloring.Infrastructure.Repositories;
using Coloring.Infrastructure.Storage;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Coloring.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // ============================================
        // Database
        // ============================================

        services.AddDbContext<ApplicationDbContext>(options =>
        {
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"));
        });


        // ============================================
        // JWT Settings
        // ============================================

        services.Configure<JwtSettings>(
            configuration.GetSection("Jwt"));


        // ============================================
        // ASP.NET Core Identity
        // ============================================

        services
            .AddIdentityCore<ApplicationUser>(options =>
            {
                options.User.RequireUniqueEmail = true;

                // Password settings
                options.Password.RequiredLength = 8;
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireUppercase = true;
                options.Password.RequireNonAlphanumeric = true;

                // Lockout settings
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan =
                    TimeSpan.FromMinutes(15);
            })
            .AddRoles<IdentityRole<int>>()
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddSignInManager()
            .AddDefaultTokenProviders();


        // ============================================
        // Repositories
        // ============================================

        services.AddScoped<
            ICategoryRepository,
            CategoryRepository>();

        services.AddScoped<
            IColoringPageRepository,
            ColoringPageRepository>();

        services.AddScoped<
            IColoringPageRatingRepository,
            ColoringPageRatingRepository>();


        // ============================================
        // Storage
        // ============================================

        services.AddScoped<
            IFileStorageService,
            LocalFileStorageService>();


        // ============================================
        // Authentication Service
        // ============================================

        services.AddScoped<
            IAuthService,
            AuthService>();


        return services;
    }
}