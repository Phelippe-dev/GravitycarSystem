using System;
using GravityCarSystem.Application.Interfaces;

namespace GravityCarSystem.Infrastructure.Services;

// ImplementaÃ§Ã£o Fake inicial para permitir compilar e rodar Migrations
public class FakeCurrentTenantService : ICurrentTenantService
{
    public Guid? GetEmpresaId()
    {
        // Fake tenant ID para desenvolvimento
        return Guid.Parse("11111111-1111-1111-1111-111111111111");
    }

    public Guid? GetUsuarioId()
    {
        return Guid.Parse("22222222-2222-2222-2222-222222222222");
    }
}
