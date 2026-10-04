using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotorsXySystem.Application.Interfaces;
using MotorsXySystem.Domain.Entidades.Acesso;
using MotorsXySystem.Infrastructure.Data;

namespace MotorsXySystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FuncionariosController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public FuncionariosController(AppDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var empresaId = _tenantService.ObterEmpresaId();
        if (!empresaId.HasValue) return BadRequest(new { Erro = "Tenant não identificado." });

        var usuarios = await _context.Usuarios.IgnoreQueryFilters()
            .Where(u => u.EmpresaId == empresaId.Value && u.Ativo)
            .Include(u => u.Perfil)
            .OrderBy(u => u.Nome)
            .Select(u => new
            {
                id = u.Id,
                nome = u.Nome,
                email = u.Email,
                cargo = u.Perfil.Nome,
                role = u.Perfil.Nome == "SuperAdmin" ? "Admin" : u.Perfil.Nome,
                comissaoPercent = 2.0,
                ativo = u.Ativo,
                codigoLiberacao = u.CodigoLiberacao,
                criadoEm = u.DataCriacao
            })
            .ToListAsync();

        return Ok(usuarios);
    }

    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] CriarFuncionarioRequest request)
    {
        var empresaId = _tenantService.ObterEmpresaId();
        if (!empresaId.HasValue) return BadRequest(new { Erro = "Tenant não identificado." });

        if (string.IsNullOrWhiteSpace(request.Nome) || string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { Erro = "Nome e E-mail são obrigatórios." });

        var emailLimpo = request.Email.Trim().ToLowerInvariant();
        var existe = await _context.Usuarios.IgnoreQueryFilters()
            .AnyAsync(u => u.Email.ToLower() == emailLimpo && u.Ativo);

        if (existe) return BadRequest(new { Erro = "Já existe um usuário ativo com este e-mail." });

        var perfilNome = string.IsNullOrWhiteSpace(request.Role) ? "Vendedor" : request.Role;
        var perfil = await _context.Perfis.IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.EmpresaId == empresaId.Value && p.Nome == perfilNome);

        if (perfil == null)
        {
            perfil = new Perfil
            {
                EmpresaId = empresaId.Value,
                Nome = perfilNome,
                Descricao = "Perfil " + perfilNome,
                DataCriacao = DateTime.UtcNow,
                Ativo = true
            };
            _context.Perfis.Add(perfil);
            await _context.SaveChangesAsync();
        }

        var senha = string.IsNullOrWhiteSpace(request.Senha) ? "Mudar123!" : request.Senha;
        var codigoLiberacao = Random.Shared.Next(100000, 999999).ToString();

        var usuario = new Usuario
        {
            EmpresaId = empresaId.Value,
            Nome = request.Nome.Trim(),
            Email = emailLimpo,
            SenhaHash = BCrypt.Net.BCrypt.HashPassword(senha),
            CodigoLiberacao = codigoLiberacao,
            PerfilId = perfil.Id,
            DataCriacao = DateTime.UtcNow,
            Ativo = true
        };

        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(Listar), new
        {
            id = usuario.Id,
            nome = usuario.Nome,
            email = usuario.Email,
            cargo = perfil.Nome,
            role = perfil.Nome,
            comissaoPercent = request.ComissaoPercent ?? 2.0,
            ativo = usuario.Ativo,
            codigoLiberacao = usuario.CodigoLiberacao,
            criadoEm = usuario.DataCriacao
        });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Atualizar(Guid id, [FromBody] CriarFuncionarioRequest request)
    {
        var empresaId = _tenantService.ObterEmpresaId();
        if (!empresaId.HasValue) return BadRequest(new { Erro = "Tenant não identificado." });

        var usuario = await _context.Usuarios.IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id == id && u.EmpresaId == empresaId.Value);

        if (usuario == null) return NotFound(new { Erro = "Funcionário não encontrado." });

        if (!string.IsNullOrWhiteSpace(request.Nome)) usuario.Nome = request.Nome.Trim();
        if (!string.IsNullOrWhiteSpace(request.Email)) usuario.Email = request.Email.Trim().ToLowerInvariant();
        if (!string.IsNullOrWhiteSpace(request.Senha)) usuario.SenhaHash = BCrypt.Net.BCrypt.HashPassword(request.Senha);

        if (!string.IsNullOrWhiteSpace(request.Role))
        {
            var perfil = await _context.Perfis.IgnoreQueryFilters()
                .FirstOrDefaultAsync(p => p.EmpresaId == empresaId.Value && p.Nome == request.Role);
            if (perfil != null) usuario.PerfilId = perfil.Id;
        }

        usuario.DataAtualizacao = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { Mensagem = "Funcionário atualizado com sucesso." });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Deletar(Guid id)
    {
        var empresaId = _tenantService.ObterEmpresaId();
        if (!empresaId.HasValue) return BadRequest(new { Erro = "Tenant não identificado." });

        var usuario = await _context.Usuarios.IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id == id && u.EmpresaId == empresaId.Value);

        if (usuario == null) return NotFound(new { Erro = "Funcionário não encontrado." });

        usuario.Ativo = false;
        usuario.DataAtualizacao = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

public class CriarFuncionarioRequest
{
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Senha { get; set; }
    public string? Role { get; set; }
    public double? ComissaoPercent { get; set; }
    public string? Cargo { get; set; }
}
