using Microsoft.AspNetCore.Mvc;
using MotorsXySystem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using System.Linq;

namespace MotorsXySystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DebugController : ControllerBase
{
    private readonly AppDbContext _context;

    public DebugController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("usuarios")]
    public async Task<IActionResult> GetUsuarios()
    {
        var users = await _context.Usuarios.IgnoreQueryFilters().Select(u => new { u.Email, u.SenhaHash }).ToListAsync();
        return Ok(users);
    }
}
