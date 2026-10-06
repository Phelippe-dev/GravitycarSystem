using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotorsXySystem.Application.DTOs;
using MotorsXySystem.Application.Interfaces;
using MotorsXySystem.Domain.Entidades.Auditoria;
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

    private bool PodeVerCusto()
    {
        if (User == null || User.Identity?.IsAuthenticated != true) return false;
        if (User.IsInRole("Vendedor")) return false;
        return User.IsInRole("Administrador") || 
               User.IsInRole("Gerente Comercial") || 
               User.IsInRole("Gerente") ||
               User.IsInRole("Operador Financeiro") || 
               User.IsInRole("Financeiro") ||
               User.IsInRole("SuperAdmin");
    }

    [HttpGet]
    public async Task<IActionResult> Listar(
        [FromQuery] int? tipo, 
        [FromQuery] int? status, 
        [FromQuery] string? busca,
        [FromQuery] int? pagina = null,
        [FromQuery] int? tamanhoPagina = null)
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

        int p = pagina.HasValue && pagina > 0 ? pagina.Value : 1;
        int tp = tamanhoPagina.HasValue && tamanhoPagina > 0 ? tamanhoPagina.Value : 50;

        bool podeVerCusto = PodeVerCusto();

        var veiculos = await query
            .OrderByDescending(v => v.DataCriacao)
            .Skip((p - 1) * tp)
            .Take(tp)
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
                ValorCompra = podeVerCusto ? v.ValorCompra : null,
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
        var tenantId = _tenant.ObterEmpresaId();
        var v = await _context.Veiculos.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id && x.Ativo && (tenantId == null || x.EmpresaId == tenantId));
        if (v == null) return NotFound(new { Erro = "Veículo não encontrado." });

        bool podeVerCusto = PodeVerCusto();

        var custos = await _context.VeiculoCustos.AsNoTracking()
            .Where(c => c.VeiculoId == id)
            .OrderByDescending(c => c.DataCusto)
            .Select(c => new VeiculoCustoDto
            {
                Id = c.Id,
                TipoCusto = c.TipoCusto,
                Descricao = c.Descricao,
                Valor = c.Valor,
                DataCusto = c.DataCusto,
                Responsavel = c.Responsavel
            })
            .ToListAsync();

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
            ValorCompra = podeVerCusto ? v.ValorCompra : null,
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
            Custos = custos,
            Historico = new List<VeiculoHistoricoDto>()
        };

        return Ok(detalhesDto);
    }

    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] VeiculoDto dto)
    {
        // 1. Validação de Chassi
        if (string.IsNullOrWhiteSpace(dto.Chassi) || dto.Chassi.Trim().Length != 17)
            return BadRequest(new { Erro = "O Chassi deve ter exatamente 17 caracteres alfanuméricos." });

        var chassiLimpo = dto.Chassi.ToUpper().Trim();
        if (Regex.IsMatch(chassiLimpo, "[IOQ]"))
            return BadRequest(new { Erro = "O Chassi não pode conter as letras I, O ou Q (norma ISO 3779)." });

        var chassiDuplicado = await _context.Veiculos.AnyAsync(v => v.Chassi == chassiLimpo && v.Ativo);
        if (chassiDuplicado)
            return BadRequest(new { Erro = "Já existe um veículo cadastrado com este Chassi na loja." });

        // 2. Validação de Placa
        string? placaLimpa = null;
        if (!string.IsNullOrWhiteSpace(dto.Placa))
        {
            placaLimpa = dto.Placa.ToUpper().Replace("-", "").Trim();
            if (placaLimpa.Length != 7)
                return BadRequest(new { Erro = "A Placa deve conter exatamente 7 caracteres (padrão Mercosul ou antigo)." });

            var placaDuplicada = await _context.Veiculos.AnyAsync(v => v.Placa == placaLimpa && v.Ativo);
            if (placaDuplicada)
                return BadRequest(new { Erro = "Já existe um veículo cadastrado com esta Placa na loja." });
        }

        // 3. Validação de Renavam
        string? renavamLimpo = null;
        if (!string.IsNullOrWhiteSpace(dto.Renavam))
        {
            renavamLimpo = dto.Renavam.Trim();
            if (renavamLimpo.Length < 9 || renavamLimpo.Length > 11 || !renavamLimpo.All(char.IsDigit))
                return BadRequest(new { Erro = "O Renavam deve conter entre 9 e 11 dígitos numéricos." });

            var renavamDuplicado = await _context.Veiculos.AnyAsync(v => v.Renavam == renavamLimpo && v.Ativo);
            if (renavamDuplicado)
                return BadRequest(new { Erro = "Já existe um veículo cadastrado com este Renavam na loja." });
        }

        var veiculo = new Veiculo
        {
            Marca = dto.Marca ?? string.Empty,
            Modelo = dto.Modelo ?? string.Empty,
            Versao = dto.Versao ?? string.Empty,
            AnoFabricacao = (short?)dto.AnoFabricacao,
            AnoModelo = (short?)dto.AnoModelo,
            Placa = placaLimpa,
            Cor = dto.Cor,
            Combustivel = dto.Combustivel,
            Cambio = dto.Cambio,
            Quilometragem = dto.Quilometragem,
            ValorCompra = dto.Consignado ? 0.00m : dto.ValorCompra,
            ValorVenda = dto.ValorVenda,
            Status = dto.Status > 0 ? dto.Status : 1,
            Observacoes = dto.Observacoes,
            Chassi = chassiLimpo,
            Renavam = renavamLimpo,
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
        var tenantId = _tenant.ObterEmpresaId();
        var veiculo = await _context.Veiculos.FirstOrDefaultAsync(v => v.Id == id && v.Ativo && (tenantId == null || v.EmpresaId == tenantId));
        if (veiculo == null) return NotFound(new { Erro = "Veículo não encontrado." });

        if (!string.IsNullOrWhiteSpace(dto.Chassi))
        {
            var chassiLimpo = dto.Chassi.ToUpper().Trim();
            if (chassiLimpo.Length != 17 || Regex.IsMatch(chassiLimpo, "[IOQ]"))
                return BadRequest(new { Erro = "Chassi inválido (deve ter 17 caracteres e não conter I, O ou Q)." });

            var duplicado = await _context.Veiculos.AnyAsync(v => v.Id != id && v.Chassi == chassiLimpo && v.Ativo);
            if (duplicado)
                return BadRequest(new { Erro = "Já existe outro veículo cadastrado com este Chassi." });

            veiculo.Chassi = chassiLimpo;
        }

        if (!string.IsNullOrWhiteSpace(dto.Placa))
        {
            var placaLimpa = dto.Placa.ToUpper().Replace("-", "").Trim();
            if (placaLimpa.Length != 7)
                return BadRequest(new { Erro = "Placa deve ter 7 caracteres." });

            var duplicado = await _context.Veiculos.AnyAsync(v => v.Id != id && v.Placa == placaLimpa && v.Ativo);
            if (duplicado)
                return BadRequest(new { Erro = "Já existe outro veículo cadastrado com esta Placa." });

            veiculo.Placa = placaLimpa;
        }

        veiculo.Marca = dto.Marca ?? string.Empty;
        veiculo.Modelo = dto.Modelo ?? string.Empty;
        veiculo.Versao = dto.Versao ?? string.Empty;
        veiculo.AnoFabricacao = (short?)dto.AnoFabricacao;
        veiculo.AnoModelo = (short?)dto.AnoModelo;
        veiculo.Cor = dto.Cor;
        veiculo.Combustivel = dto.Combustivel;
        veiculo.Cambio = dto.Cambio;
        veiculo.Quilometragem = dto.Quilometragem;
        veiculo.ValorCompra = dto.ValorCompra;
        veiculo.ValorVenda = dto.ValorVenda;
        veiculo.Status = dto.Status;
        veiculo.Observacoes = dto.Observacoes;
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
        var tenantId = _tenant.ObterEmpresaId();
        var veiculo = _context.Veiculos.FirstOrDefault(v => v.Id == id && v.Ativo && (tenantId == null || v.EmpresaId == tenantId));
        if (veiculo == null) return NotFound(new { Erro = "Veículo não encontrado." });

        var entidadeCusto = new VeiculoCusto
        {
            Id = Guid.NewGuid(),
            EmpresaId = veiculo.EmpresaId,
            VeiculoId = id,
            TipoCusto = string.IsNullOrWhiteSpace(custo.TipoCusto) ? "Geral" : custo.TipoCusto,
            Descricao = custo.Descricao ?? "Custo agregado",
            Valor = custo.Valor,
            DataCusto = custo.DataCusto != default ? custo.DataCusto : DateTime.UtcNow,
            Responsavel = User?.Identity?.Name ?? "Sistema"
        };

        _context.VeiculoCustos.Add(entidadeCusto);
        veiculo.DataAtualizacao = DateTime.UtcNow;

        _context.AuditoriaLogs.Add(new AuditoriaLog
        {
            EmpresaId = veiculo.EmpresaId,
            Acao = "AdicionarCusto",
            EntidadeNome = "Veiculo",
            EntidadeId = id,
            UsuarioNome = User?.Identity?.Name,
            ValorNovo = custo.Valor.ToString("F2"),
            Detalhes = $"Custo de R$ {custo.Valor:N2} ({entidadeCusto.Descricao}) adicionado ao veículo {veiculo.Modelo}"
        });

        _context.SaveChanges();
        custo.Id = entidadeCusto.Id;
        return Ok(custo);
    }

    [HttpPut("{id:guid}/custos/{custoId:guid}")]
    public async Task<IActionResult> AtualizarCusto(Guid id, Guid custoId, [FromBody] VeiculoCustoDto dto)
    {
        var custo = await _context.VeiculoCustos.FirstOrDefaultAsync(c => c.Id == custoId && c.VeiculoId == id);
        if (custo == null) return NotFound(new { Erro = "Custo não encontrado." });

        var valorAnterior = custo.Valor;
        custo.Descricao = dto.Descricao ?? custo.Descricao;
        custo.Valor = dto.Valor;
        custo.TipoCusto = dto.TipoCusto ?? custo.TipoCusto;

        _context.AuditoriaLogs.Add(new AuditoriaLog
        {
            EmpresaId = custo.EmpresaId,
            Acao = "AtualizarCusto",
            EntidadeNome = "VeiculoCusto",
            EntidadeId = custoId,
            UsuarioNome = User.Identity?.Name,
            ValorAnterior = valorAnterior.ToString("F2"),
            ValorNovo = dto.Valor.ToString("F2"),
            Detalhes = $"Custo alterado de R$ {valorAnterior:N2} para R$ {dto.Valor:N2}"
        });

        await _context.SaveChangesAsync();
        return Ok(dto);
    }

    [HttpDelete("{id:guid}/custos/{custoId:guid}")]
    public async Task<IActionResult> ExcluirCusto(Guid id, Guid custoId)
    {
        var custo = await _context.VeiculoCustos.FirstOrDefaultAsync(c => c.Id == custoId && c.VeiculoId == id);
        if (custo == null) return NotFound(new { Erro = "Custo não encontrado." });

        _context.VeiculoCustos.Remove(custo);
        _context.AuditoriaLogs.Add(new AuditoriaLog
        {
            EmpresaId = custo.EmpresaId,
            Acao = "ExcluirCusto",
            EntidadeNome = "VeiculoCusto",
            EntidadeId = custoId,
            UsuarioNome = User.Identity?.Name,
            ValorAnterior = custo.Valor.ToString("F2"),
            Detalhes = $"Custo de R$ {custo.Valor:N2} ({custo.Descricao}) excluído do veículo {id}"
        });

        await _context.SaveChangesAsync();
        return Ok(new { Mensagem = "Custo excluído com sucesso." });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Excluir(Guid id)
    {
        if (User?.Identity?.IsAuthenticated == true && User.IsInRole("Vendedor"))
        {
            return Forbid();
        }

        var tenantId = _tenant.ObterEmpresaId();
        var veiculo = await _context.Veiculos.FirstOrDefaultAsync(v => v.Id == id && (tenantId == null || v.EmpresaId == tenantId));
        if (veiculo == null) return NotFound(new { Erro = "Veículo não encontrado." });

        veiculo.Ativo = false;
        veiculo.DataAtualizacao = DateTime.UtcNow;

        _context.AuditoriaLogs.Add(new AuditoriaLog
        {
            EmpresaId = veiculo.EmpresaId,
            Acao = "ExcluirVeiculo",
            EntidadeNome = "Veiculo",
            EntidadeId = id,
            UsuarioNome = User?.Identity?.Name,
            Detalhes = $"Veículo {veiculo.Marca} {veiculo.Modelo} (Placa {veiculo.Placa}) inativado"
        });

        await _context.SaveChangesAsync();

        return Ok(new { Mensagem = "Veículo removido com sucesso!" });
    }
}

public class AtualizarObservacoesRequest
{
    public string? Observacoes { get; set; }
}
