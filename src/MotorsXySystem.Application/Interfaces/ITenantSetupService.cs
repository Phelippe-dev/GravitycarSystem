using System.Threading.Tasks;
using MotorsXySystem.Application.DTOs;

namespace MotorsXySystem.Application.Interfaces;

public interface ITenantSetupService
{
    Task<string> SetupNovoTenantAsync(TenantSetupRequest request);
}
