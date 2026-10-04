using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MotorsXySystem.Application.DTOs.Recibos;
using MotorsXySystem.Application.Interfaces;
using MotorsXySystem.Domain.Entidades.Documentos;
using MotorsXySystem.Domain.Enums;
using MotorsXySystem.Infrastructure.Data;
using MotorsXySystem.Infrastructure.Documentos;

namespace MotorsXySystem.Infrastructure.Servicos;

public class ReciboService : IReciboService
{
    public const string TermoGarantiaPadrao =
        "Garantia legal de 90 (noventa) dias para motor e câmbio, conforme art. 26, II, do Código de Defesa do Consumidor, " +
        "contados da data da entrega do veículo. Não estão cobertos itens de desgaste natural (pneus, freios, embreagem, " +
        "bateria, lâmpadas, palhetas, suspensão), danos por mau uso, acidentes, alterações ou manutenção realizada fora das " +
        "recomendações do fabricante. O comprador declara ter vistoriado o veículo e recebê-lo no estado em que se encontra.";

    public static readonly JsonSerializerOptions JsonCanonico = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
        DefaultIgnoreCondition = JsonIgnoreCondition.Never
    };

    private readonly AppDbContext _db;
    private readonly ICurrentTenantService _tenant;
    private readonly IConfiguration _config;

    public ReciboService(AppDbContext db, ICurrentTenantService tenant, IConfiguration config)
    {
        _db = db;
        _tenant = tenant;
        _config = config;
    }

    public async Task<ReciboVenda> EmitirAsync(EmitirReciboRequest req, Guid? usuarioId, CancellationToken ct = default)
    {
        var empresaId = _tenant.ObterEmpresaId() ?? throw new InvalidOperationException("Tenant não identificado.");
        var empresa = await _db.Empresas.AsNoTracking().FirstAsync(e => e.Id == empresaId, ct);

        // ---- Origem dos dados: venda existente ou cliente + veículo informados ----
        Guid? clienteId = req.ClienteId, veiculoId = req.VeiculoId;
        decimal valorTotal = req.ValorTotal;
        if (req.VendaId.HasValue)
        {
            var venda = await _db.Vendas.Include(v => v.Veiculos).FirstOrDefaultAsync(v => v.Id == req.VendaId, ct)
                        ?? throw new ArgumentException("Venda não encontrada.");
            clienteId ??= venda.ClienteId;
            veiculoId ??= venda.Veiculos.Select(v => (Guid?)v.VeiculoId).FirstOrDefault();
            if (valorTotal <= 0) valorTotal = venda.ValorTotalFinal;
        }

        var cliente = clienteId.HasValue ? await _db.Clientes.AsNoTracking().FirstOrDefaultAsync(c => c.Id == clienteId, ct) : null;
        var veiculo = veiculoId.HasValue ? await _db.Veiculos.AsNoTracking().FirstOrDefaultAsync(v => v.Id == veiculoId, ct) : null;
        if (veiculo == null) throw new ArgumentException("Veículo é obrigatório no recibo.");

        var c = req.Comprador ?? new CompradorReciboDto();
        var comprador = new CompradorSnapshot(
            Nome: Primeiro(c.Nome, cliente?.Nome) ?? throw new ArgumentException("Nome do comprador é obrigatório."),
            CpfCnpj: Primeiro(c.CpfCnpj, cliente?.CpfCnpj) ?? throw new ArgumentException("CPF/CNPJ do comprador é obrigatório."),
            Rg: Primeiro(c.Rg, cliente?.Rg),
            Endereco: Primeiro(c.Endereco, cliente?.EnderecoCompleto),
            Telefone: Primeiro(c.Telefone, cliente?.Telefone),
            Email: Primeiro(c.Email, cliente?.Email));

        if (req.Pagamentos.Count == 0) throw new ArgumentException("Informe ao menos uma forma de pagamento.");
        var pagamentos = req.Pagamentos.Select(p => new PagamentoSnapshot(
            NomeForma(p.Forma), Math.Round(p.Valor, 2), p.Descricao, p.Banco, p.Parcelas, p.ValorParcela,
            p.VeiculoTrocaDescricao, p.VeiculoTrocaPlaca)).ToList();
        var valorRecebido = pagamentos.Sum(p => p.Valor);
        if (valorTotal <= 0) valorTotal = valorRecebido;
        if (req.Tipo == TipoRecibo.Venda && valorRecebido != valorTotal)
            throw new ArgumentException($"Soma dos pagamentos ({valorRecebido:N2}) difere do valor total ({valorTotal:N2}).");

        var vendedor = usuarioId.HasValue
            ? await _db.Usuarios.AsNoTracking().Where(u => u.Id == usuarioId).Select(u => u.Nome).FirstOrDefaultAsync(ct)
            : null;

        var emitidoEm = TruncarMs(DateTime.UtcNow);
        var numero = await ProximoNumeroAsync(emitidoEm.Year, ct);

        var snapshot = new ReciboSnapshot(
            Versao: 1,
            Numero: numero,
            Tipo: req.Tipo.ToString(),
            EmpresaId: empresaId,
            Empresa: new EmpresaSnapshot(empresa.RazaoSocial, empresa.NomeFantasia, empresa.Cnpj, empresa.InscricaoEstadual,
                empresa.Endereco, empresa.Cidade, empresa.Uf, empresa.Cep, empresa.Telefone, empresa.Email),
            Comprador: comprador,
            Veiculo: new VeiculoSnapshot(veiculo.Tipo.ToString(), veiculo.Placa, veiculo.Renavam, veiculo.Chassi, veiculo.Marca,
                veiculo.Modelo, veiculo.Versao, veiculo.AnoFabricacao, veiculo.AnoModelo, veiculo.Cor, veiculo.Quilometragem,
                veiculo.Tipo.EhDuasRodas() ? veiculo.Cilindrada : null, veiculo.Combustivel),
            ValorTotal: Math.Round(valorTotal, 2),
            ValorRecebido: valorRecebido,
            Pagamentos: pagamentos,
            Garantia: new GarantiaSnapshot(req.GarantiaDias, req.GarantiaKm,
                Primeiro(req.TermosGarantia, empresa.TermoGarantiaPadrao) ?? TermoGarantiaPadrao),
            ValidadeSinalDias: req.Tipo == TipoRecibo.Sinal ? req.ValidadeSinalDias ?? 7 : null,
            CondicoesSinal: req.Tipo == TipoRecibo.Sinal ? req.CondicoesSinal : null,
            Observacoes: req.Observacoes,
            Vendedor: vendedor);

        var json = JsonSerializer.Serialize(snapshot, JsonCanonico);
        var hash = CalcularHash(json, emitidoEm);

        var urlVerificacao = $"{(_config["App:PublicUrl"] ?? "").TrimEnd('/')}/verificar/{hash}";
        var pdf = ReciboPdfDocument.Gerar(snapshot, hash, emitidoEm, urlVerificacao);

        var recibo = new ReciboVenda
        {
            EmpresaId = empresaId,
            Numero = numero,
            Tipo = req.Tipo,
            VendaId = req.VendaId,
            ClienteId = clienteId,
            VeiculoId = veiculo.Id,
            ValorTotal = snapshot.ValorTotal,
            ValorRecebido = valorRecebido,
            DadosJson = json,
            HashSha256 = hash,
            EmitidoEmUtc = emitidoEm,
            EmitidoPorId = usuarioId,
            Pdf = pdf,
            PdfSha256 = Sha256Hex(pdf)
        };
        _db.Recibos.Add(recibo);
        await _db.SaveChangesAsync(ct);
        return recibo;
    }

    public bool VerificarIntegridade(ReciboVenda recibo)
        => CryptographicOperations.FixedTimeEquals(
            Encoding.ASCII.GetBytes(CalcularHash(recibo.DadosJson, recibo.EmitidoEmUtc)),
            Encoding.ASCII.GetBytes(recibo.HashSha256))
           && Sha256Hex(recibo.Pdf) == recibo.PdfSha256;

    // ------------------------------------------------------------------

    /// <summary>SHA-256( snapshotJson + "|" + timestamp ISO-8601 UTC com milissegundos ).</summary>
    public static string CalcularHash(string json, DateTime emitidoEmUtc)
        => Sha256Hex(Encoding.UTF8.GetBytes($"{json}|{emitidoEmUtc.ToUniversalTime():yyyy-MM-ddTHH:mm:ss.fffZ}"));

    public static string Sha256Hex(byte[] dados) => Convert.ToHexString(SHA256.HashData(dados)).ToLowerInvariant();

    private async Task<string> ProximoNumeroAsync(int ano, CancellationToken ct)
    {
        var prefixo = $"REC-{ano}-";
        var ultimo = await _db.Recibos.Where(r => r.Numero.StartsWith(prefixo))
            .OrderByDescending(r => r.Numero).Select(r => r.Numero).FirstOrDefaultAsync(ct);
        var seq = ultimo != null && int.TryParse(ultimo[prefixo.Length..], out var n) ? n + 1 : 1;
        return $"{prefixo}{seq:D6}";
    }

    private static DateTime TruncarMs(DateTime d) => new(d.Ticks - d.Ticks % TimeSpan.TicksPerMillisecond, DateTimeKind.Utc);

    private static string? Primeiro(params string?[] valores) => valores.FirstOrDefault(v => !string.IsNullOrWhiteSpace(v))?.Trim();

    private static string NomeForma(FormaPagamentoRecibo f) => f switch
    {
        FormaPagamentoRecibo.AVista => "À vista",
        FormaPagamentoRecibo.Pix => "PIX",
        FormaPagamentoRecibo.Dinheiro => "Dinheiro",
        FormaPagamentoRecibo.Transferencia => "Transferência/TED",
        FormaPagamentoRecibo.Financiado => "Financiamento",
        FormaPagamentoRecibo.Entrada => "Entrada",
        FormaPagamentoRecibo.Troca => "Veículo na troca",
        FormaPagamentoRecibo.Cartao => "Cartão",
        FormaPagamentoRecibo.Cheque => "Cheque",
        _ => f.ToString()
    };
}
