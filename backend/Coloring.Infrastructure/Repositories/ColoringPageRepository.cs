using Coloring.Application.Interfaces.Repositories;
using Coloring.Domain.Entities;
using Coloring.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Coloring.Infrastructure.Repositories;

public class ColoringPageRepository
    : Repository<ColoringPage>,
      IColoringPageRepository
{
    public ColoringPageRepository(
        ApplicationDbContext context)
        : base(context)
    {
    }

    public async Task<ColoringPage?> GetBySlugAsync(
        string slug)
    {
        return await DbSet
            .FirstOrDefaultAsync(x => x.Slug == slug);
    }

    public async Task<IReadOnlyList<ColoringPage>>
        GetPublishedAsync()
    {
        return await DbSet
            .AsNoTracking()
            .Where(x => x.IsPublished)
            .OrderByDescending(x => x.PublishedAt)
            .ToListAsync();
    }

    // =========================================================
    // ADMIN - GET ALL PAGES
    // Includes both Published + Draft pages
    // =========================================================

    public async Task<IReadOnlyList<ColoringPage>>
        GetAllForAdminAsync()
    {
        return await DbSet
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<ColoringPage>>
        GetByCategoryAsync(int categoryId)
    {
        return await DbSet
            .AsNoTracking()
            .Where(x =>
                x.CategoryId == categoryId &&
                x.IsPublished)
            .OrderByDescending(x => x.PublishedAt)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<ColoringPage>>
        GetPopularAsync(int limit)
    {
        return await DbSet
            .AsNoTracking()
            .Where(x => x.IsPublished)
            .OrderByDescending(x => x.Views)
            .ThenByDescending(x => x.Likes)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<ColoringPage>>
        GetLatestAsync(int limit)
    {
        return await DbSet
            .AsNoTracking()
            .Where(x => x.IsPublished)
            .OrderByDescending(x => x.PublishedAt)
            .Take(limit)
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