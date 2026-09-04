using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GravityCarSystem.Application.DTOs.Cadastros;
using GravityCarSystem.Application.Interfaces;
using GravityCarSystem.Domain.Entities.Cadastros;

namespace GravityCarSystem.Application.Services.Cadastros;

public class ClienteService : IClienteService
{
    private readonly IAppDbContext _context;

    public ClienteService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<ClienteDto> AdicionarAsync(ClienteDto dto)
    {
        // Validações simples
        if (string.IsNullOrWhiteSpace(dto.Nome))
            throw new ArgumentException("O nome do cliente é obrigatório.");
            
        if (string.IsNullOrWhiteSpace(dto.CpfCnpj))
            throw new ArgumentException("O CPF ou CNPJ é obrigatório.");

        // Verifica duplicidade
        bool existe = await _context.Clientes.AnyAsync(c => c.CpfCnpj == dto.CpfCnpj);
        if (existe)
            throw new InvalidOperationException("Já existe um cliente cadastrado com este CPF/CNPJ.");

        var cliente = new Cliente
        {
            NomeRazaoSocial = dto.Nome,
            CpfCnpj = dto.CpfCnpj,
            TipoPessoa = Enum.TryParse<GravityCarSystem.Domain.Enums.TipoPessoa>(dto.TipoPessoa, out var tipo) ? tipo : GravityCarSystem.Domain.Enums.TipoPessoa.Fisica,
            Email = dto.Email,
            Telefone = dto.Telefone,
            Celular = dto.Celular,
            Cep = dto.Cep,
            Logradouro = dto.Logradouro,
            Numero = dto.Numero,
            Complemento = dto.Complemento,
            Bairro = dto.Bairro,
            Cidade = dto.Cidade,
            Estado = dto.Estado,
            Observacoes = dto.Observacao
        };

        _context.Clientes.Add(cliente);
        await _context.SaveChangesAsync();

        dto.Id = cliente.Id;
        return dto;
    }

    public async Task<ClienteDto> AtualizarAsync(Guid id, ClienteDto dto)
    {
        var cliente = await _context.Clientes.FindAsync(id);
        if (cliente == null)
            throw new KeyNotFoundException("Cliente não encontrado.");

        // Verifica duplicidade se mudou o CPF
        if (cliente.CpfCnpj != dto.CpfCnpj)
        {
            bool existe = await _context.Clientes.AnyAsync(c => c.CpfCnpj == dto.CpfCnpj && c.Id != id);
            if (existe)
                throw new InvalidOperationException("Já existe um cliente cadastrado com este CPF/CNPJ.");
        }

        cliente.NomeRazaoSocial = dto.Nome ?? string.Empty;
        cliente.CpfCnpj = dto.CpfCnpj;
        cliente.TipoPessoa = Enum.TryParse<GravityCarSystem.Domain.Enums.TipoPessoa>(dto.TipoPessoa, out var tipo) ? tipo : GravityCarSystem.Domain.Enums.TipoPessoa.Fisica;
        cliente.Email = dto.Email;
        cliente.Telefone = dto.Telefone;
        cliente.Celular = dto.Celular;
        cliente.Cep = dto.Cep;
        cliente.Logradouro = dto.Logradouro;
        cliente.Numero = dto.Numero;
        cliente.Complemento = dto.Complemento;
        cliente.Bairro = dto.Bairro;
        cliente.Cidade = dto.Cidade;
        cliente.Estado = dto.Estado;
        cliente.Observacoes = dto.Observacao;

        await _context.SaveChangesAsync();
        return dto;
    }

    public async Task RemoverAsync(Guid id)
    {
        var cliente = await _context.Clientes.FindAsync(id);
        if (cliente == null)
            throw new KeyNotFoundException("Cliente não encontrado.");

        _context.Clientes.Remove(cliente);
        await _context.SaveChangesAsync();
    }

    public async Task<ClienteDto?> ObterPorIdAsync(Guid id)
    {
        var c = await _context.Clientes.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (c == null) return null;

        return new ClienteDto
        {
            Id = c.Id,
            Nome = c.NomeRazaoSocial,
            CpfCnpj = c.CpfCnpj ?? string.Empty,
            TipoPessoa = c.TipoPessoa.ToString(),
            Email = c.Email ?? string.Empty,
            Telefone = c.Telefone ?? string.Empty,
            Celular = c.Celular,
            Cep = c.Cep,
            Logradouro = c.Logradouro,
            Numero = c.Numero,
            Complemento = c.Complemento,
            Bairro = c.Bairro,
            Cidade = c.Cidade,
            Estado = c.Estado,
            Observacao = c.Observacoes
        };
    }

    public async Task<IEnumerable<ClienteDto>> ObterTodosAsync()
    {
        return await _context.Clientes
            .AsNoTracking()
            .Select(c => new ClienteDto
            {
                Id = c.Id,
                Nome = c.NomeRazaoSocial,
                CpfCnpj = c.CpfCnpj ?? string.Empty,
                TipoPessoa = c.TipoPessoa.ToString(),
                Email = c.Email ?? string.Empty,
                Telefone = c.Telefone ?? string.Empty,
                Celular = c.Celular,
                Cep = c.Cep,
                Logradouro = c.Logradouro,
                Numero = c.Numero,
                Complemento = c.Complemento,
                Bairro = c.Bairro,
                Cidade = c.Cidade,
                Estado = c.Estado,
                Observacao = c.Observacoes
            })
            .ToListAsync();
    }

    public async Task<ClienteDetalhesDto?> ObterDetalhesAsync(Guid id)
    {
        var c = await _context.Clientes.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (c == null) return null;

        var dto = new ClienteDetalhesDto
        {
            Id = c.Id,
            Nome = c.NomeRazaoSocial,
            CpfCnpj = c.CpfCnpj ?? string.Empty,
            TipoPessoa = c.TipoPessoa.ToString(),
            Email = c.Email ?? string.Empty,
            Telefone = c.Telefone ?? string.Empty,
            Celular = c.Celular,
            Cep = c.Cep,
            Logradouro = c.Logradouro,
            Numero = c.Numero,
            Complemento = c.Complemento,
            Bairro = c.Bairro,
            Cidade = c.Cidade,
            Estado = c.Estado,
            Observacao = c.Observacoes
        };

        // Obter Vendas Realizadas
        var vendas = await _context.Vendas
            .Where(v => v.ClienteId == id)
            .Include(v => v.Veiculos)
            .AsNoTracking()
            .ToListAsync();

        foreach (var v in vendas)
        {
            dto.VendasRealizadas.Add(new GravityCarSystem.Application.DTOs.Negocio.VendaDto
            {
                Id = v.Id,
                ClienteId = v.ClienteId,
                UsuarioId = v.UsuarioId,
                NumeroVenda = v.NumeroVenda,
                DataVenda = v.DataVenda,
                ValorBruto = v.ValorBruto,
                Desconto = v.Desconto,
                ValorLiquido = v.ValorLiquido,
                Status = v.Status,
                Observacoes = v.Observacoes,
                VeiculosIds = v.Veiculos.Select(ve => ve.VeiculoId).ToList()
            });
        }

        // Obter Veículos na Troca
        var trocas = await _context.Vendas
            .Where(v => v.ClienteId == id)
            .Include(v => v.Trocas)
                .ThenInclude(t => t.Veiculo)
            .SelectMany(v => v.Trocas)
            .AsNoTracking()
            .ToListAsync();

        foreach (var t in trocas)
        {
            if (t.Veiculo != null)
            {
                dto.VeiculosNaTroca.Add(new GravityCarSystem.Application.DTOs.Negocio.VendaTrocaDto
                {
                    Marca = t.Veiculo.Marca,
                    Modelo = t.Veiculo.Modelo,
                    Versao = t.Veiculo.Versao,
                    AnoFabricacao = t.Veiculo.AnoFabricacao ?? 0,
                    AnoModelo = t.Veiculo.AnoModelo ?? 0,
                    Placa = t.Veiculo.Placa ?? string.Empty,
                    ValorAvaliacao = t.ValorAvaliacao
                });
            }
        }

        return dto;
    }
}
