using Coloring.Application.DTOs.Categories;
using Coloring.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Coloring.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categoryService;

    public CategoriesController(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    // ============================================
    // PUBLIC ENDPOINTS
    // ============================================

    // GET: api/categories
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CategoryDto>>> GetAll()
    {
        var categories = await _categoryService.GetAllAsync();

        return Ok(categories);
    }

    // GET: api/categories/active
    [AllowAnonymous]
    [HttpGet("active")]
    public async Task<ActionResult<IReadOnlyList<CategoryDto>>> GetActive()
    {
        var categories = await _categoryService.GetActiveAsync();

        return Ok(categories);
    }

    // GET: api/categories/5
    [AllowAnonymous]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<CategoryDto>> GetById(int id)
    {
        var category = await _categoryService.GetByIdAsync(id);

        if (category is null)
        {
            return NotFound(new
            {
                message = "Category not found."
            });
        }

        return Ok(category);
    }

    // GET: api/categories/slug/animals
    [AllowAnonymous]
    [HttpGet("slug/{slug}")]
    public async Task<ActionResult<CategoryDto>> GetBySlug(string slug)
    {
        var category = await _categoryService.GetBySlugAsync(slug);

        if (category is null)
        {
            return NotFound(new
            {
                message = "Category not found."
            });
        }

        return Ok(category);
    }

    // ============================================
    // ADMIN ENDPOINTS
    // ============================================

    // POST: api/categories
    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<CategoryDto>> Create(
        [FromBody] CreateCategoryDto dto)
    {
        try
        {
            var category = await _categoryService.CreateAsync(dto);

            return CreatedAtAction(
                nameof(GetById),
                new { id = category.Id },
                category);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    // PUT: api/categories/5
    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<CategoryDto>> Update(
        int id,
        [FromBody] UpdateCategoryDto dto)
    {
        try
        {
            var category = await _categoryService.UpdateAsync(id, dto);

            if (category is null)
            {
                return NotFound(new
                {
                    message = "Category not found."
                });
            }

            return Ok(category);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    // DELETE: api/categories/5
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _categoryService.DeleteAsync(id);

        if (!deleted)
        {
            return NotFound(new
            {
                message = "Category not found."
            });
        }

        return NoContent();
    }
}