using System;
using System.Threading.Tasks;
using GravityCarSystem.Application.DTOs.Integracoes;

namespace GravityCarSystem.Application.Interfaces.Integracoes;

public interface ISenatranService
{
    Task<SenatranVeiculoResultDto> ConsultarVeiculoAsync(string placa, string renavam);
    Task<bool> RegistrarEntradaRenaveAsync(Guid veiculoId);
    Task<AtpveResultDto> GerarAtpveSaidaAsync(GerarAtpveRequestDto request);
}
