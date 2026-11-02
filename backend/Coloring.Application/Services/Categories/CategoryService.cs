using Coloring.Application.DTOs.Categories;
using Coloring.Application.Interfaces.Repositories;
using Coloring.Application.Interfaces.Services;
using Coloring.Domain.Entities;

namespace Coloring.Application.Services.Categories;

public class CategoryService : ICategoryService
{
    private readonly ICategoryRepository _categoryRepository;

    public CategoryService(ICategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    public async Task<IReadOnlyList<CategoryDto>> GetAllAsync()
    {
        var categories = await _categoryRepository.GetAllAsync();

        return categories
            .Select(MapToDto)
            .ToList();
    }

    public async Task<IReadOnlyList<CategoryDto>> GetActiveAsync()
    {
        var categories =
            await _categoryRepository.GetActiveCategoriesAsync();

        return categories
            .Select(MapToDto)
            .ToList();
    }

    public async Task<CategoryDto?> GetByIdAsync(int id)
    {
        var category = await _categoryRepository.GetByIdAsync(id);

        return category == null
            ? null
            : MapToDto(category);
    }

    public async Task<CategoryDto?> GetBySlugAsync(string slug)
    {
        var category =
            await _categoryRepository.GetBySlugAsync(slug);

        return category == null
            ? null
            : MapToDto(category);
    }

    public async Task<CategoryDto> CreateAsync(
        CreateCategoryDto dto)
    {
        var slugExists =
            await _categoryRepository.SlugExistsAsync(dto.Slug);

        if (slugExists)
        {
            throw new InvalidOperationException(
                "A category with this slug already exists.");
        }

        var category = new Category(
            dto.Name,
            dto.Slug,
            dto.Description);

        await _categoryRepository.AddAsync(category);

        return MapToDto(category);
    }

    public async Task<CategoryDto?> UpdateAsync(
        int id,
        UpdateCategoryDto dto)
    {
        var category =
            await _categoryRepository.GetByIdAsync(id);

        if (category == null)
        {
            return null;
        }

        var slugExists =
            await _categoryRepository.SlugExistsAsync(
                dto.Slug,
                id);

        if (slugExists)
        {
            throw new InvalidOperationException(
                "A category with this slug already exists.");
        }

        category.Update(
            dto.Name,
            dto.Slug,
            dto.Description);

        await _categoryRepository.UpdateAsync(category);

        return MapToDto(category);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var category =
            await _categoryRepository.GetByIdAsync(id);

        if (category == null)
        {
            return false;
        }

        await _categoryRepository.DeleteAsync(category);

        return true;
    }

    private static CategoryDto MapToDto(Category category)
    {
        return new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Slug = category.Slug,
            Description = category.Description,
            SeoTitle = category.SeoTitle,
            SeoDescription = category.SeoDescription,
            ImageUrl = category.ImageUrl,
            ParentId = category.ParentId,
            SortOrder = category.SortOrder,
            IsActive = category.IsActive
        };
    }
}