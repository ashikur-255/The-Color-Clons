using Coloring.Application.Interfaces.Services;
using Coloring.Application.Services.Categories;
using Coloring.Application.Services.ColoringPageRatings;
using Coloring.Application.Services.ColoringPages;
using Microsoft.Extensions.DependencyInjection;

namespace Coloring.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(
        this IServiceCollection services)
    {
        services.AddScoped<
            ICategoryService,
            CategoryService>();

        services.AddScoped<
            IColoringPageService,
            ColoringPageService>();

        services.AddScoped<
            IColoringPageRatingService,
            ColoringPageRatingService>();

        return services;
    }
}