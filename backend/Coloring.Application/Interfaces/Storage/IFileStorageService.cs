namespace Coloring.Application.Interfaces.Storage;

public interface IFileStorageService
{
    Task<string> SaveSvgAsync(
        Stream fileStream,
        string fileName,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(
        string relativePath,
        CancellationToken cancellationToken = default);
}