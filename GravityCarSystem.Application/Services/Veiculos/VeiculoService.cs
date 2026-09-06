using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GravityCarSystem.Application.DTOs.Veiculos;
using GravityCarSystem.Application.Interfaces;
using GravityCarSystem.Domain.Entities.Veiculos;
using GravityCarSystem.Domain.Entities.Financeiro;
using GravityCarSystem.Domain.Entities.Cadastros;
using GravityCarSystem.Domain.Enums;

namespace GravityCarSystem.Application.Services.Veiculos;

public class VeiculoService : IVeiculoService
{
    private readonly IAppDbContext _context;

    public VeiculoService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<VeiculoDto> AdicionarAsync(VeiculoDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Marca)) throw new ArgumentException("A marca é obrigatória.");
        if (string.IsNullOrWhiteSpace(dto.Modelo)) throw new ArgumentException("O modelo é obrigatório.");
        
        // Verifica Placa se existir
        if (!string.IsNullOrWhiteSpace(dto.Placa))
        {
            var existePlaca = await _context.Veiculos.AnyAsync(v => v.Placa == dto.Placa);
            if (existePlaca) throw new InvalidOperationException("Já existe um veículo com esta placa.");
        }
        
        // Verifica Chassi se existir
        if (!string.IsNullOrWhiteSpace(dto.Chassi))
        {
            var existeChassi = await _context.Veiculos.AnyAsync(v => v.Chassi == dto.Chassi);
            if (existeChassi) throw new InvalidOperationException("Já existe um veículo com este chassi.");
        }

        var veiculo = new Veiculo
        {
            Placa = dto.Placa,
            Renavam = dto.Renavam,
            Chassi = dto.Chassi,
            Marca = dto.Marca,
            Modelo = dto.Modelo,
            Versao = dto.Versao,
            AnoFabricacao = dto.AnoFabricacao,
            AnoModelo = dto.AnoModelo,
            Cor = dto.Cor,
            Combustivel = dto.Combustivel,
            Cambio = dto.Cambio,
            Quilometragem = dto.Quilometragem,
            ValorCompra = dto.ValorCompra,
            ValorVenda = dto.ValorVenda,
            DataEntrada = dto.DataEntrada ?? DateTime.Now,
            DataVenda = dto.DataVenda,
            Status = StatusVeiculo.Disponivel,
            Observacoes = dto.Observacoes
        };

        _context.Veiculos.Add(veiculo);
        await _context.SaveChangesAsync();

        dto.Id = veiculo.Id;
        dto.Status = veiculo.Status;
        return dto;
    }

    public async Task<VeiculoDto> AtualizarAsync(Guid id, VeiculoDto dto)
    {
        var veiculo = await _context.Veiculos.FindAsync(id);
        if (veiculo == null) throw new KeyNotFoundException("Veículo não encontrado.");

        if (veiculo.Placa != dto.Placa && !string.IsNullOrWhiteSpace(dto.Placa))
        {
            var existePlaca = await _context.Veiculos.AnyAsync(v => v.Placa == dto.Placa && v.Id != id);
            if (existePlaca) throw new InvalidOperationException("Já existe um veículo com esta placa.");
        }

        if (veiculo.Chassi != dto.Chassi && !string.IsNullOrWhiteSpace(dto.Chassi))
        {
            var existeChassi = await _context.Veiculos.AnyAsync(v => v.Chassi == dto.Chassi && v.Id != id);
            if (existeChassi) throw new InvalidOperationException("Já existe um veículo com este chassi.");
        }

        veiculo.Placa = dto.Placa;
        veiculo.Renavam = dto.Renavam;
        veiculo.Chassi = dto.Chassi;
        veiculo.Marca = dto.Marca;
        veiculo.Modelo = dto.Modelo;
        veiculo.Versao = dto.Versao;
        veiculo.AnoFabricacao = dto.AnoFabricacao;
        veiculo.AnoModelo = dto.AnoModelo;
        veiculo.Cor = dto.Cor;
        veiculo.Combustivel = dto.Combustivel;
        veiculo.Cambio = dto.Cambio;
        veiculo.Quilometragem = dto.Quilometragem;
        veiculo.ValorCompra = dto.ValorCompra;
        veiculo.ValorVenda = dto.ValorVenda;
        veiculo.Observacoes = dto.Observacoes;

        await _context.SaveChangesAsync();
        return dto;
    }

    public async Task AlterarStatusAsync(Guid id, StatusVeiculo novoStatus)
    {
        var veiculo = await _context.Veiculos.Include(v => v.Historicos).FirstOrDefaultAsync(v => v.Id == id);
        if (veiculo == null) throw new KeyNotFoundException("Veículo não encontrado.");

        var statusAnterior = veiculo.Status;
        veiculo.Status = novoStatus;
        
        veiculo.Historicos.Add(new VeiculoHistorico
        {
            TipoEvento = "AlteracaoStatus",
            ValorAnterior = statusAnterior.ToString(),
            ValorNovo = novoStatus.ToString(),
            DataEvento = DateTime.Now,
            Descricao = "Status alterado via sistema"
        });

        await _context.SaveChangesAsync();
    }

    public async Task RemoverAsync(Guid id)
    {
        var veiculo = await _context.Veiculos.FindAsync(id);
        if (veiculo == null) throw new KeyNotFoundException("Veículo não encontrado.");

        _context.Veiculos.Remove(veiculo);
        await _context.SaveChangesAsync();
    }

    public async Task<VeiculoDto?> ObterPorIdAsync(Guid id)
    {
        var v = await _context.Veiculos.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (v == null) return null;

        return MapearParaDto(v);
    }

    public async Task<IEnumerable<VeiculoDto>> ObterTodosAsync()
    {
        return await _context.Veiculos
            .AsNoTracking()
            .Include(v => v.Fotos)
            .Select(v => MapearParaDto(v))
            .ToListAsync();
    }

    public async Task<IEnumerable<VeiculoDto>> ObterPorStatusAsync(StatusVeiculo status)
    {
        return await _context.Veiculos
            .AsNoTracking()
            .Include(v => v.Fotos)
            .Where(v => v.Status == status)
            .Select(v => MapearParaDto(v))
            .ToListAsync();
    }

    private static VeiculoDto MapearParaDto(Veiculo v)
    {
        return new VeiculoDto
        {
            Id = v.Id,
            Placa = v.Placa,
            Renavam = v.Renavam,
            Chassi = v.Chassi,
            Marca = v.Marca,
            Modelo = v.Modelo,
            Versao = v.Versao,
            AnoFabricacao = v.AnoFabricacao,
            AnoModelo = v.AnoModelo,
            Cor = v.Cor,
            Combustivel = v.Combustivel,
            Cambio = v.Cambio,
            Quilometragem = v.Quilometragem,
            ValorCompra = v.ValorCompra,
            ValorVenda = v.ValorVenda,
            DataEntrada = v.DataEntrada,
            DataVenda = v.DataVenda,
            Status = v.Status,
            Observacoes = v.Observacoes,
            FotoPrincipal = v.Fotos != null ? (v.Fotos.FirstOrDefault(f => f.Principal)?.Url ?? v.Fotos.FirstOrDefault()?.Url) : null
        };
    }

    public async Task<VeiculoDetalhesDto?> ObterDetalhesAsync(Guid id)
    {
        var v = await _context.Veiculos
            .Include(x => x.Fotos)
            .Include(x => x.Documentos)
            .Include(x => x.Custos)
            .Include(x => x.Historicos)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (v == null) return null;

        var dto = new VeiculoDetalhesDto
        {
            Id = v.Id,
            Placa = v.Placa,
            Renavam = v.Renavam,
            Chassi = v.Chassi,
            Marca = v.Marca,
            Modelo = v.Modelo,
            Versao = v.Versao,
            AnoFabricacao = v.AnoFabricacao,
            AnoModelo = v.AnoModelo,
            Cor = v.Cor,
            Combustivel = v.Combustivel,
            Cambio = v.Cambio,
            Quilometragem = v.Quilometragem,
            ValorCompra = v.ValorCompra,
            ValorVenda = v.ValorVenda,
            DataEntrada = v.DataEntrada,
            DataVenda = v.DataVenda,
            Status = v.Status,
            Observacoes = v.Observacoes,
            Fotos = v.Fotos.Select(f => new VeiculoFotoDto { Id = f.Id, Url = f.Url, IsPrincipal = f.Principal }).ToList(),
            Documentos = v.Documentos.Select(d => new VeiculoDocumentoDto { Id = d.Id, NomeArquivo = d.NomeArquivo, Url = d.Url, TipoDocumento = d.TipoDocumento.ToString() }).ToList(),
            Custos = v.Custos.Select(c => new VeiculoCustoDto { Id = c.Id, Descricao = c.Descricao, Valor = c.Valor, DataCusto = c.DataCusto }).OrderByDescending(c => c.DataCusto).ToList(),
            Historico = v.Historicos.Select(h => new VeiculoHistoricoDto { Id = h.Id, TipoEvento = h.TipoEvento, ValorAnterior = h.ValorAnterior, ValorNovo = h.ValorNovo, Descricao = h.Descricao, DataEvento = h.DataEvento }).OrderByDescending(h => h.DataEvento).ToList()
        };

        return dto;
    }

    public async Task<VeiculoFotoDto> AdicionarFotoAsync(Guid veiculoId, string url, bool isPrincipal)
    {
        var veiculo = await _context.Veiculos.Include(v => v.Fotos).FirstOrDefaultAsync(v => v.Id == veiculoId);
        if (veiculo == null) throw new KeyNotFoundException("Veículo não encontrado");

        if (isPrincipal)
        {
            foreach (var f in veiculo.Fotos) f.Principal = false;
        }
        else if (!veiculo.Fotos.Any())
        {
            isPrincipal = true; // Se for a primeira foto, ela é a principal
        }

        var foto = new VeiculoFoto
        {
            VeiculoId = veiculoId,
            Url = url,
            Principal = isPrincipal
        };
        _context.VeiculoFotos.Add(foto);
        await _context.SaveChangesAsync();

        return new VeiculoFotoDto { Id = foto.Id, Url = foto.Url, IsPrincipal = foto.Principal };
    }

    public async Task RemoverFotoAsync(Guid veiculoId, Guid fotoId)
    {
        var foto = await _context.VeiculoFotos.FirstOrDefaultAsync(f => f.Id == fotoId && f.VeiculoId == veiculoId);
        if (foto != null)
        {
            var eraPrincipal = foto.Principal;
            _context.VeiculoFotos.Remove(foto);
            await _context.SaveChangesAsync();

            // Se a foto removida era a principal, define a primeira foto restante como principal
            if (eraPrincipal)
            {
                var outraFoto = await _context.VeiculoFotos.FirstOrDefaultAsync(f => f.VeiculoId == veiculoId);
                if (outraFoto != null)
                {
                    outraFoto.Principal = true;
                    await _context.SaveChangesAsync();
                }
            }
        }
    }

    public async Task DefinirFotoPrincipalAsync(Guid veiculoId, Guid fotoId)
    {
        var fotos = await _context.VeiculoFotos.Where(f => f.VeiculoId == veiculoId).ToListAsync();
        foreach (var f in fotos)
        {
            f.Principal = (f.Id == fotoId);
        }
        await _context.SaveChangesAsync();
    }

    public async Task<VeiculoDocumentoDto> AdicionarDocumentoAsync(Guid veiculoId, string nomeArquivo, string url, string tipo)
    {
        var veiculo = await _context.Veiculos.FindAsync(veiculoId);
        if (veiculo == null) throw new KeyNotFoundException("Veículo não encontrado");

        if (!Enum.TryParse<TipoDocumento>(tipo, true, out var enumTipo))
            enumTipo = TipoDocumento.Outro;

        var doc = new VeiculoDocumento
        {
            VeiculoId = veiculoId,
            NomeArquivo = nomeArquivo,
            Url = url,
            TipoDocumento = enumTipo
        };
        _context.VeiculoDocumentos.Add(doc);
        await _context.SaveChangesAsync();

        return new VeiculoDocumentoDto { Id = doc.Id, NomeArquivo = doc.NomeArquivo, Url = doc.Url, TipoDocumento = doc.TipoDocumento.ToString() };
    }

    public async Task RemoverDocumentoAsync(Guid veiculoId, Guid documentoId)
    {
        var doc = await _context.VeiculoDocumentos.FirstOrDefaultAsync(d => d.Id == documentoId && d.VeiculoId == veiculoId);
        if (doc != null)
        {
            _context.VeiculoDocumentos.Remove(doc);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<VeiculoCustoDto> AdicionarCustoAsync(Guid veiculoId, VeiculoCustoDto custoDto)
    {
        var veiculo = await _context.Veiculos.FindAsync(veiculoId);
        if (veiculo == null) throw new KeyNotFoundException("Veículo não encontrado");

        var defaultTenantId = Guid.Parse("00000000-0000-0000-0000-000000000001");
        var empresaId = veiculo.EmpresaId != Guid.Empty ? veiculo.EmpresaId : defaultTenantId;

        // Garante Categoria Financeira válida para não violar Foreign Key
        var categoriaPadrao = await _context.CategoriasFinanceiras.FirstOrDefaultAsync();
        if (categoriaPadrao == null)
        {
            categoriaPadrao = new CategoriaFinanceira
            {
                Id = Guid.NewGuid(),
                EmpresaId = empresaId,
                Nome = "Manutenção e Preparação de Veículos",
                Tipo = 2, // Despesa
                Ativa = true
            };
            _context.CategoriasFinanceiras.Add(categoriaPadrao);
            await _context.SaveChangesAsync();
        }

        var custo = new VeiculoCusto
        {
            Id = Guid.NewGuid(),
            VeiculoId = veiculoId,
            CategoriaId = categoriaPadrao.Id,
            Descricao = custoDto.Descricao,
            Valor = custoDto.Valor,
            DataCusto = custoDto.DataCusto == default ? DateTime.Now : custoDto.DataCusto
        };
        _context.VeiculoCustos.Add(custo);

        // INTEGRAÇÃO: Gerar Conta a Pagar automaticamente
        var fornecedorPadrao = await _context.Fornecedores.FirstOrDefaultAsync();
        if (fornecedorPadrao == null)
        {
            fornecedorPadrao = new Fornecedor
            {
                Id = Guid.NewGuid(),
                EmpresaId = empresaId,
                NomeRazaoSocial = "Fornecedor de Serviços e Peças Padrão",
                CpfCnpj = "00.000.000/0001-91",
                TipoPessoa = TipoPessoa.Juridica,
                Ativo = true
            };
            _context.Fornecedores.Add(fornecedorPadrao);
            await _context.SaveChangesAsync();
        }

        var contaPagar = new GravityCarSystem.Domain.Entities.Financeiro.ContaPagar
        {
            Id = Guid.NewGuid(),
            EmpresaId = empresaId,
            FornecedorId = fornecedorPadrao.Id,
            CategoriaId = categoriaPadrao.Id,
            Descricao = $"Custo de Veículo - {veiculo.Placa ?? veiculo.Modelo}: {custoDto.Descricao}",
            ValorOriginal = custoDto.Valor,
            Saldo = custoDto.Valor,
            ValorPago = 0,
            DataEmissao = DateTime.Now,
            DataVencimento = DateTime.Now.AddDays(7), // Vencimento padrão para custos de veículo
            Status = StatusConta.Aberto
        };
        _context.ContasPagar.Add(contaPagar);

        await _context.SaveChangesAsync();

        custoDto.Id = custo.Id;
        return custoDto;
    }
}
