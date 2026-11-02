using Coloring.Application.Interfaces.Repositories;
using Coloring.Application.Interfaces.Services;
using Coloring.Domain.Entities;

namespace Coloring.Application.Services.ColoringPageRatings;

public class ColoringPageRatingService
    : IColoringPageRatingService
{
    private readonly IColoringPageRatingRepository _ratingRepository;
    private readonly IColoringPageRepository _coloringPageRepository;

    public ColoringPageRatingService(
        IColoringPageRatingRepository ratingRepository,
        IColoringPageRepository coloringPageRepository)
    {
        _ratingRepository = ratingRepository;
        _coloringPageRepository = coloringPageRepository;
    }

    public async Task<decimal?> AddRatingAsync(
        int coloringPageId,
        int rating)
    {
        if (rating < 1 || rating > 5)
        {
            throw new ArgumentOutOfRangeException(
                nameof(rating),
                "Rating must be between 1 and 5.");
        }

        var coloringPage =
            await _coloringPageRepository
                .GetByIdAsync(coloringPageId);

        if (coloringPage == null)
        {
            return null;
        }

        var newRating = new ColoringPageRating(
            coloringPageId,
            rating);

        await _ratingRepository.AddAsync(newRating);

        var average =
            await _ratingRepository
                .GetAverageRatingAsync(coloringPageId);

        coloringPage.UpdateRating(average);

        await _coloringPageRepository
            .UpdateAsync(coloringPage);

        return average;
    }

    public async Task<decimal?> GetAverageRatingAsync(
        int coloringPageId)
    {
        var coloringPage =
            await _coloringPageRepository
                .GetByIdAsync(coloringPageId);

        if (coloringPage == null)
        {
            return null;
        }

        return await _ratingRepository
            .GetAverageRatingAsync(coloringPageId);
    }

    public async Task<int?> GetRatingCountAsync(
        int coloringPageId)
    {
        var coloringPage =
            await _coloringPageRepository
                .GetByIdAsync(coloringPageId);

        if (coloringPage == null)
        {
            return null;
        }

        return await _ratingRepository
            .GetRatingCountAsync(coloringPageId);
    }
}