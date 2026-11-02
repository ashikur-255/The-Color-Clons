using Coloring.Domain.Entities;

namespace Coloring.Application.Interfaces.Repositories;

public interface IColoringPageRatingRepository
{
    Task<ColoringPageRating?> GetByIdAsync(int id);

    Task<List<ColoringPageRating>> GetByColoringPageIdAsync(
        int coloringPageId);

    Task AddAsync(ColoringPageRating rating);

    Task UpdateAsync(ColoringPageRating rating);

    Task DeleteAsync(ColoringPageRating rating);

    Task<decimal> GetAverageRatingAsync(
        int coloringPageId);

    Task<int> GetRatingCountAsync(
        int coloringPageId);
}