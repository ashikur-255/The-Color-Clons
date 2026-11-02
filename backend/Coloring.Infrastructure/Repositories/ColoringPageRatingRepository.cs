using Coloring.Application.Interfaces.Repositories;
using Coloring.Domain.Entities;
using Coloring.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Coloring.Infrastructure.Repositories;

public class ColoringPageRatingRepository
    : IColoringPageRatingRepository
{
    private readonly ApplicationDbContext _context;

    public ColoringPageRatingRepository(
        ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ColoringPageRating?> GetByIdAsync(
        int id)
    {
        return await _context.ColoringPageRatings
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<List<ColoringPageRating>>
        GetByColoringPageIdAsync(int coloringPageId)
    {
        return await _context.ColoringPageRatings
            .Where(x => x.ColoringPageId == coloringPageId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();
    }

    public async Task AddAsync(
        ColoringPageRating rating)
    {
        await _context.ColoringPageRatings.AddAsync(rating);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(
        ColoringPageRating rating)
    {
        _context.ColoringPageRatings.Update(rating);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(
        ColoringPageRating rating)
    {
        _context.ColoringPageRatings.Remove(rating);
        await _context.SaveChangesAsync();
    }

    public async Task<decimal> GetAverageRatingAsync(
        int coloringPageId)
    {
        var average = await _context.ColoringPageRatings
            .Where(x => x.ColoringPageId == coloringPageId)
            .Select(x => (decimal?)x.Rating)
            .AverageAsync();

        return average ?? 0m;
    }

    public async Task<int> GetRatingCountAsync(
        int coloringPageId)
    {
        return await _context.ColoringPageRatings
            .CountAsync(x => x.ColoringPageId == coloringPageId);
    }
}