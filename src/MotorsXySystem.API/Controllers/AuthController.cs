using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotorsXySystem.Application.DTOs;
using MotorsXySystem.Application.Interfaces;
using MotorsXySystem.Infrastructure.Data;

namespace MotorsXySystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ITokenService _tokenService;

    public AuthController(AppDbContext context, ITokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] AuthRequest request)
    {
        // IgnoreQueryFilters é necessário pois quem está tentando logar 
        // ainda não definiu o TenantId na requisição.
        var usuario = await _context.Usuarios
            .Include(u => u.Perfil)
            .IgnoreQueryFilters()
            .OrderByDescending(u => u.DataCriacao)
            .FirstOrDefaultAsync(u => u.Email == request.Email && u.Ativo);

        if (usuario == null) return Unauthorized(new { Erro = "Usuário ou senha inválidos." });

        // Validação da senha com BCrypt
        bool senhaValida = false;
        try 
        {
            senhaValida = BCrypt.Net.BCrypt.Verify(request.Senha, usuario.SenhaHash);
        }
        catch 
        {
            // Fallback temporário para usuários criados antes do BCrypt
            senhaValida = request.Senha == usuario.SenhaHash;
        }

        if (!senhaValida) return Unauthorized(new { Erro = "Usuário ou senha inválidos." });

        var token = _tokenService.GerarToken(usuario);

        return Ok(new AuthResponse
        {
            Token = token,
            UsuarioId = usuario.Id,
            EmpresaId = usuario.EmpresaId,
            Nome = usuario.Nome
        });
    }
}
