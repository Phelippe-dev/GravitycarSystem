using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using GravityCarSystem.Application.Interfaces;
using GravityCarSystem.Domain.Entities.Acesso;
using GravityCarSystem.Domain.Entities.Financeiro;
using GravityCarSystem.Domain.Entities.Veiculos;
using GravityCarSystem.Domain.Enums;
using GravityCarSystem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace GravityCarSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StressTestController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public StressTestController(AppDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    [HttpPost("seed")]
    public async Task<IActionResult> SeedMassiveData()
    {
        var empresaId = _tenantService.GetEmpresaId() ?? Guid.Empty;
        if (empresaId == Guid.Empty)
        {
            var empresa = await _context.Empresas.FirstOrDefaultAsync();
            if (empresa == null)
            {
                empresa = new Empresa 
                { 
                    Id = Guid.NewGuid(), 
                    RazaoSocial = "Concessionária Teste Stress LTDA", 
                    NomeFantasia = "Auto Stress", 
                    Cnpj = "00000000000199",
                    Ativa = true
                };
                _context.Empresas.Add(empresa);
                await _context.SaveChangesAsync();
            }
            empresaId = empresa.Id;
        }

        int quantidadeVeiculos = 5000;
        int quantidadeFinanceiro = 10000;

        try
        {
            _context.ChangeTracker.AutoDetectChangesEnabled = false;

            var random = new Random();
            var veiculos = new List<Veiculo>();

            for (int i = 0; i < quantidadeVeiculos; i++)
            {
                var veiculo = new Veiculo
                {
                    Id = Guid.NewGuid(),
                    EmpresaId = empresaId,
                    Marca = "Marca " + random.Next(1, 20),
                    Modelo = "Modelo " + i,
                    AnoFabricacao = (short)random.Next(2010, 2026),
                    AnoModelo = (short)random.Next(2010, 2026),
                    Placa = $"ABC{random.Next(1000, 9999)}",
                    Renavam = random.Next(100000000, 999999999).ToString(),
                    ValorCompra = random.Next(20000, 100000),
                    ValorVenda = random.Next(30000, 150000),
                    Status = StatusVeiculo.Disponivel
                };
                veiculos.Add(veiculo);
            }
            await _context.Veiculos.AddRangeAsync(veiculos);

            var contas = new List<ContaPagar>();
            for (int i = 0; i < quantidadeFinanceiro; i++)
            {
                var val = random.Next(100, 5000);
                contas.Add(new ContaPagar
                {
                    Id = Guid.NewGuid(),
                    EmpresaId = empresaId,
                    Descricao = "Custo Teste Stress " + i,
                    ValorOriginal = val,
                    Saldo = val,
                    ValorPago = 0,
                    DataVencimento = DateTime.UtcNow.AddDays(random.Next(-30, 30)),
                    DataEmissao = DateTime.UtcNow,
                    Status = StatusConta.Aberto
                });
            }
            await _context.ContasPagar.AddRangeAsync(contas);

            await _context.SaveChangesAsync();
            
            _context.ChangeTracker.AutoDetectChangesEnabled = true;

            return Ok(new { Message = $"Sucesso. Inseridos {quantidadeVeiculos} veículos e {quantidadeFinanceiro} contas no Tenant {empresaId}." });
        }
        catch (Exception ex)
        {
            _context.ChangeTracker.AutoDetectChangesEnabled = true;
            return StatusCode(500, new { Error = ex.Message });
        }
    }

    [HttpPost("clear")]
    public async Task<IActionResult> ClearData()
    {
        // Limpa dados de teste massivo
        await _context.Database.ExecuteSqlRawAsync("DELETE FROM ContasPagar");
        await _context.Database.ExecuteSqlRawAsync("DELETE FROM ContasReceber");
        await _context.Database.ExecuteSqlRawAsync("DELETE FROM VeiculoCustos");
        await _context.Database.ExecuteSqlRawAsync("DELETE FROM VeiculoFotos");
        await _context.Database.ExecuteSqlRawAsync("DELETE FROM VendaVeiculos");
        await _context.Database.ExecuteSqlRawAsync("DELETE FROM Veiculos");
        return Ok("Dados limpos.");
    }
}
