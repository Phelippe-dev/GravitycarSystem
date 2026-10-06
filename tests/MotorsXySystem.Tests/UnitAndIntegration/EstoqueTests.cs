using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using MotorsXySystem.API.Controllers;
using MotorsXySystem.Application.DTOs;
using MotorsXySystem.Application.DTOs.Vendas;
using MotorsXySystem.Application.Interfaces;
using MotorsXySystem.Domain.Entidades.Veiculos;
using MotorsXySystem.Domain.Enums;
using MotorsXySystem.Infrastructure.Data;
using MotorsXySystem.Tests.Common;
using Xunit;

namespace MotorsXySystem.Tests.UnitAndIntegration;

public class EstoqueTests
{
    private readonly TestTenantService _tenantService;
    private readonly AppDbContext _context;
    private readonly Mock<IWebHostEnvironment> _envMock;
    private readonly VeiculosController _controller;

    public EstoqueTests()
    {
        _tenantService = new TestTenantService(TestSeedData.TenantAId);
        _context = TestDbFactory.CreateInMemoryDbContext(_tenantService);
        TestSeedData.PopularBancoDeTesteAsync(_context).GetAwaiter().GetResult();

        _envMock = new Mock<IWebHostEnvironment>();
        _controller = new VeiculosController(_context, _tenantService, _envMock.Object);
    }

    [Fact(DisplayName = "EST-01: Cadastro de veículo novo e seminovo com todos os campos")]
    public async Task EST01_CadastroVeiculoNovoESeminovo_Sucesso()
    {
        // Arrange
        var novoVeiculo = new VeiculoDto
        {
            Marca = "Hyundai",
            Modelo = "HB20",
            Versao = "Platinum Plus 1.0 TGDI",
            AnoFabricacao = 2026,
            AnoModelo = 2026,
            Placa = "HYU0H26",
            Cor = "Cinza Silk",
            Combustivel = "Flex",
            Cambio = "Automático",
            Quilometragem = 0,
            ValorCompra = 98000.00m,
            ValorVenda = 119900.00m,
            Status = 1,
            TipoVeiculo = (int)TipoVeiculo.Carro,
            Consignado = false,
            Chassi = "9BHBG41DDP0987654",
            Renavam = "12345678999"
        };

        // Act
        var result = await _controller.Criar(novoVeiculo);

        // Assert
        var created = Assert.IsType<CreatedAtActionResult>(result);
        Assert.NotNull(created.Value);

        var salvo = await _context.Veiculos.FirstOrDefaultAsync(v => v.Placa == "HYU0H26");
        Assert.NotNull(salvo);
        Assert.Equal("Hyundai", salvo.Marca);
        Assert.Equal(98000.00m, salvo.ValorCompra);
        Assert.Equal(119900.00m, salvo.ValorVenda);
        Assert.Equal(TestSeedData.TenantAId, salvo.EmpresaId);
    }

    [Fact(DisplayName = "EST-02: Chassi duplicado, inválido (≠17 caracteres, I/O/Q) ou em branco → deve bloquear")]
    public async Task EST02_ValidacaoChassi_DeveBloquearInvalidoOuDuplicado()
    {
        // 1. Chassi com menos de 17 caracteres
        var dtoChassiCurto = new VeiculoDto
        {
            Marca = "Fiat",
            Modelo = "Mobi",
            Chassi = "12345", // Inválido (5 caracteres)
            Placa = "MOB1A11",
            Status = 1
        };

        // 2. Chassi com caracteres proibidos pela ISO 3779 (I, O, Q)
        var dtoChassiLetrasProibidas = new VeiculoDto
        {
            Marca = "Fiat",
            Modelo = "Mobi",
            Chassi = "9BD123456I7890OQ1", // Letras I, O, Q
            Placa = "MOB1A12",
            Status = 1
        };

        // 3. Chassi duplicado (já existente no seed: V01 tem chassi 9BRBL30E8P0111111)
        var dtoChassiDuplicado = new VeiculoDto
        {
            Marca = "Toyota",
            Modelo = "Corolla Clone",
            Chassi = "9BRBL30E8P0111111", // Duplicado!
            Placa = "CLO0N00",
            Status = 1
        };

        // Executar
        var resCurto = await _controller.Criar(dtoChassiCurto);
        var resLetras = await _controller.Criar(dtoChassiLetrasProibidas);
        var resDup = await _controller.Criar(dtoChassiDuplicado);

        // AVALIAÇÃO DO RESULTADO:
        // O código de produção (VeiculosController:148-185) NÃO valida chassi!
        bool bloqueouCurto = resCurto is BadRequestObjectResult;
        bool bloqueouLetras = resLetras is BadRequestObjectResult;
        bool bloqueouDup = resDup is BadRequestObjectResult;

        Assert.True(bloqueouCurto && bloqueouLetras && bloqueouDup,
            $"BUG CRÍTICO DETECTADO: API aceitou chassi inválido ou duplicado sem validação. " +
            $"Status Curto: {resCurto.GetType().Name}, Status Letras Proibidas: {resLetras.GetType().Name}, Status Duplicado: {resDup.GetType().Name}");
    }

    [Fact(DisplayName = "EST-03: Placa e Renavam inválidos ou duplicados")]
    public async Task EST03_ValidacaoPlacaERenavam_DeveBloquear()
    {
        var dtoPlacaInvalida = new VeiculoDto
        {
            Marca = "VW",
            Modelo = "Polo",
            Placa = "PLACA_INVALIDA_12345",
            Renavam = "123", // Renavam inválido
            Chassi = "9BWAA123456789012",
            Status = 1
        };

        var dtoPlacaDuplicada = new VeiculoDto
        {
            Marca = "Toyota",
            Modelo = "Corolla Clone",
            Placa = "BRA2E26", // Duplicada
            Renavam = "12345678901", // Duplicado
            Chassi = "9BWAA123456789099",
            Status = 1
        };

        var resInvalida = await _controller.Criar(dtoPlacaInvalida);
        var resDuplicada = await _controller.Criar(dtoPlacaDuplicada);

        bool bloqueouInvalida = resInvalida is BadRequestObjectResult;
        bool bloqueouDuplicada = resDuplicada is BadRequestObjectResult;

        Assert.True(bloqueouInvalida && bloqueouDuplicada,
            $"BUG DETECTADO: API aceitou Placa/Renavam inválidos ou duplicados. " +
            $"Status Inválida: {resInvalida.GetType().Name}, Status Duplicada: {resDuplicada.GetType().Name}");
    }

    [Fact(DisplayName = "EST-04: Agregar custos (funilaria, higienização, laudo, comissão) → custo real por chassi recalculado, histórico preservado")]
    public async Task EST04_AgregarCustos_RecalculoEConsistencia()
    {
        var veiculoId = Guid.Parse("40000000-0000-0000-0000-000000000001"); // Corolla (ValorCompra = 150.000)
        
        var custo1 = new VeiculoCustoDto
        {
            Descricao = "Reparo no parachoque traseiro (Funilaria)",
            Valor = 1500.00m,
            DataCusto = DateTime.UtcNow
        };

        var custo2 = new VeiculoCustoDto
        {
            Descricao = "Higienização e polimento técnico",
            Valor = 800.00m,
            DataCusto = DateTime.UtcNow
        };

        // Act - Adicionar custos
        var res1 = _controller.AdicionarCusto(veiculoId, custo1);
        var res2 = _controller.AdicionarCusto(veiculoId, custo2);

        Assert.IsType<OkObjectResult>(res1);
        Assert.IsType<OkObjectResult>(res2);

        // Obter detalhes via API (GET /api/veiculos/{id}/detalhes)
        var detalhesResult = await _controller.ObterPorId(veiculoId);
        var okDetalhes = Assert.IsType<OkObjectResult>(detalhesResult);
        var detalhesDto = Assert.IsType<VeiculoDetalhesDto>(okDetalhes.Value);

        // BUG: VeiculosController:324-328 gera Id em memória e NÃO salva no DbContext!
        bool custosPersistidos = detalhesDto.Custos != null && detalhesDto.Custos.Count >= 2;

        Assert.True(custosPersistidos,
            $"BUG CRÍTICO DETECTADO: Custos não foram persistidos no banco de dados. " +
            $"VeiculosController.AdicionarCusto retorna fake em memória e não persiste entidade no AppDbContext. " +
            $"Custos encontrados: {detalhesDto.Custos?.Count ?? 0}");
    }

    [Fact(DisplayName = "EST-05: Editar/excluir custo já lançado → recalcula e gera auditoria")]
    public void EST05_EditarExcluirCustoEAuditoria_DeveExistir()
    {
        var methodEditarCusto = typeof(VeiculosController).GetMethod("AtualizarCusto");
        var methodExcluirCusto = typeof(VeiculosController).GetMethod("ExcluirCusto");

        Assert.True(methodEditarCusto != null && methodExcluirCusto != null,
            "BUG / MÓDULO AUSENTE: VeiculosController não possui métodos AtualizarCusto ou ExcluirCusto. " +
            "Não há suporte para edição ou cancelamento de despesas de estoque com trilha de auditoria.");
    }

    [Fact(DisplayName = "EST-06: Entrada por troca e por consignação → titularidade correta; consignado sem custo de aquisição")]
    public async Task EST06_EntradaTrocaEConsignacao_TitularidadeECusto()
    {
        // Consignado no seed: V03 (BMW 320i)
        var consignado = await _context.Veiculos.FirstOrDefaultAsync(v => v.Consignado);
        Assert.NotNull(consignado);
        Assert.True(consignado.Consignado);
        Assert.Equal(0.00m, consignado.ValorCompra);

        // Entrada por troca: verificar criação de veículo de troca via Venda
        var vendasController = new VendasController(_context);
        var vendaTrocaDto = new VendaDto
        {
            ClienteId = Guid.Parse("30000000-0000-0000-0000-000000000001"),
            UsuarioId = Guid.Parse("10000000-0000-0000-0000-000000000001"),
            VeiculosIds = new List<Guid> { Guid.Parse("40000000-0000-0000-0000-000000000002") }, // Civic 142k
            Desconto = 0,
            Trocas = new List<VendaTrocaDto>
            {
                new VendaTrocaDto
                {
                    Marca = "Ford",
                    Modelo = "Ka",
                    Versao = "1.0 SE",
                    AnoFabricacao = 2019,
                    AnoModelo = 2020,
                    Placa = "FOR1K20",
                    ValorAvaliacao = 35000.00m
                }
            },
            Pagamentos = new List<VendaPagamentoDto>
            {
                new VendaPagamentoDto { Metodo = "dinheiro", Valor = 107000.00m }
            }
        };

        var resVenda = await vendasController.Criar(vendaTrocaDto);
        Assert.IsType<OkObjectResult>(resVenda);

        // Veículo de troca gerado
        var veiculoTroca = await _context.Veiculos.FirstOrDefaultAsync(v => v.Placa == "FOR1K20");
        Assert.NotNull(veiculoTroca);
        Assert.Equal(35000.00m, veiculoTroca.ValorCompra);
        Assert.Equal(TestSeedData.TenantAId, veiculoTroca.EmpresaId);

        // Testar estorno da venda: veículo de troca deve ser revertido/cancelado
        var okVenda = (OkObjectResult)resVenda;
        var vendaCriada = (VendaDto)okVenda.Value!;
        await vendasController.Cancelar(vendaCriada.Id!.Value);

        var veiculoTrocaAposCancelamento = await _context.Veiculos.FirstOrDefaultAsync(v => v.Placa == "FOR1K20");
        bool trocaFoiRevertida = veiculoTrocaAposCancelamento == null || !veiculoTrocaAposCancelamento.Ativo;

        Assert.True(trocaFoiRevertida,
            "BUG DETECTADO: Ao cancelar venda com veículo de troca, o veículo entrado como troca permanece ativo no estoque sem estorno.");
    }

    [Fact(DisplayName = "EST-07: Reserva expira e libera automaticamente")]
    public async Task EST07_ReservaExpiraELiberaAutomaticamente()
    {
        var veiculoReservado = await _context.Veiculos.FindAsync(Guid.Parse("40000000-0000-0000-0000-000000000006"));
        Assert.NotNull(veiculoReservado);
        Assert.Equal(5, veiculoReservado.Status);

        var propValidadeReserva = typeof(Veiculo).GetProperty("DataExpiracaoReserva") 
                                  ?? typeof(Veiculo).GetProperty("ReservaValidaAte");

        Assert.True(propValidadeReserva != null,
            "REGRA AMBÍGUA / NÃO IMPLEMENTADO: Não existe campo de expiração de reserva na entidade Veiculo, " +
            "nem serviço agendado (HostedService/Worker) para liberação automática de veículos com reserva vencida.");
    }

    [Fact(DisplayName = "EST-08: Concorrência: 2 requisições simultâneas reservando/vendendo o mesmo veículo → só uma vence")]
    public async Task EST08_ConcorrenciaVendaMesmoVeiculo_ApenasUmaDeveVencer()
    {
        var veiculoId = Guid.Parse("40000000-0000-0000-0000-000000000001");

        var vendaDto1 = new VendaDto
        {
            ClienteId = Guid.Parse("30000000-0000-0000-0000-000000000001"),
            UsuarioId = Guid.Parse("10000000-0000-0000-0000-000000000001"),
            VeiculosIds = new List<Guid> { veiculoId },
            Desconto = 0,
            Pagamentos = new List<VendaPagamentoDto>
            {
                new VendaPagamentoDto { Metodo = "dinheiro", Valor = 185000.00m }
            }
        };

        var vendaDto2 = new VendaDto
        {
            ClienteId = Guid.Parse("30000000-0000-0000-0000-000000000002"),
            UsuarioId = Guid.Parse("10000000-0000-0000-0000-000000000001"),
            VeiculosIds = new List<Guid> { veiculoId },
            Desconto = 0,
            Pagamentos = new List<VendaPagamentoDto>
            {
                new VendaPagamentoDto { Metodo = "dinheiro", Valor = 185000.00m }
            }
        };

        var ctx1 = TestDbFactory.CreateInMemoryDbContext(_tenantService, "DbConcorrencia");
        await TestSeedData.PopularBancoDeTesteAsync(ctx1);
        var controller1 = new VendasController(ctx1);

        var ctx2 = TestDbFactory.CreateInMemoryDbContext(_tenantService, "DbConcorrencia");
        var controller2 = new VendasController(ctx2);

        var task1 = Task.Run(() => controller1.Criar(vendaDto1));
        var task2 = Task.Run(() => controller2.Criar(vendaDto2));

        var results = await Task.WhenAll(task1, task2);
        int vendasComSucesso = results.Count(r => r is OkObjectResult);

        Assert.True(vendasComSucesso == 1,
            $"BUG CRÍTICO DE CONCORRÊNCIA: {vendasComSucesso} requisições concluíram a venda simultânea do mesmo veículo! " +
            $"Não há bloqueio de concorrência pessimista nem controle otimista de concorrência (RowVersion) em VendasController.");
    }

    [Fact(DisplayName = "EST-09: FIPE e ficha técnica por placa, incluindo falha da API externa")]
    public async Task EST09_FipePorPlacaEFalhaExterna_TratamentoResiliente()
    {
        var fipeMock = new Mock<IFipeService>();
        
        fipeMock.Setup(s => s.ObterPrecoAsync(It.IsAny<TipoVeiculo>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), default))
            .ThrowsAsync(new System.Net.Http.HttpRequestException("API FIPE indisponível (503 Service Unavailable)"));

        var fipeController = new FipeController(fipeMock.Object);
        var exception = await Record.ExceptionAsync(() => fipeController.ObterPreco("1", "1", "2026-1", 1));

        Assert.Null(exception);
    }
}
