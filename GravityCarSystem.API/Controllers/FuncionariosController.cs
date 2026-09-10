using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using GravityCarSystem.Domain.Entities.Acesso;
using GravityCarSystem.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GravityCarSystem.API.Controllers;

// ─── DTOs ─────────────────────────────────────────────────────────────────────
public record CriarFuncionarioDto(
    string Nome,
    string Email,
    string Senha,
    string Role,        // "Gerente" | "Vendedor"
    double ComissaoPercent,
    string? Cargo
);

public record AtualizarFuncionarioDto(
    string Nome,
    string Role,
    double ComissaoPercent,
    string? Cargo
);

// ─── Controller ───────────────────────────────────────────────────────────────
[Authorize]
[ApiController]
[Route("api/funcionarios")]
public class FuncionariosController : ControllerBase
{
    private readonly AppDbContext _context;

    public FuncionariosController(AppDbContext context)
    {
        _context = context;
    }

    private Guid GetEmpresaId()
    {
        var claim = User.Claims.FirstOrDefault(c => c.Type == "EmpresaId" || c.Type == "empresa_id");
        if (claim != null && Guid.TryParse(claim.Value, out var id)) return id;
        return Guid.Parse("00000000-0000-0000-0000-000000000001");
    }

    private string GetUserRole() => User.Claims.FirstOrDefault(c =>
        c.Type == ClaimTypes.Role || c.Type == "role" ||
        c.Type == "http://schemas.microsoft.com/ws/2008/06/identity/claims/role")?.Value ?? "Vendedor";

    // ─── GET /api/funcionarios ─────────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var empresaId = GetEmpresaId();

        var funcionarios = await _context.Usuarios
            .IgnoreQueryFilters()
            .Include(u => u.Perfis).ThenInclude(up => up.Perfil)
            .Where(u => u.EmpresaId == empresaId)
            .OrderBy(u => u.Nome)
            .Select(u => new
            {
                id = u.Id,
                nome = u.Nome,
                email = u.Email,
                cargo = u.Cargo ?? "",
                role = u.Perfis.FirstOrDefault() != null ? u.Perfis.First().Perfil!.Nome : "Vendedor",
                comissaoPercent = u.ComissaoPercent,
                ativo = u.Ativo,
                criadoEm = u.UltimoLogin
            })
            .ToListAsync();

        return Ok(funcionarios);
    }

    // ─── GET /api/funcionarios/{id} ────────────────────────────────────────
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Obter(Guid id)
    {
        var empresaId = GetEmpresaId();
        var u = await _context.Usuarios.IgnoreQueryFilters()
            .Include(x => x.Perfis).ThenInclude(up => up.Perfil)
            .FirstOrDefaultAsync(x => x.Id == id && x.EmpresaId == empresaId);
        if (u == null) return NotFound();
        return Ok(new
        {
            id = u.Id, nome = u.Nome, email = u.Email, cargo = u.Cargo ?? "",
            role = u.Perfis.FirstOrDefault()?.Perfil?.Nome ?? "Vendedor",
            comissaoPercent = u.ComissaoPercent, ativo = u.Ativo
        });
    }

    // ─── POST /api/funcionarios ────────────────────────────────────────────
    [HttpPost]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> Criar([FromBody] CriarFuncionarioDto dto)
    {
        var empresaId = GetEmpresaId();

        // Validação básica
        if (string.IsNullOrWhiteSpace(dto.Nome)) return BadRequest("Nome é obrigatório.");
        if (string.IsNullOrWhiteSpace(dto.Email)) return BadRequest("E-mail é obrigatório.");
        if (string.IsNullOrWhiteSpace(dto.Senha) || dto.Senha.Length < 6)
            return BadRequest("A senha deve ter no mínimo 6 caracteres.");

        var rolePermitida = dto.Role is "Gerente" or "Vendedor";
        if (!rolePermitida) return BadRequest("Papel inválido. Use 'Gerente' ou 'Vendedor'.");

        // Verificar e-mail duplicado
        var existe = await _context.Usuarios.IgnoreQueryFilters()
            .AnyAsync(u => u.Email == dto.Email);
        if (existe) return Conflict($"Já existe um usuário com o e-mail '{dto.Email}'.");

        // Buscar ou criar o Perfil
        var perfil = await _context.Perfis.FirstOrDefaultAsync(p => p.Nome == dto.Role);
        if (perfil == null)
        {
            perfil = new Perfil { Nome = dto.Role, Descricao = dto.Role };
            _context.Perfis.Add(perfil);
            await _context.SaveChangesAsync();
        }

        // Criar o usuário
        var novoUsuario = new Usuario
        {
            Nome = dto.Nome.Trim(),
            Email = dto.Email.Trim().ToLower(),
            SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.Senha),
            EmpresaId = empresaId,
            Ativo = true,
            Cargo = dto.Cargo?.Trim() ?? dto.Role,
            ComissaoPercent = dto.ComissaoPercent
        };
        _context.Usuarios.Add(novoUsuario);
        await _context.SaveChangesAsync();

        // Vincular ao Perfil
        _context.UsuarioPerfis.Add(new UsuarioPerfil { UsuarioId = novoUsuario.Id, PerfilId = perfil.Id });
        await _context.SaveChangesAsync();

        return Ok(new { message = "Funcionário cadastrado com sucesso.", id = novoUsuario.Id });
    }

    // ─── PUT /api/funcionarios/{id} ────────────────────────────────────────
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> Atualizar(Guid id, [FromBody] AtualizarFuncionarioDto dto)
    {
        var empresaId = GetEmpresaId();
        var usuario = await _context.Usuarios.IgnoreQueryFilters()
            .Include(u => u.Perfis)
            .FirstOrDefaultAsync(u => u.Id == id && u.EmpresaId == empresaId);
        if (usuario == null) return NotFound("Funcionário não encontrado.");

        var rolePermitida = dto.Role is "Gerente" or "Vendedor";
        if (!rolePermitida) return BadRequest("Papel inválido. Use 'Gerente' ou 'Vendedor'.");

        usuario.Nome = dto.Nome.Trim();
        usuario.Cargo = dto.Cargo?.Trim() ?? dto.Role;
        usuario.ComissaoPercent = dto.ComissaoPercent;

        // Atualizar Perfil
        var perfil = await _context.Perfis.FirstOrDefaultAsync(p => p.Nome == dto.Role);
        if (perfil == null)
        {
            perfil = new Perfil { Nome = dto.Role, Descricao = dto.Role };
            _context.Perfis.Add(perfil);
            await _context.SaveChangesAsync();
        }

        // Remover perfis antigos e adicionar o novo
        var perfisAntigos = _context.UsuarioPerfis.Where(up => up.UsuarioId == id);
        _context.UsuarioPerfis.RemoveRange(perfisAntigos);
        _context.UsuarioPerfis.Add(new UsuarioPerfil { UsuarioId = id, PerfilId = perfil.Id });

        await _context.SaveChangesAsync();
        return Ok(new { message = "Funcionário atualizado." });
    }

    // ─── PATCH /api/funcionarios/{id}/toggle-ativo ─────────────────────────
    [HttpPatch("{id:guid}/toggle-ativo")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> ToggleAtivo(Guid id)
    {
        var empresaId = GetEmpresaId();
        var usuario = await _context.Usuarios.IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id == id && u.EmpresaId == empresaId);
        if (usuario == null) return NotFound("Funcionário não encontrado.");

        usuario.Ativo = !usuario.Ativo;
        await _context.SaveChangesAsync();
        return Ok(new { message = usuario.Ativo ? "Acesso reativado." : "Acesso desativado.", ativo = usuario.Ativo });
    }
}
