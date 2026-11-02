using Coloring.Application.DTOs.ColoringPages;

namespace Coloring.Application.Interfaces.Services;

public interface IColoringPageService
{
    Task<IReadOnlyList<ColoringPageDto>> GetPublishedAsync();

    Task<IReadOnlyList<ColoringPageDto>> GetAllForAdminAsync();

    Task<ColoringPageDto?> GetByIdAsync(int id);

    Task<ColoringPageDto?> GetBySlugAsync(string slug);

    Task<IReadOnlyList<ColoringPageDto>> GetByCategoryAsync(
        int categoryId);

    Task<IReadOnlyList<ColoringPageDto>> GetPopularAsync(
        int limit);

    Task<IReadOnlyList<ColoringPageDto>> GetLatestAsync(
        int limit);

    Task<ColoringPageDto> CreateAsync(
        CreateColoringPageDto dto);

    Task<ColoringPageDto?> UpdateAsync(
        int id,
        UpdateColoringPageDto dto);

    Task<bool> DeleteAsync(int id);

    Task<bool> PublishAsync(int id);

    Task<bool> UnpublishAsync(int id);

    Task<bool> IncrementViewsAsync(int id);

    Task<bool> IncrementDownloadsAsync(int id);

    Task<bool> IncrementLikesAsync(int id);
}