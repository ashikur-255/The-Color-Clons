using System.Security.Claims;
using Coloring.Application.DTOs.Users;
using Coloring.Infrastructure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Coloring.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "Admin")]
public class AdminUsersController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole<int>> _roleManager;

    public AdminUsersController(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole<int>> roleManager)
    {
        _userManager = userManager;
        _roleManager = roleManager;
    }

    // GET: api/admin/users
    // GET: api/admin/users?search=john
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AdminUserDto>>> GetUsers(
        [FromQuery] string? search = null)
    {
        var usersQuery = _userManager.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim();

            usersQuery = usersQuery.Where(user =>
                user.DisplayName.Contains(search) ||
                user.Email!.Contains(search));
        }

        var users = usersQuery
            .OrderByDescending(x => x.CreatedAt)
            .ToList();

        var result = new List<AdminUserDto>();

        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);

            result.Add(new AdminUserDto
            {
                Id = user.Id,
                DisplayName = user.DisplayName,
                Email = user.Email ?? string.Empty,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                Roles = roles.ToList()
            });
        }

        return Ok(result);
    }

    // GET: api/admin/users/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<AdminUserDto>> GetUser(int id)
    {
        var user = await _userManager.FindByIdAsync(
            id.ToString());

        if (user == null)
        {
            return NotFound(new
            {
                message = "User not found."
            });
        }

        var roles = await _userManager.GetRolesAsync(user);

        var result = new AdminUserDto
        {
            Id = user.Id,
            DisplayName = user.DisplayName,
            Email = user.Email ?? string.Empty,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            Roles = roles.ToList()
        };

        return Ok(result);
    }

    // PUT: api/admin/users/5/status
    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(
        int id,
        [FromBody] UpdateUserStatusRequest request)
    {
        var user = await _userManager.FindByIdAsync(
            id.ToString());

        if (user == null)
        {
            return NotFound(new
            {
                message = "User not found."
            });
        }

        var currentUserIdValue =
            User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (int.TryParse(
                currentUserIdValue,
                out var currentUserId) &&
            currentUserId == user.Id &&
            !request.IsActive)
        {
            return BadRequest(new
            {
                message = "You cannot deactivate your own account."
            });
        }

        var roles = await _userManager.GetRolesAsync(user);

        if (!request.IsActive &&
            roles.Contains("Admin", StringComparer.OrdinalIgnoreCase))
        {
            var activeAdmins = await GetActiveAdminCountAsync();

            if (activeAdmins <= 1)
            {
                return BadRequest(new
                {
                    message = "The last active administrator cannot be deactivated."
                });
            }
        }

        user.IsActive = request.IsActive;

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
            message = request.IsActive
                ? "User activated successfully."
                : "User deactivated successfully.",
            isActive = user.IsActive
        });
    }

    // PUT: api/admin/users/5/role
    [HttpPut("{id:int}/role")]
    public async Task<IActionResult> UpdateRole(
        int id,
        [FromBody] UpdateUserRoleRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Role))
        {
            return BadRequest(new
            {
                message = "Role is required."
            });
        }

        var requestedRole = request.Role.Trim();

        if (!string.Equals(
                requestedRole,
                "User",
                StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(
                requestedRole,
                "Admin",
                StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new
            {
                message = "Only User and Admin roles are supported."
            });
        }

        var normalizedRole =
            string.Equals(
                requestedRole,
                "Admin",
                StringComparison.OrdinalIgnoreCase)
                ? "Admin"
                : "User";

        var roleExists = await _roleManager.RoleExistsAsync(
            normalizedRole);

        if (!roleExists)
        {
            return BadRequest(new
            {
                message = $"The {normalizedRole} role does not exist."
            });
        }

        var user = await _userManager.FindByIdAsync(
            id.ToString());

        if (user == null)
        {
            return NotFound(new
            {
                message = "User not found."
            });
        }

        var currentUserIdValue =
            User.FindFirstValue(ClaimTypes.NameIdentifier);

        var isCurrentUser =
            int.TryParse(
                currentUserIdValue,
                out var currentUserId) &&
            currentUserId == user.Id;

        var currentRoles =
            await _userManager.GetRolesAsync(user);

        var currentlyAdmin = currentRoles.Contains(
            "Admin",
            StringComparer.OrdinalIgnoreCase);

        var changingToAdmin =
            normalizedRole.Equals(
                "Admin",
                StringComparison.OrdinalIgnoreCase);

        if (isCurrentUser &&
            currentlyAdmin &&
            !changingToAdmin)
        {
            return BadRequest(new
            {
                message = "You cannot remove the Admin role from your own account."
            });
        }

        if (currentlyAdmin && !changingToAdmin)
        {
            var adminCount = await GetAdminCountAsync();

            if (adminCount <= 1)
            {
                return BadRequest(new
                {
                    message = "The last administrator cannot be removed."
                });
            }
        }

        if (currentlyAdmin == changingToAdmin)
        {
            return Ok(new
            {
                message = "User role is already up to date.",
                role = normalizedRole
            });
        }

        var removeResult = await _userManager.RemoveFromRolesAsync(
            user,
            currentRoles);

        if (!removeResult.Succeeded)
        {
            var errors = string.Join(
                " ",
                removeResult.Errors.Select(x => x.Description));

            return BadRequest(new
            {
                message = errors
            });
        }

        var addResult = await _userManager.AddToRoleAsync(
            user,
            normalizedRole);

        if (!addResult.Succeeded)
        {
            var errors = string.Join(
                " ",
                addResult.Errors.Select(x => x.Description));

            return BadRequest(new
            {
                message = errors
            });
        }

        return Ok(new
        {
            message = "User role updated successfully.",
            role = normalizedRole
        });
    }

    // DELETE: api/admin/users/5
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _userManager.FindByIdAsync(
            id.ToString());

        if (user == null)
        {
            return NotFound(new
            {
                message = "User not found."
            });
        }

        var currentUserIdValue =
            User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (int.TryParse(
                currentUserIdValue,
                out var currentUserId) &&
            currentUserId == user.Id)
        {
            return BadRequest(new
            {
                message = "You cannot delete your own account."
            });
        }

        var roles = await _userManager.GetRolesAsync(user);

        if (roles.Contains(
                "Admin",
                StringComparer.OrdinalIgnoreCase))
        {
            var adminCount = await GetAdminCountAsync();

            if (adminCount <= 1)
            {
                return BadRequest(new
                {
                    message = "The last administrator cannot be deleted."
                });
            }
        }

        var result = await _userManager.DeleteAsync(user);

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
            message = "User deleted successfully."
        });
    }

    private async Task<int> GetAdminCountAsync()
    {
        var admins = await _userManager.GetUsersInRoleAsync("Admin");

        return admins.Count;
    }

    private async Task<int> GetActiveAdminCountAsync()
    {
        var admins = await _userManager.GetUsersInRoleAsync("Admin");

        return admins.Count(x => x.IsActive);
    }
}

public class UpdateUserStatusRequest
{
    public bool IsActive { get; set; }
}

public class UpdateUserRoleRequest
{
    public string Role { get; set; } = string.Empty;
}