using System;
using MotorsXySystem.Application.Interfaces;

namespace MotorsXySystem.Tests.Common;

public class TestTenantService : ICurrentTenantService
{
    private Guid? _empresaId;

    public TestTenantService(Guid? empresaIdInicial = null)
    {
        _empresaId = empresaIdInicial;
    }

    public Guid? ObterEmpresaId() => _empresaId;

    public void DefinirEmpresaId(Guid empresaId)
    {
        _empresaId = empresaId;
    }

    public void Limpar()
    {
        _empresaId = null;
    }
}
