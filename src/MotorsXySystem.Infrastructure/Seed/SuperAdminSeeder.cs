using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MotorsXySystem.Domain.Entidades.Acesso;
using MotorsXySystem.Domain.Entidades.Tenant;
using MotorsXySystem.Infrastructure.Data;
using MotorsXySystem.Infrastructure.Middleware;

namespace MotorsXySystem.Infrastructure.Seed;

/// <summary>
/// Garante que exista exatamente UM SuperAdmin na plataforma, definido pela configuração
/// "SuperAdmin:Email" / "SuperAdmin:Password" (variáveis SuperAdmin__Email / SuperAdmin__Password).
/// Qualquer outro usuário com perfil SuperAdmin é removido.
/// </summary>
public static class SuperAdminSeeder
{
    public static async Task ExecutarAsync(AppDbContext db, IConfiguration config, ILogger logger)
    {
        var email = config["SuperAdmin:Email"]?.Trim().ToLowerInvariant();
        var senha = config["SuperAdmin:Password"];
        var nome = config["SuperAdmin:Nome"] ?? "Super Administrador";

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(senha))
        {
            logger.LogWarning("SuperAdmin não configurado (SuperAdmin:Email / SuperAdmin:Password). Seed ignorado.");
            return;
        }

        var superAdmins = await db.Usuarios.IgnoreQueryFilters()
            .Include(u => u.Perfil)
            .Where(u => u.Perfil.Nome == TenantMiddleware.RoleSuperAdmin)
            .ToListAsync();

        // 1. Empresa "casa" do SuperAdmin
        var empresaId = superAdmins.Select(u => (Guid?)u.EmpresaId).FirstOrDefault()
                        ?? await db.Empresas.OrderBy(e => e.DataCriacao).Select(e => (Guid?)e.Id).FirstOrDefaultAsync();
        if (empresaId == null)
        {
            var plataforma = new Empresa { RazaoSocial = "Motors Xy Plataforma", NomeFantasia = "Motors Xy", Slug = "plataforma" };
            db.Empresas.Add(plataforma);
            await db.SaveChangesAsync();
            empresaId = plataforma.Id;
        }

        // 2. Perfil SuperAdmin
        var perfil = await db.Perfis.IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.EmpresaId == empresaId && p.Nome == TenantMiddleware.RoleSuperAdmin);
        if (perfil == null)
        {
            perfil = new Perfil { EmpresaId = empresaId.Value, Nome = TenantMiddleware.RoleSuperAdmin, Descricao = "Acesso total à plataforma (todas as lojas)" };
            db.Perfis.Add(perfil);
            await db.SaveChangesAsync();
        }

        // 3. Remove SuperAdmins antigos
        var antigos = superAdmins.Where(u => !string.Equals(u.Email, email, StringComparison.OrdinalIgnoreCase)).ToList();
        foreach (var antigo in antigos)
        {
            db.Usuarios.Remove(antigo);
            try
            {
                await db.SaveChangesAsync();
                logger.LogWarning("SuperAdmin antigo removido: {Email}", antigo.Email);
            }
            catch (DbUpdateException)
            {
                // Usuário referenciado por outros registros: desativa e anonimiza em vez de excluir fisicamente.
                db.Entry(antigo).State = EntityState.Modified;
                antigo.Ativo = false;
                antigo.Email = $"removido+{antigo.Id:N}@invalid";
                antigo.SenhaHash = "!";
                await db.SaveChangesAsync();
                logger.LogWarning("SuperAdmin antigo desativado (possui vínculos): {Id}", antigo.Id);
            }
        }

        // 4. Cria/atualiza o novo SuperAdmin
        var codigoLiberacao = config["SuperAdmin:CodigoLiberacao"] ?? "123456";
        var usuario = await db.Usuarios.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Email.ToLower() == email);
        if (usuario == null)
        {
            db.Usuarios.Add(new Usuario
            {
                EmpresaId = empresaId.Value,
                Nome = nome,
                Email = email,
                SenhaHash = BCrypt.Net.BCrypt.HashPassword(senha),
                CodigoLiberacao = codigoLiberacao,
                PerfilId = perfil.Id,
                Ativo = true
            });
            logger.LogInformation("SuperAdmin criado: {Email} (Token de Liberação: {Codigo})", email, codigoLiberacao);
        }
        else
        {
            usuario.EmpresaId = empresaId.Value;
            usuario.PerfilId = perfil.Id;
            usuario.Ativo = true;
            usuario.CodigoLiberacao = codigoLiberacao;
            bool senhaOk;
            try { senhaOk = BCrypt.Net.BCrypt.Verify(senha, usuario.SenhaHash); } catch { senhaOk = false; }
            if (!senhaOk) usuario.SenhaHash = BCrypt.Net.BCrypt.HashPassword(senha);
            usuario.DataAtualizacao = DateTime.UtcNow;
        }

        await db.SaveChangesAsync();
    }
}
