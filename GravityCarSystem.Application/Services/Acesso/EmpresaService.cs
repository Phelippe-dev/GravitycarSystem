using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GravityCarSystem.Application.DTOs.Acesso;
using GravityCarSystem.Application.Interfaces.Acesso;
using GravityCarSystem.Domain.Entities.Acesso;
using GravityCarSystem.Application.Interfaces;

namespace GravityCarSystem.Application.Services.Acesso;

public class EmpresaService : IEmpresaService
{
    private readonly IAppDbContext _context;

    public EmpresaService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<EmpresaDto>> ObterTodasAsync()
    {
        // NOTA: Como é o Portal Admin da Software House, ele NÃO usa o TenantId, 
        // ele busca TODAS as Empresas cadastradas no banco de dados inteiro.
        var empresas = await _context.Empresas.OrderByDescending(e => e.DataCadastro).ToListAsync();
        
        return empresas.Select(e => new EmpresaDto
        {
            Id = e.Id,
            RazaoSocial = e.RazaoSocial,
            NomeFantasia = e.NomeFantasia,
            Cnpj = e.Cnpj,
            InscricaoEstadual = e.InscricaoEstadual,
            Telefone = e.Telefone,
            Email = e.Email,
            Cep = e.Cep,
            Logradouro = e.Logradouro,
            Numero = e.Numero,
            Bairro = e.Bairro,
            Cidade = e.Cidade,
            Estado = e.Estado,
            Ativa = e.Ativa,
            CriadoEm = e.DataCadastro
        });
    }

    public async Task<EmpresaDto> ObterPorIdAsync(Guid id)
    {
        var e = await _context.Empresas.FirstOrDefaultAsync(x => x.Id == id);
        if (e == null) throw new KeyNotFoundException("Empresa não encontrada.");

        return new EmpresaDto
        {
            Id = e.Id,
            RazaoSocial = e.RazaoSocial,
            NomeFantasia = e.NomeFantasia,
            Cnpj = e.Cnpj,
            InscricaoEstadual = e.InscricaoEstadual,
            Telefone = e.Telefone,
            Email = e.Email,
            Cep = e.Cep,
            Logradouro = e.Logradouro,
            Numero = e.Numero,
            Bairro = e.Bairro,
            Cidade = e.Cidade,
            Estado = e.Estado,
            Ativa = e.Ativa,
            CriadoEm = e.DataCadastro
        };
    }

    public async Task<EmpresaDto> CriarAsync(EmpresaDto dto)
    {
        var empresa = new Empresa
        {
            Id = Guid.NewGuid(),
            RazaoSocial = dto.RazaoSocial,
            NomeFantasia = dto.NomeFantasia,
            Cnpj = dto.Cnpj,
            InscricaoEstadual = dto.InscricaoEstadual,
            Telefone = dto.Telefone,
            Email = dto.Email,
            Cep = dto.Cep,
            Logradouro = dto.Logradouro,
            Numero = dto.Numero,
            Bairro = dto.Bairro,
            Cidade = dto.Cidade,
            Estado = dto.Estado,
            Ativa = true,
            DataCadastro = DateTime.UtcNow
        };

        _context.Empresas.Add(empresa);
        
        // Aqui futuramente será criado o primeiro Usuário (Dono da Empresa)
        
        await _context.SaveChangesAsync();
        dto.Id = empresa.Id;
        dto.Ativa = empresa.Ativa;
        dto.CriadoEm = empresa.DataCadastro;
        return dto;
    }

    public async Task<bool> AlternarStatusAsync(Guid id)
    {
        var empresa = await _context.Empresas.FirstOrDefaultAsync(x => x.Id == id);
        if (empresa == null) throw new KeyNotFoundException("Empresa não encontrada.");

        empresa.Ativa = !empresa.Ativa; // Bloqueia ou Desbloqueia
        await _context.SaveChangesAsync();
        return empresa.Ativa;
    }
}
