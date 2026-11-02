namespace Coloring.Application.Interfaces.Services;

public interface IColoringPageRatingService
{
    Task<decimal?> AddRatingAsync(
        int coloringPageId,
        int rating);

    Task<decimal?> GetAverageRatingAsync(
        int coloringPageId);

    Task<int?> GetRatingCountAsync(
        int coloringPageId);
}