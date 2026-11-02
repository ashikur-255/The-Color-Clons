using Coloring.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace Coloring.Api.Controllers.ColoringPages;

[ApiController]
[Route("api/coloringpages")]
public class ColoringPageRatingsController : ControllerBase
{
    private readonly IColoringPageRatingService _ratingService;

    public ColoringPageRatingsController(
        IColoringPageRatingService ratingService)
    {
        _ratingService = ratingService;
    }

    [HttpPost("{id}/rating")]
    public async Task<IActionResult> AddRating(
        int id,
        [FromQuery] int rating)
    {
        try
        {
            var average =
                await _ratingService.AddRatingAsync(
                    id,
                    rating);

            if (average == null)
            {
                return NotFound(new
                {
                    message = "Coloring page not found."
                });
            }

            var count =
                await _ratingService.GetRatingCountAsync(id);

            return Ok(new
            {
                coloringPageId = id,
                rating,
                averageRating = average,
                ratingCount = count
            });
        }
        catch (ArgumentOutOfRangeException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    [HttpGet("{id}/rating")]
    public async Task<IActionResult> GetRating(int id)
    {
        var average =
            await _ratingService
                .GetAverageRatingAsync(id);

        if (average == null)
        {
            return NotFound(new
            {
                message = "Coloring page not found."
            });
        }

        var count =
            await _ratingService
                .GetRatingCountAsync(id);

        return Ok(new
        {
            coloringPageId = id,
            averageRating = average,
            ratingCount = count
        });
    }
}