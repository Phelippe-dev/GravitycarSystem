using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotorsXySystem.Application.Interfaces;
using MotorsXySystem.Infrastructure.Data;

namespace MotorsXySystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmpresaController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public EmpresaController(AppDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    [HttpGet("minha")]
    public async Task<IActionResult> ObterMinha()
    {
        var empresaId = _tenantService.ObterEmpresaId();
        if (!empresaId.HasValue) return BadRequest(new { Erro = "Tenant não identificado." });

        var empresa = await _context.Empresas.IgnoreQueryFilters()
            .FirstOrDefaultAsync(e => e.Id == empresaId.Value);

        if (empresa == null) return NotFound(new { Erro = "Empresa não encontrada." });

        return Ok(new
        {
            id = empresa.Id,
            razaoSocial = empresa.RazaoSocial,
            nomeFantasia = empresa.NomeFantasia,
            cnpj = empresa.Cnpj,
            inscricaoEstadual = empresa.InscricaoEstadual,
            telefone = empresa.Telefone,
            email = empresa.Email,
            logradouro = empresa.Endereco,
            cidade = empresa.Cidade,
            estado = empresa.Uf,
            cep = empresa.Cep,
            slug = empresa.Slug,
            termoGarantiaPadrao = empresa.TermoGarantiaPadrao,
            logoUrl = empresa.LogoUrl,
            temaCorPrincipal = empresa.TemaCorPrincipal,
            temaCorSecundaria = empresa.TemaCorSecundaria,
            ativa = empresa.Ativo
        });
    }

    [HttpPut("minha")]
    public async Task<IActionResult> AtualizarMinha([FromBody] AtualizarMinhaEmpresaRequest request)
    {
        var empresaId = _tenantService.ObterEmpresaId();
        if (!empresaId.HasValue) return BadRequest(new { Erro = "Tenant não identificado." });

        var empresa = await _context.Empresas.IgnoreQueryFilters()
            .FirstOrDefaultAsync(e => e.Id == empresaId.Value);

        if (empresa == null) return NotFound(new { Erro = "Empresa não encontrada." });

        if (!string.IsNullOrWhiteSpace(request.RazaoSocial)) empresa.RazaoSocial = request.RazaoSocial;
        if (!string.IsNullOrWhiteSpace(request.NomeFantasia)) empresa.NomeFantasia = request.NomeFantasia;
        if (request.Cnpj != null) empresa.Cnpj = request.Cnpj;
        if (request.InscricaoEstadual != null) empresa.InscricaoEstadual = request.InscricaoEstadual;
        if (request.Telefone != null) empresa.Telefone = request.Telefone;
        if (request.Email != null) empresa.Email = request.Email;
        if (request.Logradouro != null) empresa.Endereco = request.Logradouro;
        if (request.Cidade != null) empresa.Cidade = request.Cidade;
        if (request.Estado != null) empresa.Uf = request.Estado;
        if (request.Cep != null) empresa.Cep = request.Cep;
        if (request.TermoGarantiaPadrao != null) empresa.TermoGarantiaPadrao = request.TermoGarantiaPadrao;
        if (request.LogoUrl != null) empresa.LogoUrl = request.LogoUrl;

        empresa.DataAtualizacao = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { Mensagem = "Configurações da empresa atualizadas com sucesso." });
    }

    [HttpGet("saldo")]
    public IActionResult ObterSaldo()
    {
        return Ok(new
        {
            saldoConsultas = 250,
            consultasRealizadas = 12
        });
    }
}

public class AtualizarMinhaEmpresaRequest
{
    public string? RazaoSocial { get; set; }
    public string? NomeFantasia { get; set; }
    public string? Cnpj { get; set; }
    public string? InscricaoEstadual { get; set; }
    public string? Telefone { get; set; }
    public string? Email { get; set; }
    public string? Logradouro { get; set; }
    public string? Cidade { get; set; }
    public string? Estado { get; set; }
    public string? Cep { get; set; }
    public string? TermoGarantiaPadrao { get; set; }
    public string? LogoUrl { get; set; }
}
