using Coloring.Application.DTOs.ColoringPages;
using Coloring.Application.Interfaces.Repositories;
using Coloring.Application.Interfaces.Services;
using Coloring.Application.Interfaces.Storage;
using Coloring.Domain.Entities;

namespace Coloring.Application.Services.ColoringPages;

public class ColoringPageService : IColoringPageService
{
    private readonly IColoringPageRepository _repository;
    private readonly IFileStorageService _fileStorageService;

    public ColoringPageService(
        IColoringPageRepository repository,
        IFileStorageService fileStorageService)
    {
        _repository = repository;
        _fileStorageService = fileStorageService;
    }

    public async Task<IReadOnlyList<ColoringPageDto>>
        GetPublishedAsync()
    {
        var pages = await _repository.GetPublishedAsync();

        return pages
            .Select(MapToDto)
            .ToList();
    }

    public async Task<IReadOnlyList<ColoringPageDto>>
    GetAllForAdminAsync()
    {
        var pages =
            await _repository.GetAllForAdminAsync();

        return pages
            .Select(MapToDto)
            .ToList();
    }

    public async Task<ColoringPageDto?> GetByIdAsync(int id)
    {
        var page = await _repository.GetByIdAsync(id);

        return page == null
            ? null
            : MapToDto(page);
    }

    public async Task<ColoringPageDto?> GetBySlugAsync(
        string slug)
    {
        var page = await _repository.GetBySlugAsync(slug);

        return page == null
            ? null
            : MapToDto(page);
    }

    public async Task<IReadOnlyList<ColoringPageDto>>
        GetByCategoryAsync(int categoryId)
    {
        var pages =
            await _repository.GetByCategoryAsync(categoryId);

        return pages
            .Select(MapToDto)
            .ToList();
    }

    public async Task<IReadOnlyList<ColoringPageDto>>
        GetPopularAsync(int limit)
    {
        var pages =
            await _repository.GetPopularAsync(limit);

        return pages
            .Select(MapToDto)
            .ToList();
    }

    public async Task<IReadOnlyList<ColoringPageDto>>
        GetLatestAsync(int limit)
    {
        var pages =
            await _repository.GetLatestAsync(limit);

        return pages
            .Select(MapToDto)
            .ToList();
    }

    public async Task<ColoringPageDto> CreateAsync(
        CreateColoringPageDto dto)
    {
        var slugExists =
            await _repository.SlugExistsAsync(dto.Slug);

        if (slugExists)
        {
            throw new InvalidOperationException(
                "A coloring page with this slug already exists.");
        }

        var page = new ColoringPage(
            dto.Title,
            dto.Slug,
            dto.CategoryId,
            dto.SvgUrl);

        if (!string.IsNullOrWhiteSpace(dto.Description))
        {
            page.Update(
                dto.Title,
                dto.Slug,
                dto.CategoryId,
                dto.SvgUrl,
                dto.Description);
        }

        await _repository.AddAsync(page);

        return MapToDto(page);
    }

    public async Task<ColoringPageDto?> UpdateAsync(
    int id,
    UpdateColoringPageDto dto)
    {
        var page = await _repository.GetByIdAsync(id);

        if (page == null)
        {
            return null;
        }

        var slugExists =
            await _repository.SlugExistsAsync(
                dto.Slug,
                id);

        if (slugExists)
        {
            throw new InvalidOperationException(
                "A coloring page with this slug already exists.");
        }

        var oldSvgUrl = page.SvgUrl;

        page.Update(
            dto.Title,
            dto.Slug,
            dto.CategoryId,
            dto.SvgUrl,
            dto.Description);

        await _repository.UpdateAsync(page);

        if (!string.IsNullOrWhiteSpace(oldSvgUrl) &&
            !string.Equals(
                oldSvgUrl,
                dto.SvgUrl,
                StringComparison.OrdinalIgnoreCase))
        {
            await _fileStorageService.DeleteAsync(oldSvgUrl);
        }

        return MapToDto(page);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var page = await _repository.GetByIdAsync(id);

        if (page == null)
        {
            return false;
        }

        var svgUrl = page.SvgUrl;

        await _repository.DeleteAsync(page);

        if (!string.IsNullOrWhiteSpace(svgUrl))
        {
            await _fileStorageService.DeleteAsync(
                svgUrl);
        }

        return true;
    }

    public async Task<bool> PublishAsync(int id)
    {
        var page = await _repository.GetByIdAsync(id);

        if (page == null)
        {
            return false;
        }

        page.Publish();

        await _repository.UpdateAsync(page);

        return true;
    }

    public async Task<bool> UnpublishAsync(int id)
    {
        var page = await _repository.GetByIdAsync(id);

        if (page == null)
        {
            return false;
        }

        page.Unpublish();

        await _repository.UpdateAsync(page);

        return true;
    }

    public async Task<bool> IncrementViewsAsync(int id)
    {
        var page = await _repository.GetByIdAsync(id);

        if (page == null)
        {
            return false;
        }

        page.IncrementViews();

        await _repository.UpdateAsync(page);

        return true;
    }

    public async Task<bool> IncrementDownloadsAsync(int id)
    {
        var page = await _repository.GetByIdAsync(id);

        if (page == null)
        {
            return false;
        }

        page.IncrementDownloads();

        await _repository.UpdateAsync(page);

        return true;
    }

    public async Task<bool> IncrementLikesAsync(int id)
    {
        var page = await _repository.GetByIdAsync(id);

        if (page == null)
        {
            return false;
        }

        page.IncrementLikes();

        await _repository.UpdateAsync(page);

        return true;
    }

    private static ColoringPageDto MapToDto(
        ColoringPage page)
    {
        return new ColoringPageDto
        {
            Id = page.Id,
            Title = page.Title,
            Slug = page.Slug,
            Description = page.Description,
            SeoTitle = page.SeoTitle,
            SeoDescription = page.SeoDescription,
            SvgUrl = page.SvgUrl,
            OriginalImageUrl = page.OriginalImageUrl,
            ThumbnailUrl = page.ThumbnailUrl,
            CategoryId = page.CategoryId,
            Views = page.Views,
            Downloads = page.Downloads,
            Likes = page.Likes,
            Rating = page.Rating,
            IsPublished = page.IsPublished,
            PublishedAt = page.PublishedAt
        };
    }
}