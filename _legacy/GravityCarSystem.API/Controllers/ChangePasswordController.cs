using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GravityCarSystem.Infrastructure.Data;
using GravityCarSystem.Application.DTOs.Acesso;

namespace GravityCarSystem.API.Controllers;

[Authorize]
[ApiController]
[Route("api/auth")]
public class ChangePasswordController : ControllerBase
{
    private readonly AppDbContext _context;
    public ChangePasswordController(AppDbContext context) { _context = context; }

    [HttpPost("change-password")]
    public async Task<IActionResult> TrocarSenha([FromBody] TrocaSenhaDto dto)
    {
        var emailClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email || c.Type == "email" || c.Type == "sub");
        if (emailClaim == null) return Unauthorized("Token invalido.");

        var usuario = await _context.Usuarios
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email == emailClaim.Value);
        if (usuario == null) return NotFound("Usuario nao encontrado.");

        if (!BCrypt.Net.BCrypt.Verify(dto.SenhaAtual, usuario.SenhaHash))
            return BadRequest("Senha atual incorreta.");

        if (string.IsNullOrEmpty(dto.NovaSenha) || dto.NovaSenha.Length < 6)
            return BadRequest("Nova senha deve ter pelo menos 6 caracteres.");

        usuario.SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.NovaSenha);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Senha alterada com sucesso." });
    }
}
