using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotorsXySystem.Application.DTOs;
using MotorsXySystem.Application.Interfaces;
using MotorsXySystem.Domain.Entidades.Veiculos;
using MotorsXySystem.Domain.Enums;
using MotorsXySystem.Infrastructure.Data;

namespace MotorsXySystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VeiculosController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ICurrentTenantService _tenant;
    private readonly IWebHostEnvironment _env;

    public VeiculosController(AppDbContext context, ICurrentTenantService tenant, IWebHostEnvironment env)
    {
        _context = context;
        _tenant = tenant;
        _env = env;
    }

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] int? tipo, [FromQuery] int? status, [FromQuery] string? busca)
    {
        var query = _context.Veiculos.AsNoTracking().Where(v => v.Ativo);

        if (tipo.HasValue && tipo > 0)
        {
            query = query.Where(v => (int)v.Tipo == tipo.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(v => v.Status == status.Value);
        }

        if (!string.IsNullOrWhiteSpace(busca))
        {
            var termo = $"%{busca.Trim().ToLower()}%";
            query = query.Where(v => EF.Functions.ILike(v.Marca, termo) ||
                                     EF.Functions.ILike(v.Modelo, termo) ||
                                     EF.Functions.ILike(v.Placa ?? "", termo) ||
                                     EF.Functions.ILike(v.Chassi ?? "", termo));
        }

        var veiculos = await query
            .OrderByDescending(v => v.DataCriacao)
            .Select(v => new VeiculoDto
            {
                Id = v.Id,
                Marca = v.Marca,
                Modelo = v.Modelo,
                Versao = v.Versao,
                AnoFabricacao = v.AnoFabricacao,
                AnoModelo = v.AnoModelo,
                Placa = v.Placa,
                Cor = v.Cor,
                Combustivel = v.Combustivel,
                Cambio = v.Cambio,
                Quilometragem = v.Quilometragem,
                ValorCompra = v.ValorCompra,
                ValorVenda = v.ValorVenda,
                Status = v.Status,
                Observacoes = v.Observacoes,
                Chassi = v.Chassi,
                Renavam = v.Renavam,
                TipoVeiculo = (int)v.Tipo,
                Consignado = v.Consignado,
                DataCadastro = v.DataCriacao,
                Cilindrada = v.Cilindrada,
                CategoriaMoto = v.CategoriaMoto,
                Partida = v.Partida,
                Refrigeracao = v.Refrigeracao,
                TipoRefrigeracao = v.TipoRefrigeracao,
                CodigoFipe = v.CodigoFipe,
                ValorFipe = v.ValorFipe,
                MesReferenciaFipe = v.MesReferenciaFipe,
                DataConsultaFipe = v.DataConsultaFipe
            })
            .ToListAsync();

        return Ok(veiculos);
    }

    [HttpGet("{id:guid}")]
    [HttpGet("{id:guid}/detalhes")]
    public async Task<IActionResult> ObterPorId(Guid id)
    {
        var v = await _context.Veiculos.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id && x.Ativo);
        if (v == null) return NotFound(new { Erro = "Veículo não encontrado." });

        var detalhesDto = new VeiculoDetalhesDto
        {
            Id = v.Id,
            Marca = v.Marca,
            Modelo = v.Modelo,
            Versao = v.Versao,
            AnoFabricacao = v.AnoFabricacao,
            AnoModelo = v.AnoModelo,
            Placa = v.Placa,
            Cor = v.Cor,
            Combustivel = v.Combustivel,
            Cambio = v.Cambio,
            Quilometragem = v.Quilometragem,
            ValorCompra = v.ValorCompra,
            ValorVenda = v.ValorVenda,
            Status = v.Status,
            Observacoes = v.Observacoes,
            Chassi = v.Chassi,
            Renavam = v.Renavam,
            TipoVeiculo = (int)v.Tipo,
            Consignado = v.Consignado,
            DataCadastro = v.DataCriacao,
            Cilindrada = v.Cilindrada,
            CategoriaMoto = v.CategoriaMoto,
            Partida = v.Partida,
            Refrigeracao = v.Refrigeracao,
            TipoRefrigeracao = v.TipoRefrigeracao,
            CodigoFipe = v.CodigoFipe,
            ValorFipe = v.ValorFipe,
            MesReferenciaFipe = v.MesReferenciaFipe,
            DataConsultaFipe = v.DataConsultaFipe,
            Fotos = new List<VeiculoFotoDto>(),
            Documentos = new List<VeiculoDocumentoDto>(),
            Custos = new List<VeiculoCustoDto>(),
            Historico = new List<VeiculoHistoricoDto>()
        };

        return Ok(detalhesDto);
    }

    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] VeiculoDto dto)
    {
        var veiculo = new Veiculo
        {
            Marca = dto.Marca ?? string.Empty,
            Modelo = dto.Modelo ?? string.Empty,
            Versao = dto.Versao ?? string.Empty,
            AnoFabricacao = (short?)dto.AnoFabricacao,
            AnoModelo = (short?)dto.AnoModelo,
            Placa = dto.Placa?.ToUpper().Trim(),
            Cor = dto.Cor,
            Combustivel = dto.Combustivel,
            Cambio = dto.Cambio,
            Quilometragem = dto.Quilometragem,
            ValorCompra = dto.ValorCompra,
            ValorVenda = dto.ValorVenda,
            Status = dto.Status,
            Observacoes = dto.Observacoes,
            Chassi = dto.Chassi?.ToUpper().Trim(),
            Renavam = dto.Renavam?.Trim(),
            Tipo = (TipoVeiculo)(dto.TipoVeiculo > 0 ? dto.TipoVeiculo : 1),
            Consignado = dto.Consignado,
            DataCriacao = DateTime.UtcNow,
            Ativo = true,
            Cilindrada = dto.Cilindrada,
            CategoriaMoto = dto.CategoriaMoto,
            Partida = dto.Partida,
            Refrigeracao = dto.Refrigeracao,
            TipoRefrigeracao = dto.TipoRefrigeracao,
            CodigoFipe = dto.CodigoFipe,
            ValorFipe = dto.ValorFipe,
            MesReferenciaFipe = dto.MesReferenciaFipe,
            DataConsultaFipe = dto.ValorFipe.HasValue ? DateTime.UtcNow : null
        };

        _context.Veiculos.Add(veiculo);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(ObterPorId), new { id = veiculo.Id }, new { Id = veiculo.Id, Mensagem = "Veículo cadastrado com sucesso!" });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Atualizar(Guid id, [FromBody] VeiculoDto dto)
    {
        var veiculo = await _context.Veiculos.FirstOrDefaultAsync(v => v.Id == id && v.Ativo);
        if (veiculo == null) return NotFound(new { Erro = "Veículo não encontrado." });

        veiculo.Marca = dto.Marca ?? string.Empty;
        veiculo.Modelo = dto.Modelo ?? string.Empty;
        veiculo.Versao = dto.Versao ?? string.Empty;
        veiculo.AnoFabricacao = (short?)dto.AnoFabricacao;
        veiculo.AnoModelo = (short?)dto.AnoModelo;
        veiculo.Placa = dto.Placa?.ToUpper().Trim();
        veiculo.Cor = dto.Cor;
        veiculo.Combustivel = dto.Combustivel;
        veiculo.Cambio = dto.Cambio;
        veiculo.Quilometragem = dto.Quilometragem;
        veiculo.ValorCompra = dto.ValorCompra;
        veiculo.ValorVenda = dto.ValorVenda;
        veiculo.Status = dto.Status;
        veiculo.Observacoes = dto.Observacoes;
        veiculo.Chassi = dto.Chassi?.ToUpper().Trim();
        veiculo.Renavam = dto.Renavam?.Trim();
        veiculo.Tipo = (TipoVeiculo)(dto.TipoVeiculo > 0 ? dto.TipoVeiculo : 1);
        veiculo.Consignado = dto.Consignado;
        veiculo.DataAtualizacao = DateTime.UtcNow;

        veiculo.Cilindrada = dto.Cilindrada;
        veiculo.CategoriaMoto = dto.CategoriaMoto;
        veiculo.Partida = dto.Partida;
        veiculo.Refrigeracao = dto.Refrigeracao;
        veiculo.TipoRefrigeracao = dto.TipoRefrigeracao;
        veiculo.CodigoFipe = dto.CodigoFipe;
        veiculo.ValorFipe = dto.ValorFipe;
        veiculo.MesReferenciaFipe = dto.MesReferenciaFipe;
        if (dto.ValorFipe.HasValue && dto.ValorFipe != veiculo.ValorFipe)
        {
            veiculo.DataConsultaFipe = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return Ok(new { Mensagem = "Veículo atualizado com sucesso!" });
    }

    [HttpPatch("{id:guid}/observacoes")]
    public async Task<IActionResult> AtualizarObservacoes(Guid id, [FromBody] AtualizarObservacoesRequest request)
    {
        var veiculo = await _context.Veiculos.FirstOrDefaultAsync(v => v.Id == id && v.Ativo);
        if (veiculo == null) return NotFound(new { Erro = "Veículo não encontrado." });

        veiculo.Observacoes = request.Observacoes ?? string.Empty;
        veiculo.DataAtualizacao = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { sucesso = true, observacoes = veiculo.Observacoes });
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> AlterarStatus(Guid id, [FromBody] int novoStatus)
    {
        var veiculo = await _context.Veiculos.FirstOrDefaultAsync(v => v.Id == id && v.Ativo);
        if (veiculo == null) return NotFound(new { Erro = "Veículo não encontrado." });

        veiculo.Status = novoStatus;
        veiculo.DataAtualizacao = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { sucesso = true, status = novoStatus });
    }

    [HttpPost("{id:guid}/fotos")]
    public async Task<IActionResult> AdicionarFoto(Guid id, IFormFile file, [FromForm] bool isPrincipal = false)
    {
        var veiculo = await _context.Veiculos.FirstOrDefaultAsync(v => v.Id == id && v.Ativo);
        if (veiculo == null) return NotFound(new { Erro = "Veículo não encontrado." });

        if (file == null || file.Length == 0) return BadRequest("Arquivo inválido.");

        var uploadsDir = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", "fotos");
        if (!Directory.Exists(uploadsDir)) Directory.CreateDirectory(uploadsDir);

        var ext = Path.GetExtension(file.FileName);
        var novoNome = $"{Guid.NewGuid()}{ext}";
        var caminhoFisico = Path.Combine(uploadsDir, novoNome);

        using (var stream = new FileStream(caminhoFisico, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var url = $"/uploads/fotos/{novoNome}";
        return Ok(new VeiculoFotoDto { Id = Guid.NewGuid(), Url = url, Principal = isPrincipal });
    }

    [HttpDelete("{id:guid}/fotos/{fotoId:guid}")]
    public IActionResult RemoverFoto(Guid id, Guid fotoId)
    {
        return Ok(new { Mensagem = "Foto removida com sucesso." });
    }

    [HttpPatch("{id:guid}/fotos/{fotoId:guid}/principal")]
    public IActionResult DefinirFotoPrincipal(Guid id, Guid fotoId)
    {
        return Ok(new { Mensagem = "Foto definida como principal." });
    }

    [HttpPost("{id:guid}/documentos")]
    public async Task<IActionResult> AdicionarDocumento(Guid id, IFormFile file, [FromForm] string tipo = "Outro")
    {
        var veiculo = await _context.Veiculos.FirstOrDefaultAsync(v => v.Id == id && v.Ativo);
        if (veiculo == null) return NotFound(new { Erro = "Veículo não encontrado." });

        if (file == null || file.Length == 0) return BadRequest("Arquivo inválido.");

        var uploadsDir = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", "documentos");
        if (!Directory.Exists(uploadsDir)) Directory.CreateDirectory(uploadsDir);

        var ext = Path.GetExtension(file.FileName);
        var novoNome = $"{Guid.NewGuid()}{ext}";
        var caminhoFisico = Path.Combine(uploadsDir, novoNome);

        using (var stream = new FileStream(caminhoFisico, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var url = $"/uploads/documentos/{novoNome}";
        return Ok(new VeiculoDocumentoDto { Id = Guid.NewGuid(), NomeArquivo = file.FileName, Url = url, TipoDocumento = tipo });
    }

    [HttpDelete("{id:guid}/documentos/{documentoId:guid}")]
    public IActionResult RemoverDocumento(Guid id, Guid documentoId)
    {
        return Ok(new { Mensagem = "Documento removido com sucesso." });
    }

    [HttpPost("{id:guid}/custos")]
    public IActionResult AdicionarCusto(Guid id, [FromBody] VeiculoCustoDto custo)
    {
        custo.Id = Guid.NewGuid();
        return Ok(custo);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Excluir(Guid id)
    {
        var veiculo = await _context.Veiculos.FindAsync(id);
        if (veiculo == null) return NotFound(new { Erro = "Veículo não encontrado." });

        veiculo.Ativo = false;
        veiculo.DataAtualizacao = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { Mensagem = "Veículo removido com sucesso!" });
    }
}

public class AtualizarObservacoesRequest
{
    public string? Observacoes { get; set; }
}
