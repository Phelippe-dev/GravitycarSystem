using System;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using Microsoft.EntityFrameworkCore;
using GravityCarSystem.Infrastructure.Data;
using GravityCarSystem.Domain.Entities.Acesso;
using GravityCarSystem.Domain.Entities.Cadastros;
using GravityCarSystem.Domain.Entities.Negocio;
using GravityCarSystem.Domain.Entities.Veiculos;
using GravityCarSystem.Domain.Entities.Financeiro;
using GravityCarSystem.Domain.Enums;
using GravityCarSystem.Application.Interfaces;

namespace GravityCarSystem.Tests;

public class DummyTenantService : ICurrentTenantService
{
    public Guid TenantId { get; set; } = Guid.Empty;
    public Guid? GetEmpresaId() => TenantId == Guid.Empty ? null : TenantId;
    public Guid? GetUsuarioId() => null;
}

public class DatabaseIntegrationTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly DummyTenantService _tenantService;
    private readonly string _connectionString = "Host=localhost;Port=5433;Database=gravitycarsystem_test;Username=gravity_user;Password=Gravity@2024!Seguro";

    public DatabaseIntegrationTests()
    {
        _tenantService = new DummyTenantService();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_connectionString)
            .Options;
        
        _context = new AppDbContext(options, _tenantService);
    }

    [Fact]
    public async Task Deve_Executar_Fluxo_Completo_Banco_Dados()
    {
        await _context.Database.EnsureDeletedAsync();
        await _context.Database.EnsureCreatedAsync();

        // 1. Empresa (Tenant)
        var empresa = new Empresa 
        { 
            Id = Guid.NewGuid(), 
            RazaoSocial = "Empresa Teste Integracao", 
            NomeFantasia = "Teste Auto", 
            Cnpj = "11222333000144",
            Ativa = true
        };
        _context.Empresas.Add(empresa);
        await _context.SaveChangesAsync();
        
        _tenantService.TenantId = empresa.Id; // Seta o tenant na sessao simulada

        // 2. Funcionario (Usuario e Perfil)
        var perfil = await _context.Perfis.FirstOrDefaultAsync(p => p.Nome == "Vendedor");
        if (perfil == null) 
        {
            perfil = new Perfil { Id = Guid.NewGuid(), Nome = "Vendedor", Descricao = "Vendedor" };
            _context.Perfis.Add(perfil);
            await _context.SaveChangesAsync();
        }

        var funcionario = new Usuario 
        { 
            Id = Guid.NewGuid(), 
            EmpresaId = empresa.Id,
            Nome = "Vendedor Teste",
            Email = $"vendedor{Guid.NewGuid()}@teste.com",
            SenhaHash = "hash123",
            Cargo = "Vendedor",
            Ativo = true
        };
        _context.Usuarios.Add(funcionario);
        _context.UsuarioPerfis.Add(new UsuarioPerfil { UsuarioId = funcionario.Id, PerfilId = perfil.Id });
        await _context.SaveChangesAsync();

        // 3. Cliente
        var cliente = new Cliente 
        { 
            Id = Guid.NewGuid(), 
            EmpresaId = empresa.Id,
            TipoPessoa = TipoPessoa.Fisica,
            NomeRazaoSocial = "Cliente Comprador Teste",
            CpfCnpj = "11122233344",
            Celular = "11999999999",
            Email = "cliente@teste.com",
            Ativo = true
        };
        _context.Clientes.Add(cliente);
        await _context.SaveChangesAsync();

        // 4. Veiculo (Com fotos e custos)
        var veiculo = new Veiculo 
        { 
            Id = Guid.NewGuid(), 
            EmpresaId = empresa.Id,
            Marca = "Toyota",
            Modelo = "Corolla",
            AnoFabricacao = 2023,
            AnoModelo = 2024,
            Placa = "XYZ1234",
            Renavam = "12345678901",
            Chassi = "9BW12345678901234",
            ValorCompra = 100000m,
            ValorVenda = 120000m,
            Status = StatusVeiculo.Disponivel,
            Cor = "Preto",
            Combustivel = "Flex",
            Cambio = "Automático",
            Quilometragem = 15000
        };
        
        var foto = new VeiculoFoto { Id = Guid.NewGuid(), VeiculoId = veiculo.Id, Url = "/img/teste.jpg", Principal = true };
        veiculo.Fotos.Add(foto);

        _context.Veiculos.Add(veiculo);
        await _context.SaveChangesAsync();

        // 5. Avaliacao
        var avaliacao = new Avaliacao 
        {
            Id = Guid.NewGuid(),
            EmpresaId = empresa.Id,
            ClienteId = cliente.Id,
            VeiculoId = veiculo.Id,
            ValorAvaliacao = 80000m,
            ValorAprovado = 80000m,
            Status = StatusAvaliacao.Aprovada,
            DataAvaliacao = DateTime.UtcNow
        };
        _context.Avaliacoes.Add(avaliacao);
        await _context.SaveChangesAsync();

        // 6. Venda e Financeiro (Contas a Receber)
        var venda = new Venda 
        {
            Id = Guid.NewGuid(),
            EmpresaId = empresa.Id,
            ClienteId = cliente.Id,
            UsuarioId = funcionario.Id,
            DataVenda = DateTime.UtcNow,
            ValorBruto = veiculo.ValorVenda ?? 0m,
            Desconto = 5000m,
            ValorLiquido = (veiculo.ValorVenda ?? 0m) - 5000m,
            Status = StatusVenda.Concluida,
            NumeroVenda = "VND-TESTE-001"
        };
        
        var vendaVeiculo = new VendaVeiculo { VendaId = venda.Id, VeiculoId = veiculo.Id, ValorVenda = venda.ValorLiquido };
        venda.Veiculos.Add(vendaVeiculo);
        
        var pagamento = new VendaPagamento 
        {
            Id = Guid.NewGuid(),
            VendaId = venda.Id,
            TipoPagamento = (TipoPagamento)1, // 1 = Dinheiro
            Valor = venda.ValorLiquido
        };
        venda.Pagamentos.Add(pagamento);

        // Atualiza status do veículo vendido
        veiculo.Status = StatusVeiculo.Vendido;
        _context.Veiculos.Update(veiculo);

        _context.Vendas.Add(venda);
        await _context.SaveChangesAsync();

        // Financeiro - Conta a Receber
        var contaReceber = new ContaReceber 
        {
            Id = Guid.NewGuid(),
            EmpresaId = empresa.Id,
            ClienteId = cliente.Id,
            VendaId = venda.Id,
            Descricao = "Recebimento ref. Venda " + venda.NumeroVenda,
            ValorOriginal = venda.ValorLiquido,
            ValorPago = venda.ValorLiquido, // Pago à vista no teste
            DataVencimento = DateTime.UtcNow,
            DataEmissao = DateTime.UtcNow,
            Status = StatusConta.Pago
        };
        _context.ContasReceber.Add(contaReceber);
        await _context.SaveChangesAsync();

        // 7. Assertions - Verifica se tudo foi inserido corretamente
        var empresaSalva = await _context.Empresas.FindAsync(empresa.Id);
        Assert.NotNull(empresaSalva);

        var funcSalvo = await _context.Usuarios.FindAsync(funcionario.Id);
        Assert.NotNull(funcSalvo);

        var veiculoSalvo = await _context.Veiculos.Include(v => v.Fotos).FirstOrDefaultAsync(v => v.Id == veiculo.Id);
        Assert.NotNull(veiculoSalvo);
        Assert.Equal(StatusVeiculo.Vendido, veiculoSalvo.Status);
        Assert.Single(veiculoSalvo.Fotos);

        var vendaSalva = await _context.Vendas.Include(v => v.Veiculos).Include(v => v.Pagamentos).FirstOrDefaultAsync(v => v.Id == venda.Id);
        Assert.NotNull(vendaSalva);
        Assert.Single(vendaSalva.Veiculos);
        Assert.Single(vendaSalva.Pagamentos);
        
        var cr = await _context.ContasReceber.FirstOrDefaultAsync(c => c.VendaId == venda.Id);
        Assert.NotNull(cr);
        Assert.Equal(StatusConta.Pago, cr.Status);

        // Limpeza (Opcional)
        _context.ContasReceber.Remove(cr);
        _context.Vendas.Remove(vendaSalva);
        _context.Avaliacoes.Remove(avaliacao);
        _context.Veiculos.Remove(veiculoSalvo);
        _context.Clientes.Remove(cliente);
        _context.Usuarios.Remove(funcSalvo);
        _context.Empresas.Remove(empresaSalva);
        
        await _context.SaveChangesAsync();
    }

    public void Dispose()
    {
        _context?.Dispose();
    }
}