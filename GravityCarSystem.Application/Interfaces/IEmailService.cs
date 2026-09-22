using System.Threading.Tasks;

namespace GravityCarSystem.Application.Interfaces;

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string body);
}
