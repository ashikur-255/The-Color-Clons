using Coloring.Application.DTOs.ColoringPages;
using Coloring.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Xml.Linq;

namespace Coloring.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ColoringPagesController : ControllerBase
{
    private readonly IColoringPageService _coloringPageService;
    private readonly IWebHostEnvironment _environment;

    private const long MaxSvgFileSize = 5 * 1024 * 1024;

    public ColoringPagesController(
        IColoringPageService coloringPageService,
        IWebHostEnvironment environment)
    {
        _coloringPageService = coloringPageService;
        _environment = environment;
    }

    // =========================================================
    // ADMIN - ALL COLORING PAGES
    // =========================================================

    // GET: api/coloringpages/admin/all
    [Authorize(Roles = "Admin")]
    [HttpGet("admin/all")]
    public async Task<ActionResult<IReadOnlyList<ColoringPageDto>>>
        GetAllForAdmin()
    {
        var pages =
            await _coloringPageService.GetAllForAdminAsync();

        return Ok(pages);
    }

    // =========================================================
    // PUBLIC ENDPOINTS
    // =========================================================

    // GET: api/coloringpages
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ColoringPageDto>>>
        GetPublished()
    {
        var pages =
            await _coloringPageService.GetPublishedAsync();

        return Ok(pages);
    }

    // GET: api/coloringpages/5
    [AllowAnonymous]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ColoringPageDto>>
        GetById(int id)
    {
        var page =
            await _coloringPageService.GetByIdAsync(id);

        if (page is null)
        {
            return NotFound(new
            {
                message = "Coloring page not found."
            });
        }

        return Ok(page);
    }

    // GET: api/coloringpages/slug/lion-coloring-page
    [AllowAnonymous]
    [HttpGet("slug/{slug}")]
    public async Task<ActionResult<ColoringPageDto>>
        GetBySlug(string slug)
    {
        var page =
            await _coloringPageService.GetBySlugAsync(slug);

        if (page is null)
        {
            return NotFound(new
            {
                message = "Coloring page not found."
            });
        }

        return Ok(page);
    }

    // GET: api/coloringpages/category/1
    [AllowAnonymous]
    [HttpGet("category/{categoryId:int}")]
    public async Task<ActionResult<IReadOnlyList<ColoringPageDto>>>
        GetByCategory(int categoryId)
    {
        var pages =
            await _coloringPageService
                .GetByCategoryAsync(categoryId);

        return Ok(pages);
    }

    // GET: api/coloringpages/popular?limit=10
    [AllowAnonymous]
    [HttpGet("popular")]
    public async Task<ActionResult<IReadOnlyList<ColoringPageDto>>>
        GetPopular([FromQuery] int limit = 10)
    {
        limit = Math.Clamp(limit, 1, 100);

        var pages =
            await _coloringPageService
                .GetPopularAsync(limit);

        return Ok(pages);
    }

    // GET: api/coloringpages/latest?limit=10
    [AllowAnonymous]
    [HttpGet("latest")]
    public async Task<ActionResult<IReadOnlyList<ColoringPageDto>>>
        GetLatest([FromQuery] int limit = 10)
    {
        limit = Math.Clamp(limit, 1, 100);

        var pages =
            await _coloringPageService
                .GetLatestAsync(limit);

        return Ok(pages);
    }

    // =========================================================
    // ADMIN - SVG UPLOAD
    // =========================================================

    // POST: api/coloringpages/upload-svg
    [Authorize(Roles = "Admin")]
    [HttpPost("upload-svg")]
    [RequestSizeLimit(MaxSvgFileSize)]
    public async Task<IActionResult> UploadSvg(
        IFormFile file)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new
            {
                message = "Please select an SVG file."
            });
        }

        if (file.Length > MaxSvgFileSize)
        {
            return BadRequest(new
            {
                message = "SVG file must be 5 MB or smaller."
            });
        }

        var extension =
            Path.GetExtension(file.FileName);

        if (!string.Equals(
                extension,
                ".svg",
                StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new
            {
                message = "Only SVG files are allowed."
            });
        }

        string svgContent;

        await using (
            var stream = file.OpenReadStream())
        using (
            var reader = new StreamReader(stream))
        {
            svgContent =
                await reader.ReadToEndAsync();
        }

        if (string.IsNullOrWhiteSpace(svgContent))
        {
            return BadRequest(new
            {
                message = "The SVG file is empty."
            });
        }

        if (!svgContent
                .TrimStart()
                .StartsWith(
                    "<svg",
                    StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new
            {
                message = "The uploaded file is not a valid SVG."
            });
        }

        // Basic SVG security validation.
        var lowerSvg =
            svgContent.ToLowerInvariant();

        var dangerousPatterns = new[]
        {
            "<script",
            "</script",
            "<iframe",
            "<object",
            "<embed",
            "<foreignobject",
            "<!doctype",
            "<!entity",
            "javascript:",
            "data:text/html",
            "onload=",
            "onclick=",
            "onerror=",
            "onmouseover=",
            "onfocus=",
            "onbegin=",
            "onend="
        };

        foreach (var pattern in dangerousPatterns)
        {
            if (lowerSvg.Contains(pattern))
            {
                return BadRequest(new
                {
                    message =
                        "The SVG contains unsafe or unsupported content."
                });
            }
        }

        // Parse XML to make sure the SVG is structurally valid.
        try
        {
            var xml =
                XDocument.Parse(svgContent);

            var root =
                xml.Root;

            if (root is null ||
                !string.Equals(
                    root.Name.LocalName,
                    "svg",
                    StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new
                {
                    message = "Invalid SVG root element."
                });
            }
        }
        catch
        {
            return BadRequest(new
            {
                message = "The uploaded SVG XML is invalid."
            });
        }

        var webRoot =
            _environment.WebRootPath;

        if (string.IsNullOrWhiteSpace(webRoot))
        {
            webRoot =
                Path.Combine(
                    _environment.ContentRootPath,
                    "wwwroot");
        }

        var uploadDirectory =
            Path.Combine(
                webRoot,
                "uploads",
                "coloring-pages");

        Directory.CreateDirectory(
            uploadDirectory);

        var baseName =
            Path.GetFileNameWithoutExtension(
                file.FileName);

        var safeName =
            CreateSafeFileName(baseName);

        var uniqueName =
            $"{safeName}-{Guid.NewGuid():N}.svg";

        var physicalPath =
            Path.Combine(
                uploadDirectory,
                uniqueName);

        await System.IO.File.WriteAllTextAsync(
            physicalPath,
            svgContent);

        var relativeUrl =
            $"/uploads/coloring-pages/{uniqueName}";

        return Ok(new
        {
            url = relativeUrl,
            fileName = uniqueName
        });
    }

    // =========================================================
    // ADMIN - CREATE
    // =========================================================

    // POST: api/coloringpages
    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<ColoringPageDto>>
        Create([FromBody] CreateColoringPageDto dto)
    {
        if (dto is null)
        {
            return BadRequest(new
            {
                message = "Invalid coloring page data."
            });
        }

        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            return BadRequest(new
            {
                message = "Title is required."
            });
        }

        if (string.IsNullOrWhiteSpace(dto.Slug))
        {
            return BadRequest(new
            {
                message = "Slug is required."
            });
        }

        if (dto.CategoryId <= 0)
        {
            return BadRequest(new
            {
                message = "Please select a category."
            });
        }

        if (string.IsNullOrWhiteSpace(dto.SvgUrl))
        {
            return BadRequest(new
            {
                message = "SVG artwork is required."
            });
        }

        var page =
            await _coloringPageService
                .CreateAsync(dto);

        return CreatedAtAction(
            nameof(GetById),
            new
            {
                id = page.Id
            },
            page);
    }

    // =========================================================
    // ADMIN - UPDATE
    // =========================================================

    // PUT: api/coloringpages/5
    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ColoringPageDto>>
        Update(
            int id,
            [FromBody] UpdateColoringPageDto dto)
    {
        if (dto is null)
        {
            return BadRequest(new
            {
                message = "Invalid coloring page data."
            });
        }

        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            return BadRequest(new
            {
                message = "Title is required."
            });
        }

        if (string.IsNullOrWhiteSpace(dto.Slug))
        {
            return BadRequest(new
            {
                message = "Slug is required."
            });
        }

        if (dto.CategoryId <= 0)
        {
            return BadRequest(new
            {
                message = "Please select a category."
            });
        }

        if (string.IsNullOrWhiteSpace(dto.SvgUrl))
        {
            return BadRequest(new
            {
                message = "SVG artwork is required."
            });
        }

        var page =
            await _coloringPageService.UpdateAsync(
                id,
                dto);

        if (page is null)
        {
            return NotFound(new
            {
                message = "Coloring page not found."
            });
        }

        return Ok(page);
    }

    // =========================================================
    // ADMIN - DELETE
    // =========================================================

    // DELETE: api/coloringpages/5
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult>
        Delete(int id)
    {
        var deleted =
            await _coloringPageService
                .DeleteAsync(id);

        if (!deleted)
        {
            return NotFound(new
            {
                message = "Coloring page not found."
            });
        }

        return NoContent();
    }

    // =========================================================
    // ADMIN - PUBLISH
    // =========================================================

    // POST: api/coloringpages/5/publish
    [Authorize(Roles = "Admin")]
    [HttpPost("{id:int}/publish")]
    public async Task<IActionResult>
        Publish(int id)
    {
        var published =
            await _coloringPageService
                .PublishAsync(id);

        if (!published)
        {
            return NotFound(new
            {
                message = "Coloring page not found."
            });
        }

        return Ok(new
        {
            message =
                "Coloring page published successfully."
        });
    }

    // =========================================================
    // ADMIN - UNPUBLISH
    // =========================================================

    // POST: api/coloringpages/5/unpublish
    [Authorize(Roles = "Admin")]
    [HttpPost("{id:int}/unpublish")]
    public async Task<IActionResult>
        Unpublish(int id)
    {
        var unpublished =
            await _coloringPageService
                .UnpublishAsync(id);

        if (!unpublished)
        {
            return NotFound(new
            {
                message = "Coloring page not found."
            });
        }

        return Ok(new
        {
            message =
                "Coloring page unpublished successfully."
        });
    }

    // =========================================================
    // PUBLIC METRICS
    // =========================================================

    // POST: api/coloringpages/5/view
    [AllowAnonymous]
    [HttpPost("{id:int}/view")]
    public async Task<IActionResult>
        IncrementView(int id)
    {
        var result =
            await _coloringPageService
                .IncrementViewsAsync(id);

        if (!result)
        {
            return NotFound(new
            {
                message = "Coloring page not found."
            });
        }

        return NoContent();
    }

    // POST: api/coloringpages/5/like
    [AllowAnonymous]
    [HttpPost("{id:int}/like")]
    public async Task<IActionResult>
        IncrementLike(int id)
    {
        var result =
            await _coloringPageService
                .IncrementLikesAsync(id);

        if (!result)
        {
            return NotFound(new
            {
                message = "Coloring page not found."
            });
        }

        return NoContent();
    }

    // POST: api/coloringpages/5/download
    [AllowAnonymous]
    [HttpPost("{id:int}/download")]
    public async Task<IActionResult>
        IncrementDownload(int id)
    {
        var result =
            await _coloringPageService
                .IncrementDownloadsAsync(id);

        if (!result)
        {
            return NotFound(new
            {
                message = "Coloring page not found."
            });
        }

        return NoContent();
    }

    private static string CreateSafeFileName(
        string input)
    {
        var invalidChars =
            Path.GetInvalidFileNameChars();

        var chars =
            input
                .Trim()
                .ToLowerInvariant()
                .Select(character =>
                    invalidChars.Contains(character)
                        ? '-'
                        : character)
                .ToArray();

        var result =
            new string(chars);

        result =
            string.Join(
                "-",
                result
                    .Split(
                        '-',
                        StringSplitOptions.RemoveEmptyEntries));

        if (string.IsNullOrWhiteSpace(result))
        {
            result = "coloring-page";
        }

        return result.Length > 80
            ? result[..80]
            : result;
    }
}