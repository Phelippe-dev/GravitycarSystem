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
        // NOTA: Como Ã© o Portal Admin da Software House, ele NÃ­O usa o TenantId, 
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
        if (e == null) throw new KeyNotFoundException("Empresa nÃ£o encontrada.");

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
        await _context.SaveChangesAsync();
        
        // Criar o primeiro UsuÃ¡rio (Dono da Empresa)
        if (!string.IsNullOrEmpty(dto.Email) && !string.IsNullOrEmpty(dto.SenhaAdmin))
        {
            var adminUser = new Usuario
            {
                Id = Guid.NewGuid(),
                Nome = "Administrador - " + dto.NomeFantasia,
                Email = dto.Email.ToLower().Trim(),
                SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.SenhaAdmin),
                EmpresaId = empresa.Id,
                Ativo = true,
                Cargo = "ProprietÃ¡rio",
                DataCadastro = DateTime.UtcNow
            };
            _context.Usuarios.Add(adminUser);
            await _context.SaveChangesAsync();

            var adminPerfil = await _context.Perfis.FirstOrDefaultAsync(p => p.Nome == "Admin");
            if (adminPerfil != null)
            {
                _context.UsuarioPerfis.Add(new UsuarioPerfil
                {
                    UsuarioId = adminUser.Id,
                    PerfilId = adminPerfil.Id
                });
                await _context.SaveChangesAsync();
            }
        }
        
        dto.Id = empresa.Id;
        dto.Ativa = empresa.Ativa;
        dto.CriadoEm = empresa.DataCadastro;
        return dto;
    }

        public async Task<EmpresaDto> AtualizarAsync(Guid id, EmpresaDto dto)
    {
        var empresa = await _context.Empresas.FirstOrDefaultAsync(x => x.Id == id);
        if (empresa == null) throw new KeyNotFoundException("Empresa não encontrada.");

        empresa.RazaoSocial = dto.RazaoSocial;
        empresa.NomeFantasia = dto.NomeFantasia;
        empresa.Cnpj = dto.Cnpj;
        empresa.InscricaoEstadual = dto.InscricaoEstadual;
        empresa.Telefone = dto.Telefone;
        empresa.Email = dto.Email;
        empresa.Cep = dto.Cep;
        empresa.Logradouro = dto.Logradouro;
        empresa.Numero = dto.Numero;
        empresa.Bairro = dto.Bairro;
        empresa.Cidade = dto.Cidade;
        empresa.Estado = dto.Estado;

        await _context.SaveChangesAsync();
        return dto;
    }

    public async Task RemoverAsync(Guid id)
    {
        var empresa = await _context.Empresas.FirstOrDefaultAsync(x => x.Id == id);
        if (empresa == null) throw new KeyNotFoundException("Empresa não encontrada.");
        
        _context.Empresas.Remove(empresa);
        await _context.SaveChangesAsync();
    }
    public async Task<bool> AlternarStatusAsync(Guid id)
    {
        var empresa = await _context.Empresas.FirstOrDefaultAsync(x => x.Id == id);
        if (empresa == null) throw new KeyNotFoundException("Empresa nÃ£o encontrada.");

        empresa.Ativa = !empresa.Ativa; // Bloqueia ou Desbloqueia
        await _context.SaveChangesAsync();
        return empresa.Ativa;
    }
}
