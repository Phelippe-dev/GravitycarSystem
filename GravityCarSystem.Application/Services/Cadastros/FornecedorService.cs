using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GravityCarSystem.Application.DTOs.Cadastros;
using GravityCarSystem.Application.Interfaces;
using GravityCarSystem.Domain.Entities.Cadastros;
using Microsoft.EntityFrameworkCore;

namespace GravityCarSystem.Application.Services.Cadastros;

public class FornecedorService : IFornecedorService
{
    private readonly IAppDbContext _context;

    public FornecedorService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<FornecedorDto>> ListarAtivosAsync()
    {
        return await _context.Fornecedores
            .Where(f => f.Ativo)
            .OrderBy(f => f.NomeRazaoSocial)
            .Select(f => new FornecedorDto
            {
                Id = f.Id,
                TipoPessoa = f.TipoPessoa,
                NomeRazaoSocial = f.NomeRazaoSocial,
                CpfCnpj = f.CpfCnpj,
                RgIe = f.RgIe,
                Telefone = f.Telefone,
                Celular = f.Celular,
                Email = f.Email,
                Cep = f.Cep,
                Logradouro = f.Logradouro,
                Numero = f.Numero,
                Complemento = f.Complemento,
                Bairro = f.Bairro,
                Cidade = f.Cidade,
                Estado = f.Estado,
                Observacoes = f.Observacoes,
                Ativo = f.Ativo
            }).ToListAsync();
    }

    public async Task<FornecedorDto?> ObterPorIdAsync(Guid id)
    {
        var f = await _context.Fornecedores.FirstOrDefaultAsync(x => x.Id == id);
        if (f == null) return null;

        return new FornecedorDto
        {
            Id = f.Id,
            TipoPessoa = f.TipoPessoa,
            NomeRazaoSocial = f.NomeRazaoSocial,
            CpfCnpj = f.CpfCnpj,
            RgIe = f.RgIe,
            Telefone = f.Telefone,
            Celular = f.Celular,
            Email = f.Email,
            Cep = f.Cep,
            Logradouro = f.Logradouro,
            Numero = f.Numero,
            Complemento = f.Complemento,
            Bairro = f.Bairro,
            Cidade = f.Cidade,
            Estado = f.Estado,
            Observacoes = f.Observacoes,
            Ativo = f.Ativo
        };
    }

    public async Task<FornecedorDto> CriarAsync(FornecedorDto dto)
    {
        var fornecedor = new Fornecedor
        {
            Id = Guid.NewGuid(),
            TipoPessoa = dto.TipoPessoa,
            NomeRazaoSocial = dto.NomeRazaoSocial,
            CpfCnpj = dto.CpfCnpj,
            RgIe = dto.RgIe,
            Telefone = dto.Telefone,
            Celular = dto.Celular,
            Email = dto.Email,
            Cep = dto.Cep,
            Logradouro = dto.Logradouro,
            Numero = dto.Numero,
            Complemento = dto.Complemento,
            Bairro = dto.Bairro,
            Cidade = dto.Cidade,
            Estado = dto.Estado,
            Observacoes = dto.Observacoes,
            Ativo = true
        };

        _context.Fornecedores.Add(fornecedor);
        await _context.SaveChangesAsync();

        dto.Id = fornecedor.Id;
        dto.Ativo = fornecedor.Ativo;
        return dto;
    }

    public async Task<FornecedorDto> AtualizarAsync(Guid id, FornecedorDto dto)
    {
        var fornecedor = await _context.Fornecedores.FirstOrDefaultAsync(x => x.Id == id);
        if (fornecedor == null) throw new InvalidOperationException("Fornecedor não encontrado.");

        fornecedor.TipoPessoa = dto.TipoPessoa;
        fornecedor.NomeRazaoSocial = dto.NomeRazaoSocial;
        fornecedor.CpfCnpj = dto.CpfCnpj;
        fornecedor.RgIe = dto.RgIe;
        fornecedor.Telefone = dto.Telefone;
        fornecedor.Celular = dto.Celular;
        fornecedor.Email = dto.Email;
        fornecedor.Cep = dto.Cep;
        fornecedor.Logradouro = dto.Logradouro;
        fornecedor.Numero = dto.Numero;
        fornecedor.Complemento = dto.Complemento;
        fornecedor.Bairro = dto.Bairro;
        fornecedor.Cidade = dto.Cidade;
        fornecedor.Estado = dto.Estado;
        fornecedor.Observacoes = dto.Observacoes;

        await _context.SaveChangesAsync();
        return dto;
    }

    public async Task InativarAsync(Guid id)
    {
        var fornecedor = await _context.Fornecedores.FirstOrDefaultAsync(x => x.Id == id);
        if (fornecedor != null)
        {
            fornecedor.Ativo = false;
            await _context.SaveChangesAsync();
        }
    }
}
