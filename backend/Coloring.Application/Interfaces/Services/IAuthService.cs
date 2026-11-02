using Coloring.Application.DTOs.Auth;

namespace Coloring.Application.Interfaces.Services;

public interface IAuthService
{
    Task<AuthResultDto> RegisterAsync(
        string displayName,
        string email,
        string password);

    Task<AuthResultDto?> LoginAsync(
        string email,
        string password);
}