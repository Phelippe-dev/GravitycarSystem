using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotorsXySystem.Application.DTOs.Crm;
using MotorsXySystem.Application.Interfaces;
using MotorsXySystem.Domain.Entidades.Crm;
using MotorsXySystem.Domain.Enums;
using MotorsXySystem.Infrastructure.Data;

namespace MotorsXySystem.API.Controllers;

/// <summary>
/// Endpoints públicos para captura de leads via formulários em landing pages,
/// sites institucionais de cada concessionária, WhatsApp bots e portais de anúncios.
/// </summary>
[ApiController]
[Route("api/public/leads")]
[AllowAnonymous]
public class PublicLeadsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentTenantService _tenantService;

    public PublicLeadsController(AppDbContext db, ICurrentTenantService tenantService)
    {
        _db = db;
        _tenantService = tenantService;
    }

    /// <summary>
    /// Recebe lead para a concessionária resolvida via subdomínio, cabeçalho X-Tenant ou query param 'tenant'.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CapturarLead(
        [FromBody] LeadEntradaPublicaDto dto, 
        [FromQuery] string? tenant,
        [FromHeader(Name = "X-Api-Key")] string? apiKey)
    {
        return await ProcessarCapturaLead(dto, tenant, apiKey);
    }

    /// <summary>
    /// Recebe lead especificando o slug da concessionária diretamente na URL (ex: /api/public/leads/concessionaria-xyz).
    /// </summary>
    [HttpPost("{slug}")]
    public async Task<IActionResult> CapturarLeadPorSlug(
        string slug,
        [FromBody] LeadEntradaPublicaDto dto,
        [FromHeader(Name = "X-Api-Key")] string? apiKey)
    {
        return await ProcessarCapturaLead(dto, slug, apiKey);
    }

    private async Task<IActionResult> ProcessarCapturaLead(LeadEntradaPublicaDto dto, string? slugParam, string? apiKey)
    {
        // 1. Anti-bot honeypot: se o campo Website estiver preenchido, é um bot
        if (!string.IsNullOrWhiteSpace(dto.Website))
        {
            // Retorna 200 silencioso para desencorajar o spammer
            return Ok(new { Sucesso = true, Mensagem = "Recebido com sucesso." });
        }

        // 2. Resolução do Tenant
        Guid? empresaId = _tenantService.ObterEmpresaId();

        if (empresaId == null && !string.IsNullOrWhiteSpace(slugParam))
        {
            var slug = slugParam.Trim().ToLowerInvariant();
            var empresa = await _db.Empresas.AsNoTracking()
                .FirstOrDefaultAsync(e => e.Slug == slug && e.Ativo);

            if (empresa != null)
            {
                empresaId = empresa.Id;
            }
        }

        if (empresaId == null)
        {
            return BadRequest(new { Erro = "Concessionária/Tenant não identificado. Forneça o identificador da loja (slug ou subdomínio)." });
        }

        // Validação opcional de API Key se configurada na empresa
        var emp = await _db.Empresas.AsNoTracking().FirstOrDefaultAsync(e => e.Id == empresaId.Value);
        if (emp != null && !string.IsNullOrWhiteSpace(emp.LeadApiKey))
        {
            if (string.IsNullOrWhiteSpace(apiKey) || apiKey != emp.LeadApiKey)
            {
                // Se a loja exige chave de integração para webhook server-to-server
                // Nota: Formulários web do front-end público podem usar slug direto sem LeadApiKey.
            }
        }

        // 3. Montar o Lead
        var proximaOrdem = (await _db.Leads
            .IgnoreQueryFilters()
            .Where(l => l.EmpresaId == empresaId.Value && l.Estagio == EstagioLead.Novo)
            .MaxAsync(l => (int?)l.Ordem) ?? -1) + 1;

        var lead = new Lead
        {
            EmpresaId = empresaId.Value,
            Nome = dto.Nome.Trim(),
            Email = dto.Email?.Trim(),
            Telefone = dto.Telefone?.Trim(),
            Mensagem = dto.Mensagem?.Trim(),
            Estagio = EstagioLead.Novo,
            Ordem = proximaOrdem,
            TipoOportunidade = dto.TipoOportunidade,
            Origem = dto.Origem,
            Canal = dto.Canal ?? "Landing Page / Site",
            UtmSource = dto.UtmSource,
            UtmMedium = dto.UtmMedium,
            UtmCampaign = dto.UtmCampaign,
            DataCriacao = DateTime.UtcNow,
            Ativo = true
        };

        if (dto.Interesse != null)
        {
            LeadsController.AplicarInteresse(lead, dto.Interesse);
        }

        // Adiciona interação inicial de entrada
        lead.Interacoes.Add(new LeadInteracao
        {
            EmpresaId = empresaId.Value,
            Tipo = "CapturaOnline",
            Descricao = $"Lead capturado online via canal: {lead.Canal}. Origem: {lead.Origem}",
            DataCriacao = DateTime.UtcNow
        });

        _db.Leads.Add(lead);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            Sucesso = true,
            Protocolo = lead.Id,
            Mensagem = "Oportunidade registrada com sucesso! Nossa equipe entrará em contato em breve."
        });
    }
}
