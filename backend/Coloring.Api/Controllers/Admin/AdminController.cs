using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Coloring.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    // ============================================================
    // ADMIN TEST
    // GET: /api/admin/test
    // ============================================================

    [HttpGet("test")]
    public IActionResult Test()
    {
        return Ok(new
        {
            message = "Admin API is working."
        });
    }
}