using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotorsXySystem.Application.DTOs.Crm;
using MotorsXySystem.Domain.Entidades.Cadastros;
using MotorsXySystem.Domain.Entidades.Crm;
using MotorsXySystem.Domain.Enums;
using MotorsXySystem.Infrastructure.Data;

namespace MotorsXySystem.API.Controllers;

/// <summary>Pipeline de oportunidades (Kanban/CRM) — uso interno da loja.</summary>
[ApiController]
[Route("api/leads")]
[Authorize]
public class LeadsController : ControllerBase
{
    private readonly AppDbContext _db;

    public LeadsController(AppDbContext db) => _db = db;

    private Guid? UsuarioId => Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
    private bool EhVendedor => User.IsInRole("Vendedor");

    private IQueryable<Lead> Base()
    {
        var q = _db.Leads.Where(l => l.Ativo);
        // Vendedor enxerga apenas os leads atribuídos a ele ou ainda sem responsável.
        if (EhVendedor && UsuarioId is Guid uid) q = q.Where(l => l.ResponsavelId == null || l.ResponsavelId == uid);
        return q;
    }

    [HttpGet("kanban")]
    public async Task<IActionResult> Kanban([FromQuery] Guid? responsavelId, [FromQuery] TipoVeiculo? tipo, [FromQuery] string? busca)
    {
        var q = Base();
        if (responsavelId.HasValue) q = q.Where(l => l.ResponsavelId == responsavelId);
        if (tipo.HasValue) q = q.Where(l => l.InteresseTipo == tipo);
        if (!string.IsNullOrWhiteSpace(busca))
        {
            var b = $"%{busca.Trim()}%";
            q = q.Where(l => EF.Functions.ILike(l.Nome, b) || EF.Functions.ILike(l.Telefone ?? "", b) || EF.Functions.ILike(l.Email ?? "", b));
        }

        var leads = await q.OrderBy(l => l.Ordem).ThenByDescending(l => l.DataCriacao).Select(l => ToCard(l)).ToListAsync();

        var colunas = Enum.GetValues<EstagioLead>().Select(e =>
        {
            var itens = leads.Where(l => l.Estagio == e).ToList();
            return new KanbanColunaDto(e, TituloEstagio(e), itens.Count, itens.Sum(i => i.ValorEstimado ?? 0), itens);
        });
        return Ok(colunas);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Obter(Guid id)
    {
        var lead = await Base().Include(l => l.Interacoes.OrderByDescending(i => i.DataCriacao)).FirstOrDefaultAsync(l => l.Id == id);
        if (lead == null) return NotFound();
        return Ok(new
        {
            Lead = ToCard(lead),
            lead.Mensagem,
            lead.MotivoPerda,
            lead.UtmSource,
            lead.UtmMedium,
            lead.UtmCampaign,
            lead.VeiculoInteresseId,
            Interacoes = lead.Interacoes.Select(i => new { i.Id, i.Tipo, i.Descricao, i.UsuarioId, i.DataCriacao })
        });
    }

    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] LeadSalvarDto dto)
    {
        var lead = new Lead();
        Aplicar(lead, dto);
        lead.ResponsavelId ??= EhVendedor ? UsuarioId : null;
        lead.Ordem = await ProximaOrdem(lead.Estagio);
        lead.CriadoPor = UsuarioId?.ToString();
        _db.Leads.Add(lead);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Obter), new { id = lead.Id }, ToCard(lead));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Atualizar(Guid id, [FromBody] LeadSalvarDto dto)
    {
        var lead = await Base().FirstOrDefaultAsync(l => l.Id == id);
        if (lead == null) return NotFound();
        var estagioAnterior = lead.Estagio;
        Aplicar(lead, dto);
        if (estagioAnterior != lead.Estagio) RegistrarMudanca(lead, estagioAnterior);
        lead.DataAtualizacao = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(ToCard(lead));
    }

    /// <summary>Drag &amp; drop no Kanban: muda estágio e/ou posição.</summary>
    [HttpPatch("{id:guid}/mover")]
    public async Task<IActionResult> Mover(Guid id, [FromBody] LeadMoverDto dto)
    {
        var lead = await Base().FirstOrDefaultAsync(l => l.Id == id);
        if (lead == null) return NotFound();
        if (dto.Estagio == EstagioLead.Perdido && string.IsNullOrWhiteSpace(dto.MotivoPerda) && string.IsNullOrWhiteSpace(lead.MotivoPerda))
            return BadRequest(new { Erro = "Informe o motivo da perda." });

        var anterior = lead.Estagio;
        // Reordena a coluna de destino abrindo espaço na posição desejada.
        var destino = await _db.Leads.Where(l => l.Ativo && l.Estagio == dto.Estagio && l.Id != id).OrderBy(l => l.Ordem).ToListAsync();
        var pos = Math.Clamp(dto.Ordem, 0, destino.Count);
        destino.Insert(pos, lead);
        for (var i = 0; i < destino.Count; i++) destino[i].Ordem = i;

        lead.Estagio = dto.Estagio;
        if (!string.IsNullOrWhiteSpace(dto.MotivoPerda)) lead.MotivoPerda = dto.MotivoPerda;
        lead.DataFechamento = dto.Estagio is EstagioLead.Ganho or EstagioLead.Perdido ? DateTime.UtcNow : null;
        lead.DataAtualizacao = DateTime.UtcNow;
        if (anterior != dto.Estagio) RegistrarMudanca(lead, anterior);

        await _db.SaveChangesAsync();
        return Ok(ToCard(lead));
    }

    [HttpPost("{id:guid}/interacoes")]
    public async Task<IActionResult> Interagir(Guid id, [FromBody] LeadInteracaoDto dto)
    {
        var lead = await Base().FirstOrDefaultAsync(l => l.Id == id);
        if (lead == null) return NotFound();
        var it = new LeadInteracao { LeadId = id, EmpresaId = lead.EmpresaId, Tipo = dto.Tipo, Descricao = dto.Descricao, UsuarioId = UsuarioId };
        _db.LeadInteracoes.Add(it);
        if (lead.Estagio == EstagioLead.Novo) lead.Estagio = EstagioLead.EmContato;
        await _db.SaveChangesAsync();
        return Ok(new { it.Id, it.Tipo, it.Descricao, it.DataCriacao });
    }

    /// <summary>Veículos do estoque compatíveis com o interesse do lead.</summary>
    [HttpGet("{id:guid}/veiculos-compativeis")]
    public async Task<IActionResult> Compativeis(Guid id)
    {
        var l = await Base().AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (l == null) return NotFound();
        var q = _db.Veiculos.Where(v => v.Ativo && v.DataVenda == null);
        if (l.InteresseTipo.HasValue) q = q.Where(v => v.Tipo == l.InteresseTipo);
        if (!string.IsNullOrWhiteSpace(l.InteresseMarca)) q = q.Where(v => EF.Functions.ILike(v.Marca, l.InteresseMarca));
        if (!string.IsNullOrWhiteSpace(l.InteresseModelo)) q = q.Where(v => EF.Functions.ILike(v.Modelo, $"%{l.InteresseModelo}%"));
        if (l.InteressePrecoMin.HasValue) q = q.Where(v => v.ValorVenda >= l.InteressePrecoMin);
        if (l.InteressePrecoMax.HasValue) q = q.Where(v => v.ValorVenda <= l.InteressePrecoMax);
        if (l.InteresseAnoMin.HasValue) q = q.Where(v => v.AnoModelo >= l.InteresseAnoMin);
        if (l.InteresseAnoMax.HasValue) q = q.Where(v => v.AnoModelo <= l.InteresseAnoMax);
        var lista = await q.OrderBy(v => v.ValorVenda).Take(20)
            .Select(v => new { v.Id, v.Tipo, v.Marca, v.Modelo, v.Versao, v.AnoModelo, v.Quilometragem, v.ValorVenda, v.Cilindrada, v.Placa })
            .ToListAsync();
        return Ok(lista);
    }

    /// <summary>Converte o lead em Cliente (cadastro) mantendo o vínculo.</summary>
    [HttpPost("{id:guid}/converter-cliente")]
    public async Task<IActionResult> ConverterCliente(Guid id)
    {
        var lead = await Base().FirstOrDefaultAsync(l => l.Id == id);
        if (lead == null) return NotFound();
        if (lead.ClienteId.HasValue) return Ok(new { lead.ClienteId });
        var cliente = new Cliente { EmpresaId = lead.EmpresaId, Nome = lead.Nome, Email = lead.Email, Telefone = lead.Telefone };
        _db.Clientes.Add(cliente);
        lead.ClienteId = cliente.Id;
        await _db.SaveChangesAsync();
        return Ok(new { ClienteId = cliente.Id });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Excluir(Guid id)
    {
        var lead = await Base().FirstOrDefaultAsync(l => l.Id == id);
        if (lead == null) return NotFound();
        lead.Ativo = false;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ------------------------------------------------------------------

    private void Aplicar(Lead lead, LeadSalvarDto dto)
    {
        lead.Nome = dto.Nome.Trim();
        lead.Email = dto.Email;
        lead.Telefone = dto.Telefone;
        lead.Mensagem = dto.Mensagem;
        lead.Estagio = dto.Estagio;
        lead.TipoOportunidade = dto.TipoOportunidade;
        lead.Origem = dto.Origem;
        lead.Canal = dto.Canal;
        lead.ValorEstimado = dto.ValorEstimado;
        lead.DataProximoContato = dto.DataProximoContato;
        lead.ResponsavelId = dto.ResponsavelId;
        lead.ClienteId = dto.ClienteId;
        AplicarInteresse(lead, dto.Interesse);
    }

    internal static void AplicarInteresse(Lead lead, LeadInteresseDto? i)
    {
        if (i == null) return;
        lead.InteresseTipo = i.Tipo;
        lead.InteresseMarca = i.Marca;
        lead.InteresseModelo = i.Modelo;
        lead.InteressePrecoMin = i.PrecoMin;
        lead.InteressePrecoMax = i.PrecoMax;
        lead.InteresseAnoMin = i.AnoMin;
        lead.InteresseAnoMax = i.AnoMax;
        lead.VeiculoInteresseId = i.VeiculoId;
    }

    private void RegistrarMudanca(Lead lead, EstagioLead anterior) => _db.LeadInteracoes.Add(new LeadInteracao
    {
        LeadId = lead.Id,
        EmpresaId = lead.EmpresaId,
        Tipo = "MudancaEstagio",
        Descricao = $"{TituloEstagio(anterior)} → {TituloEstagio(lead.Estagio)}",
        UsuarioId = UsuarioId
    });

    private async Task<int> ProximaOrdem(EstagioLead e)
        => (await _db.Leads.Where(l => l.Estagio == e).MaxAsync(l => (int?)l.Ordem) ?? -1) + 1;

    internal static string TituloEstagio(EstagioLead e) => e switch
    {
        EstagioLead.Novo => "Novos",
        EstagioLead.EmContato => "Em contato",
        EstagioLead.Qualificado => "Qualificados",
        EstagioLead.Proposta => "Proposta",
        EstagioLead.Negociacao => "Negociação",
        EstagioLead.Ganho => "Ganhos",
        EstagioLead.Perdido => "Perdidos",
        _ => e.ToString()
    };

    private static LeadCardDto ToCard(Lead l) => new(
        l.Id, l.Nome, l.Telefone, l.Email, l.Estagio, l.Ordem, l.TipoOportunidade, l.Origem, l.Canal, l.ValorEstimado,
        l.InteresseTipo, l.InteresseMarca, l.InteresseModelo, l.InteressePrecoMin, l.InteressePrecoMax,
        l.InteresseAnoMin, l.InteresseAnoMax, l.ResponsavelId, l.ClienteId, l.DataProximoContato, l.DataCriacao);
}
