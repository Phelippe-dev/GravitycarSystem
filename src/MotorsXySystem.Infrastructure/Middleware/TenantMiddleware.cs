using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using MotorsXySystem.Application.Interfaces;

namespace MotorsXySystem.Infrastructure.Middleware;

/// <summary>
/// Middleware que extrai o EmpresaId do token JWT e injeta no ICurrentTenantService,
/// garantindo que o Entity Framework filtre automaticamente todos os dados pelo Tenant correto.
/// </summary>
public class TenantMiddleware
{
    private readonly RequestDelegate _next;

    public TenantMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ICurrentTenantService tenantService)
    {
        var empresaIdClaim = context.User.FindFirst("EmpresaId");
        if (empresaIdClaim != null && Guid.TryParse(empresaIdClaim.Value, out var empresaId))
        {
            tenantService.DefinirEmpresaId(empresaId);
        }

        await _next(context);
    }
}
