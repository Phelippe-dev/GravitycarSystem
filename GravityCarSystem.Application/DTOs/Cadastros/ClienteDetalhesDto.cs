using System;
using System.Collections.Generic;
using GravityCarSystem.Application.DTOs.Negocio;

namespace GravityCarSystem.Application.DTOs.Cadastros;

public class ClienteDetalhesDto : ClienteDto
{
    // Histórico de interações do cliente
    public List<VendaDto> VendasRealizadas { get; set; } = new();
    public List<VendaTrocaDto> VeiculosNaTroca { get; set; } = new();
}
