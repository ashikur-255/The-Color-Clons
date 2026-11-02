using Coloring.Application.DTOs.Files;
using Coloring.Application.Interfaces.Storage;
using Microsoft.AspNetCore.Mvc;
using Coloring.Application.Interfaces.Security;

namespace Coloring.Api.Controllers.Files;

[ApiController]
[Route("api/files")]
public class FilesController : ControllerBase
{
    private readonly IFileStorageService _fileStorageService;
    private readonly ISvgSecurityValidator _svgSecurityValidator;

    private const long MaxSvgFileSize = 2 * 1024 * 1024; // 2 MB

    public FilesController(
    IFileStorageService fileStorageService,
    ISvgSecurityValidator svgSecurityValidator)
    {
        _fileStorageService = fileStorageService;
        _svgSecurityValidator = svgSecurityValidator;
    }

    [HttpPost("svg")]
    [RequestSizeLimit(MaxSvgFileSize)]
    public async Task<ActionResult<SvgUploadResponseDto>> UploadSvg(
    IFormFile file,
    CancellationToken cancellationToken)
    {
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

        try
        {
            await using var stream = file.OpenReadStream();

            await _svgSecurityValidator.ValidateAsync(
                stream,
                cancellationToken);

            var url = await _fileStorageService.SaveSvgAsync(
                stream,
                file.FileName,
                cancellationToken);

            var response = new SvgUploadResponseDto
            {
                FileName = file.FileName,
                Url = url
            };

            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}