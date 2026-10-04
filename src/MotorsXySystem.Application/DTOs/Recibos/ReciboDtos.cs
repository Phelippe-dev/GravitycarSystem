using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using MotorsXySystem.Domain.Enums;

namespace MotorsXySystem.Application.DTOs.Recibos;

public enum FormaPagamentoRecibo
{
    AVista = 1,
    Pix = 2,
    Dinheiro = 3,
    Transferencia = 4,
    Financiado = 5,
    Entrada = 6,
    Troca = 7,
    Cartao = 8,
    Cheque = 9
}

public class PagamentoReciboDto
{
    public FormaPagamentoRecibo Forma { get; set; }
    [Range(0, 100_000_000)] public decimal Valor { get; set; }
    public string? Descricao { get; set; }
    // Financiamento
    public string? Banco { get; set; }
    public int? Parcelas { get; set; }
    public decimal? ValorParcela { get; set; }
    // Troca
    public string? VeiculoTrocaDescricao { get; set; }
    public string? VeiculoTrocaPlaca { get; set; }
}

public class CompradorReciboDto
{
    public string? Nome { get; set; }
    public string? CpfCnpj { get; set; }
    public string? Rg { get; set; }
    public string? Endereco { get; set; }
    public string? Telefone { get; set; }
    public string? Email { get; set; }
}

public class EmitirReciboRequest
{
    public TipoRecibo Tipo { get; set; } = TipoRecibo.Venda;
    public Guid? VendaId { get; set; }
    public Guid? ClienteId { get; set; }
    public Guid? VeiculoId { get; set; }

    /// <summary>Sobrescreve/complementa dados do cadastro do cliente.</summary>
    public CompradorReciboDto? Comprador { get; set; }

    [Range(0, 100_000_000)] public decimal ValorTotal { get; set; }
    public List<PagamentoReciboDto> Pagamentos { get; set; } = new();

    // === Sinal ===
    public int? ValidadeSinalDias { get; set; }
    public string? CondicoesSinal { get; set; }

    // === Garantia ===
    public int? GarantiaDias { get; set; } = 90;
    public int? GarantiaKm { get; set; }
    public string? TermosGarantia { get; set; }

    [MaxLength(2000)] public string? Observacoes { get; set; }
}

// =====================================================================
// Snapshot canônico (serializado em ReciboVenda.DadosJson e coberto pelo hash)
// =====================================================================
public record EmpresaSnapshot(string RazaoSocial, string NomeFantasia, string? Cnpj, string? InscricaoEstadual,
    string? Endereco, string? Cidade, string? Uf, string? Cep, string? Telefone, string? Email);

public record CompradorSnapshot(string Nome, string? CpfCnpj, string? Rg, string? Endereco, string? Telefone, string? Email);

public record VeiculoSnapshot(string Tipo, string? Placa, string? Renavam, string? Chassi, string Marca, string Modelo,
    string? Versao, short? AnoFabricacao, short? AnoModelo, string? Cor, int? Quilometragem, int? Cilindrada, string? Combustivel);

public record PagamentoSnapshot(string Forma, decimal Valor, string? Descricao, string? Banco, int? Parcelas,
    decimal? ValorParcela, string? VeiculoTrocaDescricao, string? VeiculoTrocaPlaca);

public record GarantiaSnapshot(int? Dias, int? Km, string Termos);

public record ReciboSnapshot(
    int Versao,
    string Numero,
    string Tipo,
    Guid EmpresaId,
    EmpresaSnapshot Empresa,
    CompradorSnapshot Comprador,
    VeiculoSnapshot Veiculo,
    decimal ValorTotal,
    decimal ValorRecebido,
    IReadOnlyList<PagamentoSnapshot> Pagamentos,
    GarantiaSnapshot Garantia,
    int? ValidadeSinalDias,
    string? CondicoesSinal,
    string? Observacoes,
    string? Vendedor);

public record ReciboResumoDto(Guid Id, string Numero, string Tipo, string CompradorNome, string VeiculoDescricao,
    decimal ValorTotal, decimal ValorRecebido, DateTime EmitidoEmUtc, string HashSha256, bool Cancelado,
    string StatusAssinatura, string? UrlAssinatura);
