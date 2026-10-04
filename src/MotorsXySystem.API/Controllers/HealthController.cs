using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MotorsXySystem.Infrastructure.Data;

namespace MotorsXySystem.API.Controllers;

[ApiController]
[AllowAnonymous]
public class HealthController : ControllerBase
{
    private readonly AppDbContext _context;

    public HealthController(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Liveness probe: verifica se o processo web está respondendo.
    /// </summary>
    [HttpGet("/health")]
    [HttpGet("/api/health")]
    public IActionResult Health()
    {
        return Ok(new
        {
            Status = "Healthy",
            Timestamp = DateTime.UtcNow,
            Service = "Motors Xy API",
            Version = "2.0.0"
        });
    }

    /// <summary>
    /// Readiness probe: verifica se a API consegue se comunicar com o banco de dados.
    /// </summary>
    [HttpGet("/ready")]
    [HttpGet("/api/ready")]
    public async Task<IActionResult> Ready(CancellationToken ct)
    {
        try
        {
            var dbOk = await _context.Database.CanConnectAsync(ct);
            if (!dbOk)
            {
                return StatusCode(503, new
                {
                    Status = "Unhealthy",
                    Database = "Disconnected",
                    Timestamp = DateTime.UtcNow
                });
            }

            return Ok(new
            {
                Status = "Ready",
                Database = "Connected",
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            return StatusCode(503, new
            {
                Status = "Unhealthy",
                Database = "Error",
                Error = ex.Message,
                Timestamp = DateTime.UtcNow
            });
        }
    }
}
