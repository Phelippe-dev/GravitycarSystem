using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotorsXySystem.Application.DTOs;
using MotorsXySystem.Application.Interfaces;
using MotorsXySystem.Domain.Entidades.Veiculos;
using MotorsXySystem.Infrastructure.Data;

namespace MotorsXySystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VeiculosController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ICurrentTenantService _tenant;

    public VeiculosController(AppDbContext context, ICurrentTenantService tenant)
    {
        _context = context;
        _tenant = tenant;
    }

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var veiculos = await _context.Veiculos
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
                DataCadastro = v.DataCriacao
            })
            .ToListAsync();

        return Ok(veiculos);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObterPorId(Guid id)
    {
        var v = await _context.Veiculos.FindAsync(id);
        if (v == null) return NotFound(new { Erro = "Veículo não encontrado." });

        return Ok(new VeiculoDto
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
            DataCadastro = v.DataCriacao
        });
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
            Placa = dto.Placa,
            Cor = dto.Cor,
            Combustivel = dto.Combustivel,
            Cambio = dto.Cambio,
            Quilometragem = dto.Quilometragem,
            ValorCompra = dto.ValorCompra,
            ValorVenda = dto.ValorVenda,
            Status = dto.Status,
            Observacoes = dto.Observacoes,
            Chassi = dto.Chassi,
            Renavam = dto.Renavam,
            Tipo = (MotorsXySystem.Domain.Enums.TipoVeiculo)dto.TipoVeiculo,
            Consignado = dto.Consignado,
            DataCriacao = DateTime.UtcNow,
            Ativo = true
        };

        _context.Veiculos.Add(veiculo);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(ObterPorId), new { id = veiculo.Id }, new { Id = veiculo.Id, Mensagem = "Veículo cadastrado com sucesso!" });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Atualizar(Guid id, [FromBody] VeiculoDto dto)
    {
        var veiculo = await _context.Veiculos.FindAsync(id);
        if (veiculo == null) return NotFound(new { Erro = "Veículo não encontrado." });

        veiculo.Marca = dto.Marca ?? string.Empty;
        veiculo.Modelo = dto.Modelo ?? string.Empty;
        veiculo.Versao = dto.Versao ?? string.Empty;
        veiculo.AnoFabricacao = (short?)dto.AnoFabricacao;
        veiculo.AnoModelo = (short?)dto.AnoModelo;
        veiculo.Placa = dto.Placa;
        veiculo.Cor = dto.Cor;
        veiculo.Combustivel = dto.Combustivel;
        veiculo.Cambio = dto.Cambio;
        veiculo.Quilometragem = dto.Quilometragem;
        veiculo.ValorCompra = dto.ValorCompra;
        veiculo.ValorVenda = dto.ValorVenda;
        veiculo.Status = dto.Status;
        veiculo.Observacoes = dto.Observacoes;
        veiculo.Chassi = dto.Chassi;
        veiculo.Renavam = dto.Renavam;
        veiculo.Tipo = (MotorsXySystem.Domain.Enums.TipoVeiculo)dto.TipoVeiculo;
        veiculo.Consignado = dto.Consignado;
        veiculo.DataAtualizacao = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { Mensagem = "Veículo atualizado com sucesso!" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Excluir(Guid id)
    {
        var veiculo = await _context.Veiculos.FindAsync(id);
        if (veiculo == null) return NotFound(new { Erro = "Veículo não encontrado." });

        veiculo.Ativo = false;
        await _context.SaveChangesAsync();

        return Ok(new { Mensagem = "Veículo removido com sucesso!" });
    }
}
