using Coloring.Application.Interfaces.Storage;
using Microsoft.AspNetCore.Hosting;

namespace Coloring.Infrastructure.Storage;

public class LocalFileStorageService : IFileStorageService
{
    private readonly string _webRootPath;

    public LocalFileStorageService(IWebHostEnvironment environment)
    {
        _webRootPath = environment.WebRootPath
            ?? Path.Combine(environment.ContentRootPath, "wwwroot");
    }

    public async Task<string> SaveSvgAsync(
        Stream fileStream,
        string fileName,
        CancellationToken cancellationToken = default)
    {
        var extension = Path.GetExtension(fileName);

        if (!string.Equals(extension, ".svg", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Only SVG files are allowed.");
        }

        var safeFileName = $"{Guid.NewGuid():N}.svg";

        var uploadDirectory = Path.Combine(
            _webRootPath,
            "uploads",
            "svg");

        Directory.CreateDirectory(uploadDirectory);

        var physicalPath = Path.Combine(
            uploadDirectory,
            safeFileName);

        await using var outputStream =
            new FileStream(
                physicalPath,
                FileMode.CreateNew,
                FileAccess.Write,
                FileShare.None);

        await fileStream.CopyToAsync(
            outputStream,
            cancellationToken);

        return $"/uploads/svg/{safeFileName}";
    }

    public Task<bool> DeleteAsync(
        string relativePath,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
        {
            return Task.FromResult(false);
        }

        var cleanPath = relativePath
            .TrimStart('/')
            .Replace('/', Path.DirectorySeparatorChar);

        var fullPath = Path.Combine(
            _webRootPath,
            cleanPath);

        if (!File.Exists(fullPath))
        {
            return Task.FromResult(false);
        }

        File.Delete(fullPath);

        return Task.FromResult(true);
    }
}