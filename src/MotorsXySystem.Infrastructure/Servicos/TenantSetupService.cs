using System;
using System.Threading.Tasks;
using MotorsXySystem.Application.Interfaces;
using MotorsXySystem.Application.DTOs;
using MotorsXySystem.Infrastructure.Data;
using MotorsXySystem.Domain.Entidades.Tenant;
using MotorsXySystem.Domain.Entidades.Acesso;

namespace MotorsXySystem.Infrastructure.Servicos;

public class TenantSetupService : ITenantSetupService
{
    private readonly AppDbContext _context;

    public TenantSetupService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<string> SetupNovoTenantAsync(TenantSetupRequest request)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 1. Criar Empresa (Tenant)
            var empresa = new Empresa
            {
                RazaoSocial = request.RazaoSocial,
                NomeFantasia = request.NomeFantasia,
                Cnpj = request.Cnpj,
                DataCriacao = DateTime.UtcNow,
                Ativo = true
            };
            
            _context.Empresas.Add(empresa);
            await _context.SaveChangesAsync();

            // 2. Criar Perfil Admin
            var perfilAdmin = new Perfil
            {
                EmpresaId = empresa.Id,
                Nome = "Administrador",
                Descricao = "Acesso total ao sistema",
                DataCriacao = DateTime.UtcNow,
                Ativo = true
            };
            
            _context.Perfis.Add(perfilAdmin);
            await _context.SaveChangesAsync();

            // 3. Gerar código de liberação de 6 dígitos para o cliente
            var codigoLiberacao = Random.Shared.Next(100000, 999999).ToString();

            // Criar Usuário Admin associado ao Perfil e à Empresa
            var usuario = new Usuario
            {
                EmpresaId = empresa.Id,
                Nome = request.AdminNome,
                Email = request.AdminEmail,
                SenhaHash = BCrypt.Net.BCrypt.HashPassword(request.AdminSenha),
                CodigoLiberacao = codigoLiberacao,
                PerfilId = perfilAdmin.Id,
                DataCriacao = DateTime.UtcNow,
                Ativo = true
            };

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return $"Setup concluído! Empresa '{empresa.NomeFantasia}' criada com sucesso. ID: {empresa.Id}. Código de Liberação do Cliente (6 dígitos): {codigoLiberacao}";
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            throw new ApplicationException("Erro ao configurar tenant: " + ex.Message);
        }
    }
}
