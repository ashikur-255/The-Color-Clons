using Coloring.Domain.Entities;

namespace Coloring.Application.Interfaces.Repositories;

public interface ICategoryRepository : IRepository<Category>
{
    Task<Category?> GetBySlugAsync(string slug);

    Task<IReadOnlyList<Category>> GetActiveCategoriesAsync();

    Task<bool> SlugExistsAsync(string slug, int? excludeId = null);
}