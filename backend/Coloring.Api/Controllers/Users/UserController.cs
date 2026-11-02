using System.Security.Claims;
using Coloring.Infrastructure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Coloring.Api.Controllers.Users;

[ApiController]
[Route("api/users")]
[Authorize]
public class UserController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;

    public UserController(
        UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userIdValue =
            User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var user = await _userManager.FindByIdAsync(
            userId.ToString());

        if (user == null)
        {
            return NotFound(new
            {
                message = "User not found."
            });
        }

        var roles = await _userManager.GetRolesAsync(user);

        return Ok(new
        {
            id = user.Id,
            displayName = user.DisplayName,
            email = user.Email,
            isActive = user.IsActive,
            createdAt = user.CreatedAt,
            roles
        });
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyProfile(
        [FromBody] UpdateProfileRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.DisplayName))
        {
            return BadRequest(new
            {
                message = "Display name is required."
            });
        }

        var userIdValue =
            User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var user = await _userManager.FindByIdAsync(
            userId.ToString());

        if (user == null)
        {
            return NotFound(new
            {
                message = "User not found."
            });
        }

        user.DisplayName = request.DisplayName.Trim();

        var result = await _userManager.UpdateAsync(user);

        if (!result.Succeeded)
        {
            var errors = string.Join(
                " ",
                result.Errors.Select(x => x.Description));

            return BadRequest(new
            {
                message = errors
            });
        }

        return Ok(new
        {
            message = "Profile updated successfully.",
            displayName = user.DisplayName
        });
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(
    [FromBody] ChangePasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CurrentPassword))
        {
            return BadRequest(new
            {
                message = "Current password is required."
            });
        }

        if (string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return BadRequest(new
            {
                message = "New password is required."
            });
        }

        var userIdValue =
            User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var user = await _userManager.FindByIdAsync(
            userId.ToString());

        if (user == null)
        {
            return NotFound(new
            {
                message = "User not found."
            });
        }

        var result = await _userManager.ChangePasswordAsync(
            user,
            request.CurrentPassword,
            request.NewPassword);

        if (!result.Succeeded)
        {
            var errors = string.Join(
                " ",
                result.Errors.Select(x => x.Description));

            return BadRequest(new
            {
                message = errors
            });
        }

        return Ok(new
        {
            message = "Password changed successfully."
        });
    }
}

// Request DTO
public class UpdateProfileRequest
{
    public string DisplayName { get; set; } = string.Empty;
}