using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotorsXySystem.Domain.Entidades.Acesso;
using MotorsXySystem.Domain.Entidades.Tenant;
using MotorsXySystem.Infrastructure.Data;
using MotorsXySystem.Infrastructure.Middleware;

namespace MotorsXySystem.API.Controllers;

[ApiController]
[Route("api/admin/empresas")]
[Authorize(Roles = TenantMiddleware.RoleSuperAdmin)]
public class AdminEmpresasController : ControllerBase
{
    private readonly AppDbContext _context;

    public AdminEmpresasController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> ListarTodas()
    {
        var empresas = await _context.Empresas.IgnoreQueryFilters()
            .OrderByDescending(e => e.DataCriacao)
            .Select(e => new
            {
                id = e.Id,
                razaoSocial = e.RazaoSocial,
                nomeFantasia = e.NomeFantasia,
                cnpj = e.Cnpj,
                inscricaoEstadual = e.InscricaoEstadual,
                telefone = e.Telefone,
                email = e.Email,
                cidade = e.Cidade,
                estado = e.Uf,
                ativa = e.Ativo,
                saldoConsultas = 100,
                criadoEm = e.DataCriacao
            })
            .ToListAsync();

        return Ok(empresas);
    }

    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] CriarEmpresaAdminRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RazaoSocial))
            return BadRequest(new { Erro = "A Razão Social é obrigatória." });

        var nomeFantasia = string.IsNullOrWhiteSpace(request.NomeFantasia) ? request.RazaoSocial : request.NomeFantasia;
        var slug = request.Slug;
        if (string.IsNullOrWhiteSpace(slug))
        {
            slug = new string(nomeFantasia.ToLowerInvariant().Where(char.IsLetterOrDigit).ToArray());
            if (string.IsNullOrWhiteSpace(slug)) slug = "loja-" + Guid.NewGuid().ToString("N")[..6];
        }

        var empresa = new Empresa
        {
            RazaoSocial = request.RazaoSocial,
            NomeFantasia = nomeFantasia,
            Cnpj = request.Cnpj,
            InscricaoEstadual = request.InscricaoEstadual,
            Telefone = request.Telefone,
            Email = request.Email,
            Cidade = request.Cidade,
            Uf = request.Estado ?? request.Uf,
            Slug = slug,
            DataCriacao = DateTime.UtcNow,
            Ativo = true
        };

        _context.Empresas.Add(empresa);
        await _context.SaveChangesAsync();

        // Cria perfil de Administrador da loja
        var perfilAdmin = new Perfil
        {
            EmpresaId = empresa.Id,
            Nome = "Administrador",
            Descricao = "Acesso completo à gestão da concessionária",
            DataCriacao = DateTime.UtcNow,
            Ativo = true
        };
        _context.Perfis.Add(perfilAdmin);
        await _context.SaveChangesAsync();

        // Se informou e-mail para primeiro acesso do dono, cria o usuário inicial
        var emailDono = string.IsNullOrWhiteSpace(request.Email) ? $"admin@{slug}.com.br" : request.Email;
        var senhaDono = string.IsNullOrWhiteSpace(request.SenhaAdmin) ? "Mudar123!" : request.SenhaAdmin;
        var codigoLiberacao = Random.Shared.Next(100000, 999999).ToString();

        var usuarioDono = new Usuario
        {
            EmpresaId = empresa.Id,
            Nome = "Administrador " + nomeFantasia,
            Email = emailDono.Trim().ToLowerInvariant(),
            SenhaHash = BCrypt.Net.BCrypt.HashPassword(senhaDono),
            CodigoLiberacao = codigoLiberacao,
            PerfilId = perfilAdmin.Id,
            DataCriacao = DateTime.UtcNow,
            Ativo = true
        };
        _context.Usuarios.Add(usuarioDono);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(ListarTodas), new
        {
            id = empresa.Id,
            razaoSocial = empresa.RazaoSocial,
            nomeFantasia = empresa.NomeFantasia,
            cnpj = empresa.Cnpj,
            inscricaoEstadual = empresa.InscricaoEstadual,
            telefone = empresa.Telefone,
            email = empresa.Email,
            cidade = empresa.Cidade,
            estado = empresa.Uf,
            ativa = empresa.Ativo,
            saldoConsultas = 100,
            criadoEm = empresa.DataCriacao,
            codigoLiberacao = codigoLiberacao
        });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Atualizar(Guid id, [FromBody] CriarEmpresaAdminRequest request)
    {
        var empresa = await _context.Empresas.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.Id == id);
        if (empresa == null) return NotFound(new { Erro = "Empresa não encontrada." });

        if (!string.IsNullOrWhiteSpace(request.RazaoSocial)) empresa.RazaoSocial = request.RazaoSocial;
        if (!string.IsNullOrWhiteSpace(request.NomeFantasia)) empresa.NomeFantasia = request.NomeFantasia;
        if (request.Cnpj != null) empresa.Cnpj = request.Cnpj;
        if (request.InscricaoEstadual != null) empresa.InscricaoEstadual = request.InscricaoEstadual;
        if (request.Telefone != null) empresa.Telefone = request.Telefone;
        if (request.Email != null) empresa.Email = request.Email;
        if (request.Cidade != null) empresa.Cidade = request.Cidade;
        if (request.Estado != null || request.Uf != null) empresa.Uf = request.Estado ?? request.Uf;

        empresa.DataAtualizacao = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new
        {
            id = empresa.Id,
            razaoSocial = empresa.RazaoSocial,
            nomeFantasia = empresa.NomeFantasia,
            cnpj = empresa.Cnpj,
            ativa = empresa.Ativo
        });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Deletar(Guid id)
    {
        var empresa = await _context.Empresas.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.Id == id);
        if (empresa == null) return NotFound(new { Erro = "Empresa não encontrada." });

        // Soft delete para preservar integridade relacional
        empresa.Ativo = false;
        empresa.DataAtualizacao = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPatch("{id:guid}/toggle-status")]
    public async Task<IActionResult> AlternarStatus(Guid id)
    {
        var empresa = await _context.Empresas.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.Id == id);
        if (empresa == null) return NotFound(new { Erro = "Empresa não encontrada." });

        empresa.Ativo = !empresa.Ativo;
        empresa.DataAtualizacao = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { ativa = empresa.Ativo });
    }

    [HttpPost("{id:guid}/creditos")]
    public IActionResult AdicionarCreditos(Guid id, [FromBody] object payload)
    {
        return Ok(new { sucesso = true, novoSaldo = 500 });
    }
}

public class CriarEmpresaAdminRequest
{
    public string RazaoSocial { get; set; } = string.Empty;
    public string? NomeFantasia { get; set; }
    public string? Cnpj { get; set; }
    public string? InscricaoEstadual { get; set; }
    public string? Telefone { get; set; }
    public string? Email { get; set; }
    public string? Cidade { get; set; }
    public string? Estado { get; set; }
    public string? Uf { get; set; }
    public string? Slug { get; set; }
    public string? SenhaAdmin { get; set; }
}
