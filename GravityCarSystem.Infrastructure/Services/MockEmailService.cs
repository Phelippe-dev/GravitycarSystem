using System.Threading.Tasks;
using GravityCarSystem.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace GravityCarSystem.Infrastructure.Services;

public class MockEmailService : IEmailService
{
    private readonly ILogger<MockEmailService> _logger;

    public MockEmailService(ILogger<MockEmailService> logger)
    {
        _logger = logger;
    }

    public Task SendEmailAsync(string to, string subject, string body)
    {
        _logger.LogInformation("========== INÍCIO DO E-MAIL SIMULADO ==========");
        _logger.LogInformation("Para: {To}", to);
        _logger.LogInformation("Assunto: {Subject}", subject);
        _logger.LogInformation("Corpo: {Body}", body);
        _logger.LogInformation("=========== FIM DO E-MAIL SIMULADO ============");
        
        return Task.CompletedTask;
    }
}
