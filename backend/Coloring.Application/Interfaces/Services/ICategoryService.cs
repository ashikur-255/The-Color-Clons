using Coloring.Application.DTOs.Categories;

namespace Coloring.Application.Interfaces.Services;

public interface ICategoryService
{
    Task<IReadOnlyList<CategoryDto>> GetAllAsync();

    Task<IReadOnlyList<CategoryDto>> GetActiveAsync();

    Task<CategoryDto?> GetByIdAsync(int id);

    Task<CategoryDto?> GetBySlugAsync(string slug);

    Task<CategoryDto> CreateAsync(CreateCategoryDto dto);

    Task<CategoryDto?> UpdateAsync(int id, UpdateCategoryDto dto);

    Task<bool> DeleteAsync(int id);
}