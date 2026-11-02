using Coloring.Domain.Entities;

namespace Coloring.Application.Interfaces.Repositories;

public interface IColoringPageRepository : IRepository<ColoringPage>
{
    Task<ColoringPage?> GetBySlugAsync(string slug);

    Task<IReadOnlyList<ColoringPage>> GetPublishedAsync();

    Task<IReadOnlyList<ColoringPage>> GetAllForAdminAsync();

    Task<IReadOnlyList<ColoringPage>> GetByCategoryAsync(int categoryId);

    Task<IReadOnlyList<ColoringPage>> GetPopularAsync(int limit);

    Task<IReadOnlyList<ColoringPage>> GetLatestAsync(int limit);

    Task<bool> SlugExistsAsync(
        string slug,
        int? excludeId = null);
}