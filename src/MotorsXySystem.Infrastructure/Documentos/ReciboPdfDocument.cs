using System;
using System.Globalization;
using System.Linq;
using MotorsXySystem.Application.DTOs.Recibos;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace MotorsXySystem.Infrastructure.Documentos;

/// <summary>Layout do Recibo de Venda / Recibo de Sinal (A4) com bloco de autenticidade SHA-256.</summary>
public static class ReciboPdfDocument
{
    private static readonly CultureInfo PtBr = new("pt-BR");
    private const string CorPrimaria = "#0F172A";
    private const string CorDestaque = "#2563EB";
    private const string CorBorda = "#CBD5E1";

    public static byte[] Gerar(ReciboSnapshot r, string hash, DateTime emitidoEmUtc, string urlVerificacao)
    {
        var titulo = r.Tipo == "Sinal" ? "RECIBO DE SINAL / ARRAS" : "RECIBO DE COMPRA E VENDA DE VEÍCULO";
        var emitidoLocal = TimeZoneInfo.ConvertTimeFromUtc(emitidoEmUtc, FusoBrasilia());

        return Document.Create(doc =>
        {
            doc.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(32);
                page.DefaultTextStyle(t => t.FontSize(9.5f).FontColor(CorPrimaria));

                // ===== Cabeçalho =====
                page.Header().Column(col =>
                {
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text(r.Empresa.NomeFantasia).FontSize(16).Bold().FontColor(CorDestaque);
                            c.Item().Text(r.Empresa.RazaoSocial).SemiBold();
                            c.Item().Text($"CNPJ: {r.Empresa.Cnpj ?? "-"}" + (string.IsNullOrEmpty(r.Empresa.InscricaoEstadual) ? "" : $"   IE: {r.Empresa.InscricaoEstadual}"));
                            var end = string.Join(" - ", new[] { r.Empresa.Endereco, Cidade(r.Empresa.Cidade, r.Empresa.Uf), r.Empresa.Cep }.Where(s => !string.IsNullOrWhiteSpace(s)));
                            if (end.Length > 0) c.Item().Text(end).FontSize(8.5f);
                            var contato = string.Join("  |  ", new[] { r.Empresa.Telefone, r.Empresa.Email }.Where(s => !string.IsNullOrWhiteSpace(s)));
                            if (contato.Length > 0) c.Item().Text(contato).FontSize(8.5f);
                        });
                        row.ConstantItem(150).AlignRight().Column(c =>
                        {
                            c.Item().AlignRight().Text($"Nº {r.Numero}").Bold().FontSize(11);
                            c.Item().AlignRight().Text($"Emitido em {emitidoLocal:dd/MM/yyyy HH:mm}").FontSize(8.5f);
                            c.Item().PaddingTop(6).AlignRight().Background(CorDestaque).PaddingHorizontal(8).PaddingVertical(4)
                                .Text(Moeda(r.Tipo == "Sinal" ? r.ValorRecebido : r.ValorTotal)).FontColor(Colors.White).Bold().FontSize(12);
                        });
                    });
                    col.Item().PaddingVertical(8).LineHorizontal(1.5f).LineColor(CorDestaque);
                    col.Item().AlignCenter().Text(titulo).FontSize(13).Bold();
                });

                // ===== Conteúdo =====
                page.Content().PaddingTop(10).Column(col =>
                {
                    col.Spacing(10);

                    Titulo(col, "COMPRADOR");
                    col.Item().Element(Secao).Table(t =>
                    {
                        Colunas(t);
                        Campo(t, "Nome / Razão Social", r.Comprador.Nome, 3);
                        Campo(t, "CPF / CNPJ", r.Comprador.CpfCnpj);
                        Campo(t, "RG", r.Comprador.Rg);
                        Campo(t, "Telefone", r.Comprador.Telefone);
                        Campo(t, "E-mail", r.Comprador.Email, 2);
                        Campo(t, "Endereço", r.Comprador.Endereco, 4);
                    });

                    Titulo(col, "VEÍCULO");
                    col.Item().Element(Secao).Table(t =>
                    {
                        Colunas(t);
                        Campo(t, "Marca / Modelo / Versão", $"{r.Veiculo.Marca} {r.Veiculo.Modelo} {r.Veiculo.Versao}".Trim(), 3);
                        Campo(t, "Tipo", r.Veiculo.Tipo + (r.Veiculo.Cilindrada.HasValue ? $" · {r.Veiculo.Cilindrada} cc" : ""));
                        Campo(t, "Placa", r.Veiculo.Placa);
                        Campo(t, "RENAVAM", r.Veiculo.Renavam);
                        Campo(t, "Chassi", r.Veiculo.Chassi, 2);
                        Campo(t, "Ano Fab./Modelo", $"{r.Veiculo.AnoFabricacao}/{r.Veiculo.AnoModelo}");
                        Campo(t, "Cor", r.Veiculo.Cor);
                        Campo(t, "Combustível", r.Veiculo.Combustivel);
                        Campo(t, "Quilometragem", r.Veiculo.Quilometragem.HasValue ? $"{r.Veiculo.Quilometragem.Value.ToString("N0", PtBr)} km" : null);
                    });

                    Titulo(col, "FORMA DE PAGAMENTO");
                    col.Item().Element(Secao).Table(t =>
                    {
                        t.ColumnsDefinition(cd => { cd.RelativeColumn(2); cd.RelativeColumn(4); cd.RelativeColumn(2); });
                        t.Header(h =>
                        {
                            foreach (var cab in new[] { "Forma", "Detalhes", "Valor" })
                                h.Cell().Background("#F1F5F9").Padding(4).Text(cab).SemiBold().FontSize(8.5f);
                        });
                        foreach (var p in r.Pagamentos)
                        {
                            t.Cell().BorderBottom(0.5f).BorderColor(CorBorda).Padding(4).Text(p.Forma);
                            t.Cell().BorderBottom(0.5f).BorderColor(CorBorda).Padding(4).Text(DetalhePagamento(p)).FontSize(8.5f);
                            t.Cell().BorderBottom(0.5f).BorderColor(CorBorda).Padding(4).AlignRight().Text(Moeda(p.Valor));
                        }
                        t.Cell().ColumnSpan(2).Padding(4).AlignRight().Text("Total recebido").Bold();
                        t.Cell().Padding(4).AlignRight().Text(Moeda(r.ValorRecebido)).Bold();
                        if (r.Tipo == "Sinal")
                        {
                            t.Cell().ColumnSpan(2).Padding(4).AlignRight().Text("Valor total do negócio");
                            t.Cell().Padding(4).AlignRight().Text(Moeda(r.ValorTotal));
                            t.Cell().ColumnSpan(2).Padding(4).AlignRight().Text("Saldo a pagar");
                            t.Cell().Padding(4).AlignRight().Text(Moeda(r.ValorTotal - r.ValorRecebido)).Bold();
                        }
                    });

                    Titulo(col, "DECLARAÇÃO");
                    col.Item().Element(Secao).Text(Declaracao(r)).Justify();

                    if (r.Tipo == "Sinal")
                    {
                        Titulo(col, "CONDIÇÕES DO SINAL");
                        col.Item().Element(Secao).Text(
                            $"O presente sinal tem validade de {r.ValidadeSinalDias} dia(s) a contar desta data, período em que o veículo " +
                            "permanecerá reservado ao comprador. Aplicam-se os arts. 417 a 420 do Código Civil: desistindo o comprador, " +
                            "perderá o sinal em favor da vendedora; desistindo a vendedora, devolverá o sinal em dobro. " +
                            (r.CondicoesSinal ?? "")).Justify();
                    }
                    else
                    {
                        Titulo(col, "TERMOS DE GARANTIA");
                        col.Item().Element(Secao).Column(g =>
                        {
                            var prazo = string.Join(" ou ", new[]
                            {
                                r.Garantia.Dias.HasValue ? $"{r.Garantia.Dias} dias" : null,
                                r.Garantia.Km.HasValue ? $"{r.Garantia.Km.Value.ToString("N0", PtBr)} km" : null
                            }.Where(s => s != null));
                            if (prazo.Length > 0) g.Item().Text($"Prazo: {prazo} (o que ocorrer primeiro).").SemiBold();
                            g.Item().Text(r.Garantia.Termos).Justify();
                        });
                    }

                    if (!string.IsNullOrWhiteSpace(r.Observacoes))
                    {
                        Titulo(col, "OBSERVAÇÕES");
                        col.Item().Element(Secao).Text(r.Observacoes);
                    }

                    // ===== Assinaturas =====
                    col.Item().PaddingTop(28).Row(row =>
                    {
                        row.RelativeItem().Column(c => Assinatura(c, r.Empresa.RazaoSocial, $"CNPJ {r.Empresa.Cnpj} — Vendedora"));
                        row.ConstantItem(30);
                        row.RelativeItem().Column(c => Assinatura(c, r.Comprador.Nome, $"CPF/CNPJ {r.Comprador.CpfCnpj} — Comprador"));
                    });
                    col.Item().AlignCenter().Text($"{Cidade(r.Empresa.Cidade, r.Empresa.Uf) ?? ""}{(r.Empresa.Cidade != null ? ", " : "")}{emitidoLocal.ToString("dd 'de' MMMM 'de' yyyy", PtBr)}").FontSize(8.5f);
                });

                // ===== Rodapé de autenticidade =====
                page.Footer().Column(col =>
                {
                    col.Item().Border(0.75f).BorderColor(CorBorda).Background("#F8FAFC").Padding(6).Column(c =>
                    {
                        c.Item().Text("AUTENTICIDADE DO DOCUMENTO").Bold().FontSize(7.5f).FontColor(CorDestaque);
                        c.Item().Text(t =>
                        {
                            t.DefaultTextStyle(s => s.FontSize(7));
                            t.Span("SHA-256: ").SemiBold();
                            t.Span(hash).FontFamily(Fonts.CourierNew);
                        });
                        c.Item().Text(t =>
                        {
                            t.DefaultTextStyle(s => s.FontSize(7));
                            t.Span("Carimbo de tempo (UTC): ").SemiBold();
                            t.Span(emitidoEmUtc.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"));
                            t.Span("   Verifique em: ").SemiBold();
                            t.Span(urlVerificacao).FontColor(CorDestaque);
                        });
                    });
                    col.Item().PaddingTop(3).AlignRight().Text(t =>
                    {
                        t.DefaultTextStyle(s => s.FontSize(7).FontColor(Colors.Grey.Medium));
                        t.Span("Página ");
                        t.CurrentPageNumber();
                        t.Span(" de ");
                        t.TotalPages();
                    });
                });
            });
        }).GeneratePdf();
    }

    // ------------------------------------------------------------------

    private static IContainer Secao(IContainer c) => c.BorderLeft(2.5f).BorderColor(CorDestaque).PaddingLeft(8);

    private static void Titulo(ColumnDescriptor col, string titulo)
        => col.Item().PaddingTop(4).Text(titulo).Bold().FontSize(8.5f).FontColor(CorDestaque).LetterSpacing(0.05f);

    private static string Declaracao(ReciboSnapshot r)
    {
        var veic = $"{r.Veiculo.Marca} {r.Veiculo.Modelo} {r.Veiculo.Versao}".Trim();
        return r.Tipo == "Sinal"
            ? $"{r.Empresa.RazaoSocial}, inscrita no CNPJ {r.Empresa.Cnpj}, declara ter recebido de {r.Comprador.Nome}, CPF/CNPJ {r.Comprador.CpfCnpj}, " +
              $"a importância de {Moeda(r.ValorRecebido)} a título de sinal e princípio de pagamento para aquisição do veículo {veic}, " +
              $"placa {r.Veiculo.Placa ?? "-"}, chassi {r.Veiculo.Chassi ?? "-"}, cujo valor total ajustado é de {Moeda(r.ValorTotal)}."
            : $"{r.Empresa.RazaoSocial}, inscrita no CNPJ {r.Empresa.Cnpj}, declara ter recebido de {r.Comprador.Nome}, CPF/CNPJ {r.Comprador.CpfCnpj}, " +
              $"a importância de {Moeda(r.ValorRecebido)}, referente à venda do veículo {veic}, placa {r.Veiculo.Placa ?? "-"}, " +
              $"RENAVAM {r.Veiculo.Renavam ?? "-"}, chassi {r.Veiculo.Chassi ?? "-"}, dando plena e geral quitação do valor acima, " +
              "comprometendo-se a entregar a documentação necessária à transferência junto ao DETRAN. A partir da entrega, o comprador " +
              "assume integral responsabilidade civil, criminal e administrativa (multas e infrações) sobre o veículo.";
    }

    private static string DetalhePagamento(PagamentoSnapshot p)
    {
        var partes = new[]
        {
            p.Descricao,
            p.Banco != null ? $"Banco: {p.Banco}" : null,
            p.Parcelas.HasValue ? $"{p.Parcelas}x de {Moeda(p.ValorParcela ?? 0)}" : null,
            p.VeiculoTrocaDescricao != null ? $"Veículo: {p.VeiculoTrocaDescricao}" : null,
            p.VeiculoTrocaPlaca != null ? $"Placa: {p.VeiculoTrocaPlaca}" : null
        };
        var s = string.Join(" · ", partes.Where(x => !string.IsNullOrWhiteSpace(x)));
        return s.Length > 0 ? s : "-";
    }

    private static void Colunas(TableDescriptor t) => t.ColumnsDefinition(cd => { for (var i = 0; i < 4; i++) cd.RelativeColumn(); });

    private static void Campo(TableDescriptor t, string rotulo, string? valor, uint span = 1)
    {
        t.Cell().ColumnSpan(span).Border(0.5f).BorderColor(CorBorda).Padding(4).Column(c =>
        {
            c.Item().Text(rotulo).FontSize(7).FontColor(Colors.Grey.Darken1);
            c.Item().Text(string.IsNullOrWhiteSpace(valor) ? "-" : valor).SemiBold();
        });
    }

    private static void Assinatura(ColumnDescriptor c, string nome, string doc)
    {
        c.Item().LineHorizontal(0.75f).LineColor(CorPrimaria);
        c.Item().PaddingTop(3).AlignCenter().Text(nome).SemiBold().FontSize(8.5f);
        c.Item().AlignCenter().Text(doc).FontSize(7.5f);
    }

    private static string Moeda(decimal v) => v.ToString("C", PtBr);

    private static string? Cidade(string? cidade, string? uf)
        => string.IsNullOrWhiteSpace(cidade) ? null : string.IsNullOrWhiteSpace(uf) ? cidade : $"{cidade}/{uf}";

    private static TimeZoneInfo FusoBrasilia()
    {
        try { return TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo"); }
        catch { return TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time"); }
    }
}
