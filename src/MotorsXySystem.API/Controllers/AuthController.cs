using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotorsXySystem.Application.DTOs;
using MotorsXySystem.Application.Interfaces;
using MotorsXySystem.Domain.Entidades.Acesso;
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

    /// <summary>
    /// Autenticação via token de segurança / código de liberação de 6 dígitos fornecido ao cliente.
    /// </summary>
    [HttpPost("login-token")]
    public async Task<IActionResult> LoginToken([FromBody] LoginTokenRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Codigo))
            return BadRequest(new { Erro = "Informe o código de liberação de 6 dígitos." });

        var codigoLimpo = request.Codigo.Trim().Replace(" ", "").Replace("-", "");

        if (codigoLimpo.Length != 6 || !System.Linq.Enumerable.All(codigoLimpo, char.IsDigit))
            return BadRequest(new { Erro = "O código de liberação deve conter exatamente 6 dígitos numéricos." });

        var query = _context.Usuarios
            .Include(u => u.Perfil)
            .IgnoreQueryFilters()
            .Where(u => u.Ativo && u.CodigoLiberacao == codigoLimpo);

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var emailLimpo = request.Email.Trim().ToLowerInvariant();
            query = query.Where(u => u.Email.ToLower() == emailLimpo);
        }

        var usuario = await query
            .OrderByDescending(u => u.DataCriacao)
            .FirstOrDefaultAsync();

        if (usuario == null)
            return Unauthorized(new { Erro = "Código de liberação inválido ou não encontrado." });

        if (usuario.DataExpiracaoCodigoLiberacao.HasValue && usuario.DataExpiracaoCodigoLiberacao.Value < System.DateTime.UtcNow)
            return Unauthorized(new { Erro = "Este código de liberação expirou. Solicite um novo código ao administrador." });

        var token = _tokenService.GerarToken(usuario);

        return Ok(new AuthResponse
        {
            Token = token,
            UsuarioId = usuario.Id,
            EmpresaId = usuario.EmpresaId,
            Nome = usuario.Nome
        });
    }

    /// <summary>
    /// Impersonação de Concessionária (SuperAdmin acessa o tenant selecionado).
    /// </summary>
    [HttpPost("impersonate/{empresaId:guid}")]
    [Authorize(Roles = MotorsXySystem.Infrastructure.Middleware.TenantMiddleware.RoleSuperAdmin)]
    public async Task<IActionResult> Impersonate(Guid empresaId)
    {
        var empresa = await _context.Empresas.IgnoreQueryFilters()
            .FirstOrDefaultAsync(e => e.Id == empresaId && e.Ativo);

        if (empresa == null) return NotFound(new { Erro = "Empresa não encontrada ou inativa." });

        var adminUser = await _context.Usuarios.IgnoreQueryFilters()
            .Include(u => u.Perfil)
            .FirstOrDefaultAsync(u => u.EmpresaId == empresaId && u.Ativo);

        if (adminUser == null)
        {
            var perfilAdmin = await _context.Perfis.IgnoreQueryFilters()
                .FirstOrDefaultAsync(p => p.EmpresaId == empresaId);
            
            if (perfilAdmin == null)
            {
                perfilAdmin = new Perfil { EmpresaId = empresaId, Nome = "Administrador", Descricao = "Admin", DataCriacao = DateTime.UtcNow, Ativo = true };
                _context.Perfis.Add(perfilAdmin);
                await _context.SaveChangesAsync();
            }

            adminUser = new Usuario
            {
                Id = Guid.NewGuid(),
                EmpresaId = empresaId,
                Nome = "Gestor (" + empresa.NomeFantasia + ")",
                Email = "gestor@" + (empresa.Slug ?? "tenant") + ".local",
                PerfilId = perfilAdmin.Id,
                Perfil = perfilAdmin,
                Ativo = true
            };
        }

        var token = _tokenService.GerarToken(adminUser);

        return Ok(new
        {
            token = token,
            nome = adminUser.Nome,
            email = adminUser.Email
        });
    }

    /// <summary>
    /// Alteração de senha do usuário autenticado.
    /// </summary>
    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("nameid")?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { Erro = "Sessão inválida." });

        var usuario = await _context.Usuarios.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == userId && u.Ativo);
        if (usuario == null) return NotFound(new { Erro = "Usuário não encontrado." });

        bool senhaAtualValida = false;
        try { senhaAtualValida = BCrypt.Net.BCrypt.Verify(request.SenhaAtual, usuario.SenhaHash); }
        catch { senhaAtualValida = request.SenhaAtual == usuario.SenhaHash; }

        if (!senhaAtualValida) return BadRequest(new { Erro = "Senha atual incorreta." });

        usuario.SenhaHash = BCrypt.Net.BCrypt.HashPassword(request.NovaSenha);
        usuario.DataAtualizacao = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { Mensagem = "Senha alterada com sucesso!" });
    }
}

public class ChangePasswordRequest
{
    public string SenhaAtual { get; set; } = string.Empty;
    public string NovaSenha { get; set; } = string.Empty;
}


