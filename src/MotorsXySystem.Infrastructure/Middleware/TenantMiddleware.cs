using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MotorsXySystem.Application.Interfaces;
using MotorsXySystem.Infrastructure.Data;

namespace MotorsXySystem.Infrastructure.Middleware;

/// <summary>
/// Resolve o Tenant (EmpresaId) da requisição e injeta no ICurrentTenantService,
/// garantindo que o Entity Framework filtre automaticamente todos os dados pelo Tenant correto.
///
/// Ordem de resolução:
///   1. Usuário autenticado → claim "EmpresaId" do JWT.
///      SuperAdmin pode atuar em outra loja enviando o header "X-Tenant-Id".
///   2. Requisição anônima (landing pages, formulários) → header "X-Tenant" (slug)
///      ou subdomínio "{slug}.{Tenancy:BaseDomain}".
/// </summary>
public class TenantMiddleware
{
    public const string RoleSuperAdmin = "SuperAdmin";
    private readonly RequestDelegate _next;
    private readonly string? _baseDomain;

    public TenantMiddleware(RequestDelegate next, IConfiguration config)
    {
        _next = next;
        _baseDomain = config["Tenancy:BaseDomain"]?.Trim().ToLowerInvariant();
    }

    public async Task InvokeAsync(HttpContext context, ICurrentTenantService tenantService, AppDbContext db)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var empresaIdClaim = context.User.FindFirst("EmpresaId");
            if (empresaIdClaim != null && Guid.TryParse(empresaIdClaim.Value, out var empresaId))
            {
                tenantService.DefinirEmpresaId(empresaId);
            }

            if (context.User.IsInRole(RoleSuperAdmin)
                && Guid.TryParse(context.Request.Headers["X-Tenant-Id"].FirstOrDefault(), out var alvo))
            {
                tenantService.DefinirEmpresaId(alvo);
            }
        }
        else
        {
            var slug = context.Request.Headers["X-Tenant"].FirstOrDefault() ?? ExtrairSlugDoHost(context.Request.Host.Host);
            if (!string.IsNullOrWhiteSpace(slug))
            {
                slug = slug.Trim().ToLowerInvariant();
                var id = await db.Empresas.AsNoTracking()
                    .Where(e => e.Slug == slug && e.Ativo)
                    .Select(e => (Guid?)e.Id)
                    .FirstOrDefaultAsync();
                if (id.HasValue) tenantService.DefinirEmpresaId(id.Value);
            }
        }

        await _next(context);
    }

    private string? ExtrairSlugDoHost(string host)
    {
        if (string.IsNullOrEmpty(_baseDomain)) return null;
        host = host.ToLowerInvariant();
        var sufixo = "." + _baseDomain;
        if (!host.EndsWith(sufixo)) return null;
        var sub = host[..^sufixo.Length];
        return sub is "" or "www" or "app" or "api" || sub.Contains('.') ? null : sub;
    }
}
