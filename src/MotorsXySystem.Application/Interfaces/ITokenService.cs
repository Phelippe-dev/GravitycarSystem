using MotorsXySystem.Domain.Entidades.Acesso;

namespace MotorsXySystem.Application.Interfaces;

public interface ITokenService
{
    string GerarToken(Usuario usuario);
}
