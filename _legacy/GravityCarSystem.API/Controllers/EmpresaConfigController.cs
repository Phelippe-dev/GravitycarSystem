using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GravityCarSystem.Infrastructure.Data;
using GravityCarSystem.Application.DTOs.Acesso;
using GravityCarSystem.Application.Interfaces;

namespace GravityCarSystem.API.Controllers;

[Authorize]
[ApiController]
[Route("api/empresa")]
public class EmpresaConfigController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ICurrentTenantService _currentTenantService;

    public EmpresaConfigController(AppDbContext context, ICurrentTenantService currentTenantService)
    {
        _context = context;
        _currentTenantService = currentTenantService;
    }

    private Guid GetEmpresaId()
    {
        var empresaId = _currentTenantService.GetEmpresaId();
        if (!empresaId.HasValue || empresaId.Value == Guid.Empty)
        {
            throw new UnauthorizedAccessException("Empresa não identificada.");
        }
        return empresaId.Value;
    }

    // ─── GET /api/empresa/minha ────────────────────────────────────────────
    [HttpGet("minha")]
    public async Task<IActionResult> ObterMinhaEmpresa()
    {
        try
        {
            var empresaId = GetEmpresaId();
            var empresa = await _context.Empresas.FirstOrDefaultAsync(e => e.Id == empresaId);
            if (empresa == null) return NotFound("Empresa não encontrada.");

            return Ok(new
            {
                id = empresa.Id,
                razaoSocial = empresa.RazaoSocial ?? "",
                nomeFantasia = empresa.NomeFantasia ?? "",
                cnpj = empresa.Cnpj ?? "",
                inscricaoEstadual = empresa.InscricaoEstadual ?? "",
                inscricaoMunicipal = empresa.InscricaoMunicipal ?? "",
                telefone = empresa.Telefone ?? "",
                email = empresa.Email ?? "",
                site = empresa.Site ?? "",
                logradouro = empresa.Logradouro ?? "",
                numero = empresa.Numero ?? "",
                complemento = empresa.Complemento ?? "",
                bairro = empresa.Bairro ?? "",
                cidade = empresa.Cidade ?? "",
                estado = empresa.Estado ?? "",
                cep = empresa.Cep ?? "",
                regimeTributario = empresa.RegimeTributario ?? "Simples Nacional",
                responsavelTecnico = empresa.ResponsavelTecnico ?? "",
                saldoConsultas = empresa.SaldoConsultas,
                consultasRealizadas = empresa.ConsultasRealizadas
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ex.Message);
        }
    }

    // ─── GET /api/empresa/saldo (leve — só retorna créditos) ──────────────
    [HttpGet("saldo")]
    public async Task<IActionResult> ObterSaldo()
    {
        try
        {
            var empresaId = GetEmpresaId();
            var empresa = await _context.Empresas.FirstOrDefaultAsync(e => e.Id == empresaId);
            if (empresa == null) return NotFound();
            return Ok(new
            {
                saldoConsultas = empresa.SaldoConsultas,
                consultasRealizadas = empresa.ConsultasRealizadas
            });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
    }

    // ─── POST /api/empresa/{id}/creditos (só SuperAdmin) ──────────────────
    [HttpPost("{empresaId:guid}/creditos")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> AdicionarCreditos(Guid empresaId, [FromBody] AdicionarCreditosDto dto)
    {
        var empresa = await _context.Empresas.FindAsync(empresaId);
        if (empresa == null) return NotFound("Empresa não encontrada.");
        empresa.SaldoConsultas += dto.Quantidade;
        await _context.SaveChangesAsync();
        return Ok(new { message = $"{dto.Quantidade} créditos adicionados.", novoSaldo = empresa.SaldoConsultas });
    }

    // ─── PUT /api/empresa/minha ────────────────────────────────────────────
    [HttpPut("minha")]
    public async Task<IActionResult> AtualizarMinhaEmpresa([FromBody] EmpresaConfigDto dto)
    {
        try
        {
            var empresaId = GetEmpresaId();
            var empresa = await _context.Empresas.FirstOrDefaultAsync(e => e.Id == empresaId);
            if (empresa == null) return NotFound("Empresa não encontrada.");

            empresa.RazaoSocial = dto.RazaoSocial;
            empresa.NomeFantasia = dto.NomeFantasia;
            empresa.Cnpj = dto.Cnpj;
            empresa.InscricaoEstadual = dto.InscricaoEstadual ?? "";
            empresa.InscricaoMunicipal = dto.InscricaoMunicipal ?? "";
            empresa.Telefone = dto.Telefone ?? "";
            empresa.Email = dto.Email ?? "";
            empresa.Site = dto.Site ?? "";
            empresa.Logradouro = dto.Logradouro ?? "";
            empresa.Numero = dto.Numero ?? "";
            empresa.Complemento = dto.Complemento ?? "";
            empresa.Bairro = dto.Bairro ?? "";
            empresa.Cidade = dto.Cidade ?? "";
            empresa.Estado = dto.Estado ?? "";
            empresa.Cep = dto.Cep ?? "";
            empresa.RegimeTributario = dto.RegimeTributario ?? "Simples Nacional";
            empresa.ResponsavelTecnico = dto.ResponsavelTecnico ?? "";

            await _context.SaveChangesAsync();
            return Ok(new { message = "Empresa atualizada com sucesso." });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ex.Message);
        }
    }
}
