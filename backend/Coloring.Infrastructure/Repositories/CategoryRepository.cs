using Coloring.Application.Interfaces.Repositories;
using Coloring.Domain.Entities;
using Coloring.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Coloring.Infrastructure.Repositories;

public class CategoryRepository
    : Repository<Category>, ICategoryRepository
{
    public CategoryRepository(
        ApplicationDbContext context)
        : base(context)
    {
    }

    public async Task<Category?> GetBySlugAsync(
        string slug)
    {
        return await DbSet
            .FirstOrDefaultAsync(x => x.Slug == slug);
    }

    public async Task<IReadOnlyList<Category>>
        GetActiveCategoriesAsync()
    {
        return await DbSet
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Name)
            .ToListAsync();
    }

    public async Task<bool> SlugExistsAsync(
        string slug,
        int? excludeId = null)
    {
        var query = DbSet
            .AsNoTracking()
            .Where(x => x.Slug == slug);

        if (excludeId.HasValue)
        {
            query = query.Where(
                x => x.Id != excludeId.Value);
        }

        return await query.AnyAsync();
    }
}