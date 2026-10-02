using System;
using MotorsXySystem.Application.Interfaces;

namespace MotorsXySystem.Infrastructure.Servicos;

public class CurrentTenantService : ICurrentTenantService
{
    private Guid? _empresaId;

    public Guid? ObterEmpresaId()
    {
        // Num cenário real, isso vem do HttpContext ou JWT claim injetado
        return _empresaId;
    }

    public void DefinirEmpresaId(Guid empresaId)
    {
        _empresaId = empresaId;
    }
}
