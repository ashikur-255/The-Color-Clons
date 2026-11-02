namespace Coloring.Application.Interfaces.Security;

public interface ISvgSecurityValidator
{
    Task ValidateAsync(
        Stream svgStream,
        CancellationToken cancellationToken = default);
}