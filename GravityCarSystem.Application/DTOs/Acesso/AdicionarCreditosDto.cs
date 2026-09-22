using System;

namespace GravityCarSystem.Application.DTOs.Acesso;

public record AdicionarCreditosDto(int Quantidade, decimal ValorPago, string Observacao = "Recarga manual");
