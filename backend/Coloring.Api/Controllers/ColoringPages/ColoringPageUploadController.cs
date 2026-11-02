using Coloring.Application.DTOs.ColoringPages;
using Coloring.Application.Interfaces.Services;
using Coloring.Application.Interfaces.Storage;
using Microsoft.AspNetCore.Mvc;
using Coloring.Application.Interfaces.Security;

namespace Coloring.Api.Controllers.ColoringPages;

[ApiController]
[Route("api/coloringpages")]
public class ColoringPageUploadController : ControllerBase
{
    private readonly IColoringPageService _coloringPageService;
    private readonly IFileStorageService _fileStorageService;
    private readonly ISvgSecurityValidator _svgSecurityValidator;

    private const long MaxSvgFileSize = 2 * 1024 * 1024; // 2 MB

    public ColoringPageUploadController(
    IColoringPageService coloringPageService,
    IFileStorageService fileStorageService,
    ISvgSecurityValidator svgSecurityValidator)
    {
        _coloringPageService = coloringPageService;
        _fileStorageService = fileStorageService;
        _svgSecurityValidator = svgSecurityValidator;
    }

    [HttpPost("upload")]
    [RequestSizeLimit(MaxSvgFileSize)]
    public async Task<ActionResult<ColoringPageDto>> CreateWithSvg(
    [FromForm] string title,
    [FromForm] string slug,
    [FromForm] int categoryId,
    [FromForm] string? description,
    IFormFile file,
    CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            return BadRequest("Title is required.");
        }

        if (string.IsNullOrWhiteSpace(slug))
        {
            return BadRequest("Slug is required.");
        }

        if (categoryId <= 0)
        {
            return BadRequest("Valid categoryId is required.");
        }

        if (file == null || file.Length == 0)
        {
            return BadRequest("SVG file is required.");
        }

        if (file.Length > MaxSvgFileSize)
        {
            return BadRequest("SVG file size cannot exceed 2 MB.");
        }

        var extension = Path.GetExtension(file.FileName);

        if (!string.Equals(
                extension,
                ".svg",
                StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Only SVG files are allowed.");
        }

        string? svgUrl = null;

        try
        {
            await using var stream = file.OpenReadStream();

            await _svgSecurityValidator.ValidateAsync(
                stream,
                cancellationToken);

            svgUrl = await _fileStorageService.SaveSvgAsync(
                stream,
                file.FileName,
                cancellationToken);

            var createDto = new CreateColoringPageDto
            {
                Title = title,
                Slug = slug,
                CategoryId = categoryId,
                Description = description,
                SvgUrl = svgUrl
            };

            var result = await _coloringPageService.CreateAsync(
                createDto);

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch
        {
            if (!string.IsNullOrWhiteSpace(svgUrl))
            {
                await _fileStorageService.DeleteAsync(
                    svgUrl,
                    cancellationToken);
            }

            throw;
        }
    }
}