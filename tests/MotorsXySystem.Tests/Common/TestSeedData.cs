using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MotorsXySystem.Domain.Entidades.Acesso;
using MotorsXySystem.Domain.Entidades.Cadastros;
using MotorsXySystem.Domain.Entidades.Financeiro;
using MotorsXySystem.Domain.Entidades.Negocio;
using MotorsXySystem.Domain.Entidades.Tenant;
using MotorsXySystem.Domain.Entidades.Veiculos;
using MotorsXySystem.Domain.Enums;
using MotorsXySystem.Infrastructure.Data;

namespace MotorsXySystem.Tests.Common;

public static class TestSeedData
{
    public static readonly Guid TenantAId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    public static readonly Guid TenantBId = Guid.Parse("22222222-2222-2222-2222-222222222222");

    public static async Task PopularBancoDeTesteAsync(AppDbContext context)
    {
        // 1. Tenants (Lojas)
        var lojaA = new Empresa
        {
            Id = TenantAId,
            RazaoSocial = "Auto Prime Multimarcas Ltda",
            NomeFantasia = "Auto Prime",
            Cnpj = "11.222.333/0001-44",
            Slug = "autoprime",
            Cidade = "São Paulo",
            Uf = "SP",
            Telefone = "(11) 98888-1111",
            Email = "contato@autoprime.com.br",
            DataCriacao = DateTime.UtcNow,
            Ativo = true
        };

        var lojaB = new Empresa
        {
            Id = TenantBId,
            RazaoSocial = "Elite Veículos e Concessionária Eireli",
            NomeFantasia = "Elite Motors",
            Cnpj = "55.666.777/0001-88",
            Slug = "elitemotors",
            Cidade = "Campinas",
            Uf = "SP",
            Telefone = "(19) 97777-2222",
            Email = "contato@elitemotors.com.br",
            DataCriacao = DateTime.UtcNow,
            Ativo = true
        };

        context.Empresas.AddRange(lojaA, lojaB);
        await context.SaveChangesAsync();

        // 2. Perfis (4 por loja)
        var perfisA = new[]
        {
            new Perfil { Id = Guid.NewGuid(), EmpresaId = TenantAId, Nome = "Vendedor", Descricao = "Operador de vendas", Ativo = true, DataCriacao = DateTime.UtcNow },
            new Perfil { Id = Guid.NewGuid(), EmpresaId = TenantAId, Nome = "Gerente Comercial", Descricao = "Gestor comercial", Ativo = true, DataCriacao = DateTime.UtcNow },
            new Perfil { Id = Guid.NewGuid(), EmpresaId = TenantAId, Nome = "Operador Financeiro", Descricao = "Financeiro e contas", Ativo = true, DataCriacao = DateTime.UtcNow },
            new Perfil { Id = Guid.NewGuid(), EmpresaId = TenantAId, Nome = "Administrador", Descricao = "Administrador da loja", Ativo = true, DataCriacao = DateTime.UtcNow }
        };

        var perfisB = new[]
        {
            new Perfil { Id = Guid.NewGuid(), EmpresaId = TenantBId, Nome = "Vendedor", Descricao = "Operador de vendas", Ativo = true, DataCriacao = DateTime.UtcNow },
            new Perfil { Id = Guid.NewGuid(), EmpresaId = TenantBId, Nome = "Gerente Comercial", Descricao = "Gestor comercial", Ativo = true, DataCriacao = DateTime.UtcNow },
            new Perfil { Id = Guid.NewGuid(), EmpresaId = TenantBId, Nome = "Operador Financeiro", Descricao = "Financeiro e contas", Ativo = true, DataCriacao = DateTime.UtcNow },
            new Perfil { Id = Guid.NewGuid(), EmpresaId = TenantBId, Nome = "Administrador", Descricao = "Administrador da loja", Ativo = true, DataCriacao = DateTime.UtcNow }
        };

        context.Perfis.AddRange(perfisA);
        context.Perfis.AddRange(perfisB);
        await context.SaveChangesAsync();

        // 3. Usuários (4 por loja = 8 total)
        string hashPadrao = BCrypt.Net.BCrypt.HashPassword("Senha@123");

        var usuariosA = new[]
        {
            new Usuario { Id = Guid.Parse("10000000-0000-0000-0000-000000000001"), EmpresaId = TenantAId, PerfilId = perfisA[0].Id, Perfil = perfisA[0], Nome = "Vendedor Loja A", Email = "vendedor@autoprime.com", SenhaHash = hashPadrao, CodigoLiberacao = "100001", Ativo = true, DataCriacao = DateTime.UtcNow },
            new Usuario { Id = Guid.Parse("10000000-0000-0000-0000-000000000002"), EmpresaId = TenantAId, PerfilId = perfisA[1].Id, Perfil = perfisA[1], Nome = "Gerente Loja A", Email = "gerente@autoprime.com", SenhaHash = hashPadrao, CodigoLiberacao = "100002", Ativo = true, DataCriacao = DateTime.UtcNow },
            new Usuario { Id = Guid.Parse("10000000-0000-0000-0000-000000000003"), EmpresaId = TenantAId, PerfilId = perfisA[2].Id, Perfil = perfisA[2], Nome = "Financeiro Loja A", Email = "financeiro@autoprime.com", SenhaHash = hashPadrao, CodigoLiberacao = "100003", Ativo = true, DataCriacao = DateTime.UtcNow },
            new Usuario { Id = Guid.Parse("10000000-0000-0000-0000-000000000004"), EmpresaId = TenantAId, PerfilId = perfisA[3].Id, Perfil = perfisA[3], Nome = "Admin Loja A", Email = "admin@autoprime.com", SenhaHash = hashPadrao, CodigoLiberacao = "100004", Ativo = true, DataCriacao = DateTime.UtcNow }
        };

        var usuariosB = new[]
        {
            new Usuario { Id = Guid.Parse("20000000-0000-0000-0000-000000000001"), EmpresaId = TenantBId, PerfilId = perfisB[0].Id, Perfil = perfisB[0], Nome = "Vendedor Loja B", Email = "vendedor@elitemotors.com", SenhaHash = hashPadrao, CodigoLiberacao = "200001", Ativo = true, DataCriacao = DateTime.UtcNow },
            new Usuario { Id = Guid.Parse("20000000-0000-0000-0000-000000000002"), EmpresaId = TenantBId, PerfilId = perfisB[1].Id, Perfil = perfisB[1], Nome = "Gerente Loja B", Email = "gerente@elitemotors.com", SenhaHash = hashPadrao, CodigoLiberacao = "200002", Ativo = true, DataCriacao = DateTime.UtcNow },
            new Usuario { Id = Guid.Parse("20000000-0000-0000-0000-000000000003"), EmpresaId = TenantBId, PerfilId = perfisB[2].Id, Perfil = perfisB[2], Nome = "Financeiro Loja B", Email = "financeiro@elitemotors.com", SenhaHash = hashPadrao, CodigoLiberacao = "200003", Ativo = true, DataCriacao = DateTime.UtcNow },
            new Usuario { Id = Guid.Parse("20000000-0000-0000-0000-000000000004"), EmpresaId = TenantBId, PerfilId = perfisB[3].Id, Perfil = perfisB[3], Nome = "Admin Loja B", Email = "admin@elitemotors.com", SenhaHash = hashPadrao, CodigoLiberacao = "200004", Ativo = true, DataCriacao = DateTime.UtcNow }
        };

        context.Usuarios.AddRange(usuariosA);
        context.Usuarios.AddRange(usuariosB);
        await context.SaveChangesAsync();

        // 4. Clientes (PF e PJ em ambas as lojas)
        var clientePFA = new Cliente
        {
            Id = Guid.Parse("30000000-0000-0000-0000-000000000001"),
            EmpresaId = TenantAId,
            Nome = "Carlos Eduardo da Silva",
            CpfCnpj = "123.456.789-00",
            Email = "carlos.silva@email.com",
            Telefone = "(11) 99111-2222",
            EnderecoCompleto = "Av. Paulista, 1000, Bela Vista, São Paulo/SP - CEP: 01310-100",
            Ativo = true,
            DataCriacao = DateTime.UtcNow
        };

        var clientePJA = new Cliente
        {
            Id = Guid.Parse("30000000-0000-0000-0000-000000000002"),
            EmpresaId = TenantAId,
            Nome = "Alpha Locadora de Frotas Ltda",
            CpfCnpj = "12.345.678/0001-90",
            Email = "frotas@alphalocadora.com.br",
            Telefone = "(11) 3222-4444",
            EnderecoCompleto = "Rua Funchal, 200, Vila Olímpia, São Paulo/SP - CEP: 04551-060",
            Ativo = true,
            DataCriacao = DateTime.UtcNow
        };

        var clientePFB = new Cliente
        {
            Id = Guid.Parse("30000000-0000-0000-0000-000000000003"),
            EmpresaId = TenantBId,
            Nome = "Mariana Alves Costa",
            CpfCnpj = "987.654.321-11",
            Email = "mariana.costa@email.com",
            Telefone = "(19) 98222-3333",
            EnderecoCompleto = "Av. Brasil, 500, Jardim Guanabara, Campinas/SP - CEP: 13073-010",
            Ativo = true,
            DataCriacao = DateTime.UtcNow
        };

        var clientePJB = new Cliente
        {
            Id = Guid.Parse("30000000-0000-0000-0000-000000000004"),
            EmpresaId = TenantBId,
            Nome = "Beta Logística e Transportes S.A.",
            CpfCnpj = "98.765.432/0001-10",
            Email = "diretoria@betalog.com.br",
            Telefone = "(19) 3788-9999",
            EnderecoCompleto = "Rod. Anhanguera, km 98, Campinas/SP - CEP: 13068-600",
            Ativo = true,
            DataCriacao = DateTime.UtcNow
        };

        context.Clientes.AddRange(clientePFA, clientePJA, clientePFB, clientePJB);
        await context.SaveChangesAsync();

        // 5. 20 Veículos (10 Loja A, 10 Loja B)
        // Categorias: Novos (Km 0), Seminovos, Consignados, Veículos de Troca
        var veiculos = new List<Veiculo>();

        // --- LOJA A (10 veículos) ---
        // V01: Novo (Zero KM)
        veiculos.Add(new Veiculo
        {
            Id = Guid.Parse("40000000-0000-0000-0000-000000000001"),
            EmpresaId = TenantAId,
            Marca = "Toyota",
            Modelo = "Corolla",
            Versao = "Altis Hybrid 1.8",
            AnoFabricacao = 2026,
            AnoModelo = 2026,
            Cor = "Branco Perolizado",
            Combustivel = "Híbrido",
            Cambio = "Automático CVT",
            Quilometragem = 0,
            ValorCompra = 150000.00m,
            ValorVenda = 185000.00m,
            ValorFipe = 182000.00m,
            Placa = "BRA2E26",
            Chassi = "9BRBL30E8P0111111",
            Renavam = "12345678901",
            Tipo = TipoVeiculo.Carro,
            Status = 1, // Disponível
            Consignado = false,
            Ativo = true,
            DataCriacao = DateTime.UtcNow
        });

        // V02: Seminovo
        veiculos.Add(new Veiculo
        {
            Id = Guid.Parse("40000000-0000-0000-0000-000000000002"),
            EmpresaId = TenantAId,
            Marca = "Honda",
            Modelo = "Civic",
            Versao = "Touring 1.5 Turbo",
            AnoFabricacao = 2023,
            AnoModelo = 2023,
            Cor = "Preto Cristal",
            Combustivel = "Gasolina",
            Cambio = "Automático",
            Quilometragem = 35000,
            ValorCompra = 120000.00m,
            ValorVenda = 142000.00m,
            ValorFipe = 139000.00m,
            Placa = "HON1C23",
            Chassi = "93HFC1670P0222222",
            Renavam = "23456789012",
            Tipo = TipoVeiculo.Carro,
            Status = 1, // Disponível
            Consignado = false,
            Ativo = true,
            DataCriacao = DateTime.UtcNow
        });

        // V03: Consignado (Sem custo de aquisição próprio)
        veiculos.Add(new Veiculo
        {
            Id = Guid.Parse("40000000-0000-0000-0000-000000000003"),
            EmpresaId = TenantAId,
            Marca = "BMW",
            Modelo = "320i",
            Versao = "M Sport 2.0 Turbo",
            AnoFabricacao = 2024,
            AnoModelo = 2024,
            Cor = "Azul Portimao",
            Combustivel = "Flex",
            Cambio = "Automático",
            Quilometragem = 18000,
            ValorCompra = 0.00m, // Consignado
            ValorVenda = 295000.00m,
            ValorFipe = 289000.00m,
            Placa = "BMW3M24",
            Chassi = "WBA5R1109P0333333",
            Renavam = "34567890123",
            Tipo = TipoVeiculo.Carro,
            Status = 1, // Disponível
            Consignado = true,
            Observacoes = "Veículo consignado do cliente Dr. Fernando",
            Ativo = true,
            DataCriacao = DateTime.UtcNow
        });

        // V04: Entrada por troca
        veiculos.Add(new Veiculo
        {
            Id = Guid.Parse("40000000-0000-0000-0000-000000000004"),
            EmpresaId = TenantAId,
            Marca = "Volkswagen",
            Modelo = "Gol",
            Versao = "1.0 MPI",
            AnoFabricacao = 2020,
            AnoModelo = 2021,
            Cor = "Prata Sirius",
            Combustivel = "Flex",
            Cambio = "Manual",
            Quilometragem = 68000,
            ValorCompra = 42000.00m, // Avaliação de troca
            ValorVenda = 51000.00m,
            ValorFipe = 48500.00m,
            Placa = "GOL2O21",
            Chassi = "9BWAA45U0M0444444",
            Renavam = "45678901234",
            Tipo = TipoVeiculo.Carro,
            Status = 1, // Em avaliação / Disponível
            Consignado = false,
            Observacoes = "Veículo entrou como troca na venda VD-01",
            Ativo = true,
            DataCriacao = DateTime.UtcNow
        });

        // V05: Moto Seminova
        veiculos.Add(new Veiculo
        {
            Id = Guid.Parse("40000000-0000-0000-0000-000000000005"),
            EmpresaId = TenantAId,
            Marca = "Yamaha",
            Modelo = "MT-07",
            Versao = "ABS 689cc",
            AnoFabricacao = 2023,
            AnoModelo = 2024,
            Cor = "Cinza Fosco",
            Combustivel = "Gasolina",
            Cambio = "Manual 6M",
            Quilometragem = 12000,
            Cilindrada = 689,
            CategoriaMoto = CategoriaMoto.Naked,
            ValorCompra = 34000.00m,
            ValorVenda = 42900.00m,
            ValorFipe = 41500.00m,
            Placa = "YAM0M07",
            Chassi = "9C6RM0700P0555555",
            Renavam = "56789012345",
            Tipo = TipoVeiculo.Moto,
            Status = 1,
            Consignado = false,
            Ativo = true,
            DataCriacao = DateTime.UtcNow
        });

        // V06: Status Reservado (5)
        veiculos.Add(new Veiculo
        {
            Id = Guid.Parse("40000000-0000-0000-0000-000000000006"),
            EmpresaId = TenantAId,
            Marca = "Jeep",
            Modelo = "Compass",
            Versao = "Limited T270",
            AnoFabricacao = 2023,
            AnoModelo = 2024,
            Cor = "Cinza Granite",
            Combustivel = "Flex",
            Cambio = "Automático",
            Quilometragem = 22000,
            ValorCompra = 135000.00m,
            ValorVenda = 159900.00m,
            ValorFipe = 155000.00m,
            Placa = "JEE2C70",
            Chassi = "988651000P0666666",
            Renavam = "67890123456",
            Tipo = TipoVeiculo.Carro,
            Status = 5, // Reservado
            Consignado = false,
            Ativo = true,
            DataCriacao = DateTime.UtcNow
        });

        // V07: Status Vendido (6)
        veiculos.Add(new Veiculo
        {
            Id = Guid.Parse("40000000-0000-0000-0000-000000000007"),
            EmpresaId = TenantAId,
            Marca = "Hyundai",
            Modelo = "Creta",
            Versao = "Ultimate 2.0",
            AnoFabricacao = 2024,
            AnoModelo = 2024,
            Cor = "Prata",
            Combustivel = "Flex",
            Cambio = "Automático",
            Quilometragem = 15000,
            ValorCompra = 125000.00m,
            ValorVenda = 145000.00m,
            ValorFipe = 142000.00m,
            Placa = "HYU2C24",
            Chassi = "9BHBG81FEP0777777",
            Renavam = "78901234567",
            Tipo = TipoVeiculo.Carro,
            Status = 6, // Vendido
            Consignado = false,
            Ativo = true,
            DataCriacao = DateTime.UtcNow
        });

        // V08: Seminovo
        veiculos.Add(new Veiculo
        {
            Id = Guid.Parse("40000000-0000-0000-0000-000000000008"),
            EmpresaId = TenantAId,
            Marca = "Chevrolet",
            Modelo = "Onix",
            Versao = "Premier 1.0 Turbo",
            AnoFabricacao = 2022,
            AnoModelo = 2023,
            Cor = "Azul Seeker",
            Combustivel = "Flex",
            Cambio = "Automático",
            Quilometragem = 45000,
            ValorCompra = 65000.00m,
            ValorVenda = 79900.00m,
            ValorFipe = 77000.00m,
            Placa = "CHV1X23",
            Chassi = "9BGKS48U0P0888888",
            Renavam = "89012345678",
            Tipo = TipoVeiculo.Carro,
            Status = 1,
            Consignado = false,
            Ativo = true,
            DataCriacao = DateTime.UtcNow
        });

        // V09: Seminovo
        veiculos.Add(new Veiculo
        {
            Id = Guid.Parse("40000000-0000-0000-0000-000000000009"),
            EmpresaId = TenantAId,
            Marca = "Fiat",
            Modelo = "Pulse",
            Versao = "Audace Turbo 200",
            AnoFabricacao = 2023,
            AnoModelo = 2023,
            Cor = "Cinza Strato",
            Combustivel = "Flex",
            Cambio = "Automático CVT",
            Quilometragem = 29000,
            ValorCompra = 78000.00m,
            ValorVenda = 94000.00m,
            ValorFipe = 91500.00m,
            Placa = "FIA2P23",
            Chassi = "9BD363000P0999999",
            Renavam = "90123456789",
            Tipo = TipoVeiculo.Carro,
            Status = 1,
            Consignado = false,
            Ativo = true,
            DataCriacao = DateTime.UtcNow
        });

        // V10: Moto Nova
        veiculos.Add(new Veiculo
        {
            Id = Guid.Parse("40000000-0000-0000-0000-000000000010"),
            EmpresaId = TenantAId,
            Marca = "Honda",
            Modelo = "CB 500X",
            Versao = "ABS",
            AnoFabricacao = 2026,
            AnoModelo = 2026,
            Cor = "Vermelha",
            Combustivel = "Gasolina",
            Cambio = "Manual 6M",
            Quilometragem = 0,
            Cilindrada = 471,
            CategoriaMoto = CategoriaMoto.Trail,
            ValorCompra = 36000.00m,
            ValorVenda = 45000.00m,
            ValorFipe = 44000.00m,
            Placa = "HON5X26",
            Chassi = "9C2PC4600P0101010",
            Renavam = "01234567890",
            Tipo = TipoVeiculo.Moto,
            Status = 1,
            Consignado = false,
            Ativo = true,
            DataCriacao = DateTime.UtcNow
        });

        // --- LOJA B (10 veículos) ---
        // V11: Novo
        veiculos.Add(new Veiculo
        {
            Id = Guid.Parse("40000000-0000-0000-0000-000000000011"),
            EmpresaId = TenantBId,
            Marca = "Audi",
            Modelo = "Q3",
            Versao = "Prestige Plus 2.0 TFSI",
            AnoFabricacao = 2026,
            AnoModelo = 2026,
            Cor = "Cinza Daytona",
            Combustivel = "Gasolina",
            Cambio = "Automático Tiptronic",
            Quilometragem = 0,
            ValorCompra = 240000.00m,
            ValorVenda = 299000.00m,
            ValorFipe = 295000.00m,
            Placa = "AUD3Q26",
            Chassi = "WAUZZZF30P0111222",
            Renavam = "11223344556",
            Tipo = TipoVeiculo.Carro,
            Status = 1,
            Consignado = false,
            Ativo = true,
            DataCriacao = DateTime.UtcNow
        });

        // V12: Seminovo
        veiculos.Add(new Veiculo
        {
            Id = Guid.Parse("40000000-0000-0000-0000-000000000012"),
            EmpresaId = TenantBId,
            Marca = "Volvo",
            Modelo = "XC60",
            Versao = "T8 Inscription Híbrido",
            AnoFabricacao = 2022,
            AnoModelo = 2023,
            Cor = "Branco Cristal",
            Combustivel = "Híbrido Plug-in",
            Cambio = "Automático",
            Quilometragem = 41000,
            ValorCompra = 210000.00m,
            ValorVenda = 265000.00m,
            ValorFipe = 258000.00m,
            Placa = "VOL6T23",
            Chassi = "YV4BR0000P0222333",
            Renavam = "22334455667",
            Tipo = TipoVeiculo.Carro,
            Status = 1,
            Consignado = false,
            Ativo = true,
            DataCriacao = DateTime.UtcNow
        });

        // V13: Consignado
        veiculos.Add(new Veiculo
        {
            Id = Guid.Parse("40000000-0000-0000-0000-000000000013"),
            EmpresaId = TenantBId,
            Marca = "Porsche",
            Modelo = "Macan",
            Versao = "2.0 Turbo PDK",
            AnoFabricacao = 2023,
            AnoModelo = 2023,
            Cor = "Cinza Vulcano",
            Combustivel = "Gasolina",
            Cambio = "Automático PDK",
            Quilometragem = 14000,
            ValorCompra = 0.00m, // Consignado
            ValorVenda = 480000.00m,
            ValorFipe = 475000.00m,
            Placa = "POR9M23",
            Chassi = "WP1AA2A50P0333444",
            Renavam = "33445566778",
            Tipo = TipoVeiculo.Carro,
            Status = 1,
            Consignado = true,
            Observacoes = "Consignado da Sra. Beatriz",
            Ativo = true,
            DataCriacao = DateTime.UtcNow
        });

        // V14: Troca
        veiculos.Add(new Veiculo
        {
            Id = Guid.Parse("40000000-0000-0000-0000-000000000014"),
            EmpresaId = TenantBId,
            Marca = "Renault",
            Modelo = "Kwid",
            Versao = "Zen 1.0",
            AnoFabricacao = 2021,
            AnoModelo = 2022,
            Cor = "Laranja Ocre",
            Combustivel = "Flex",
            Cambio = "Manual",
            Quilometragem = 53000,
            ValorCompra = 36000.00m,
            ValorVenda = 44900.00m,
            ValorFipe = 42000.00m,
            Placa = "REN1K22",
            Chassi = "93YBB0000P0444555",
            Renavam = "44556677889",
            Tipo = TipoVeiculo.Carro,
            Status = 1,
            Consignado = false,
            Observacoes = "Entrada por troca Loja B",
            Ativo = true,
            DataCriacao = DateTime.UtcNow
        });

        // V15: Moto Seminova
        veiculos.Add(new Veiculo
        {
            Id = Guid.Parse("40000000-0000-0000-0000-000000000015"),
            EmpresaId = TenantBId,
            Marca = "BMW",
            Modelo = "R 1250 GS",
            Versao = "Adventure",
            AnoFabricacao = 2023,
            AnoModelo = 2024,
            Cor = "Triple Black",
            Combustivel = "Gasolina",
            Cambio = "Manual 6M",
            Quilometragem = 16000,
            Cilindrada = 1254,
            CategoriaMoto = CategoriaMoto.Trail,
            ValorCompra = 85000.00m,
            ValorVenda = 109000.00m,
            ValorFipe = 105000.00m,
            Placa = "BMW1G24",
            Chassi = "WB10M0000P0555666",
            Renavam = "55667788990",
            Tipo = TipoVeiculo.Moto,
            Status = 1,
            Consignado = false,
            Ativo = true,
            DataCriacao = DateTime.UtcNow
        });

        // V16: Reservado (5)
        veiculos.Add(new Veiculo
        {
            Id = Guid.Parse("40000000-0000-0000-0000-000000000016"),
            EmpresaId = TenantBId,
            Marca = "Ford",
            Modelo = "Ranger",
            Versao = "Limited V6 3.0 4x4",
            AnoFabricacao = 2024,
            AnoModelo = 2024,
            Cor = "Azul Belize",
            Combustivel = "Diesel",
            Cambio = "Automático 10M",
            Quilometragem = 11000,
            ValorCompra = 260000.00m,
            ValorVenda = 315000.00m,
            ValorFipe = 309000.00m,
            Placa = "FOR6R24",
            Chassi = "8AFTF0000P0666777",
            Renavam = "66778899001",
            Tipo = TipoVeiculo.Carro,
            Status = 5, // Reservado
            Consignado = false,
            Ativo = true,
            DataCriacao = DateTime.UtcNow
        });

        // V17: Vendido (6)
        veiculos.Add(new Veiculo
        {
            Id = Guid.Parse("40000000-0000-0000-0000-000000000017"),
            EmpresaId = TenantBId,
            Marca = "Toyota",
            Modelo = "Hilux",
            Versao = "SRX 2.8 Diesel 4x4",
            AnoFabricacao = 2023,
            AnoModelo = 2023,
            Cor = "Prata Névoa",
            Combustivel = "Diesel",
            Cambio = "Automático",
            Quilometragem = 38000,
            ValorCompra = 230000.00m,
            ValorVenda = 278000.00m,
            ValorFipe = 272000.00m,
            Placa = "TOY8H23",
            Chassi = "8AJHA0000P0777888",
            Renavam = "77889900112",
            Tipo = TipoVeiculo.Carro,
            Status = 6, // Vendido
            Consignado = false,
            Ativo = true,
            DataCriacao = DateTime.UtcNow
        });

        // V18: Seminovo
        veiculos.Add(new Veiculo
        {
            Id = Guid.Parse("40000000-0000-0000-0000-000000000018"),
            EmpresaId = TenantBId,
            Marca = "Nissan",
            Modelo = "Kicks",
            Versao = "Exclusive 1.6 CVT",
            AnoFabricacao = 2023,
            AnoModelo = 2023,
            Cor = "Cinza Rust",
            Combustivel = "Flex",
            Cambio = "Automático CVT",
            Quilometragem = 33000,
            ValorCompra = 85000.00m,
            ValorVenda = 105000.00m,
            ValorFipe = 101000.00m,
            Placa = "NIS1K23",
            Chassi = "94ZBA0000P0888999",
            Renavam = "88990011223",
            Tipo = TipoVeiculo.Carro,
            Status = 1,
            Consignado = false,
            Ativo = true,
            DataCriacao = DateTime.UtcNow
        });

        // V19: Seminovo
        veiculos.Add(new Veiculo
        {
            Id = Guid.Parse("40000000-0000-0000-0000-000000000019"),
            EmpresaId = TenantBId,
            Marca = "Peugeot",
            Modelo = "208",
            Versao = "Style 1.0 Firefly",
            AnoFabricacao = 2023,
            AnoModelo = 2024,
            Cor = "Azul Quasar",
            Combustivel = "Flex",
            Cambio = "Manual",
            Quilometragem = 26000,
            ValorCompra = 58000.00m,
            ValorVenda = 71900.00m,
            ValorFipe = 69500.00m,
            Placa = "PEU2P24",
            Chassi = "8ADUR0000P0999000",
            Renavam = "99001122334",
            Tipo = TipoVeiculo.Carro,
            Status = 1,
            Consignado = false,
            Ativo = true,
            DataCriacao = DateTime.UtcNow
        });

        // V20: Scooter Nova
        veiculos.Add(new Veiculo
        {
            Id = Guid.Parse("40000000-0000-0000-0000-000000000020"),
            EmpresaId = TenantBId,
            Marca = "Honda",
            Modelo = "PCX 160",
            Versao = "DLX ABS",
            AnoFabricacao = 2026,
            AnoModelo = 2026,
            Cor = "Azul Metálico",
            Combustivel = "Gasolina",
            Cambio = "Automático CVT",
            Quilometragem = 0,
            Cilindrada = 160,
            CategoriaMoto = CategoriaMoto.Scooter,
            ValorCompra = 16500.00m,
            ValorVenda = 21900.00m,
            ValorFipe = 21000.00m,
            Placa = "HON1P26",
            Chassi = "9C2KF0000P0202020",
            Renavam = "00112233445",
            Tipo = TipoVeiculo.Moto,
            Status = 1,
            Consignado = false,
            Ativo = true,
            DataCriacao = DateTime.UtcNow
        });

        context.Veiculos.AddRange(veiculos);
        await context.SaveChangesAsync();

        // 6. Vendas Existentes (Propostas em vários status)
        // Venda 1: Concluída na Loja A
        var venda1 = new Venda
        {
            Id = Guid.Parse("50000000-0000-0000-0000-000000000001"),
            EmpresaId = TenantAId,
            ClienteId = clientePFA.Id,
            UsuarioId = usuariosA[0].Id,
            NumeroVenda = "VD-20261001-1001",
            DataVenda = DateTime.UtcNow.AddDays(-5),
            Status = StatusVenda.Concluida,
            ValorTotalVeiculos = 145000.00m,
            ValorDesconto = 2000.00m,
            ValorTotalFinal = 143000.00m,
            Observacoes = "Venda Creta com pagamento à vista e financiado",
            Ativo = true,
            DataCriacao = DateTime.UtcNow.AddDays(-5)
        };
        context.Vendas.Add(venda1);

        context.VendaVeiculos.Add(new VendaVeiculo
        {
            Id = Guid.NewGuid(),
            EmpresaId = TenantAId,
            VendaId = venda1.Id,
            VeiculoId = veiculos[6].Id, // Creta vendido
            ValorVenda = 145000.00m,
            Ativo = true,
            DataCriacao = DateTime.UtcNow.AddDays(-5)
        });

        // Contas a receber da Venda 1
        context.ContasReceber.Add(new ContaReceber
        {
            Id = Guid.NewGuid(),
            EmpresaId = TenantAId,
            ClienteId = clientePFA.Id,
            VendaId = venda1.Id,
            Descricao = "Venda VD-20261001-1001 - DINHEIRO (À Vista)",
            ValorOriginal = 43000.00m,
            ValorPago = 43000.00m,
            DataVencimento = DateTime.UtcNow.AddDays(-5),
            DataPagamento = DateTime.UtcNow.AddDays(-5),
            Status = StatusConta.Paga,
            TipoPagamento = TipoPagamento.Dinheiro,
            Ativo = true,
            DataCriacao = DateTime.UtcNow.AddDays(-5)
        });

        context.ContasReceber.Add(new ContaReceber
        {
            Id = Guid.NewGuid(),
            EmpresaId = TenantAId,
            ClienteId = clientePFA.Id,
            VendaId = venda1.Id,
            Descricao = "Venda VD-20261001-1001 - FINANCEIRA (1/1)",
            ValorOriginal = 100000.00m,
            DataVencimento = DateTime.UtcNow.AddDays(25),
            Status = StatusConta.Aberta,
            TipoPagamento = TipoPagamento.Financiamento,
            Ativo = true,
            DataCriacao = DateTime.UtcNow.AddDays(-5)
        });

        // Venda 2: Cancelada na Loja B
        var venda2 = new Venda
        {
            Id = Guid.Parse("50000000-0000-0000-0000-000000000002"),
            EmpresaId = TenantBId,
            ClienteId = clientePFB.Id,
            UsuarioId = usuariosB[0].Id,
            NumeroVenda = "VD-20261001-2002",
            DataVenda = DateTime.UtcNow.AddDays(-3),
            Status = StatusVenda.Cancelada,
            ValorTotalVeiculos = 278000.00m,
            ValorDesconto = 0.00m,
            ValorTotalFinal = 278000.00m,
            Observacoes = "Venda cancelada por desistência do comprador",
            Ativo = true,
            DataCriacao = DateTime.UtcNow.AddDays(-3)
        };
        context.Vendas.Add(venda2);

        // Contas a pagar da Loja A e Loja B
        context.ContasPagar.Add(new ContaPagar
        {
            Id = Guid.NewGuid(),
            EmpresaId = TenantAId,
            Descricao = "Preparação e Laudo Cautelar Corolla",
            ValorOriginal = 1250.00m,
            ValorPago = 1250.00m,
            DataVencimento = DateTime.UtcNow.AddDays(-2),
            DataPagamento = DateTime.UtcNow.AddDays(-2),
            Status = StatusConta.Paga,
            TipoPagamento = TipoPagamento.TransferenciaBancaria,
            Ativo = true,
            DataCriacao = DateTime.UtcNow.AddDays(-5)
        });

        context.ContasPagar.Add(new ContaPagar
        {
            Id = Guid.NewGuid(),
            EmpresaId = TenantBId,
            Descricao = "Revisão e Higienização Audi Q3",
            ValorOriginal = 2800.00m,
            DataVencimento = DateTime.UtcNow.AddDays(10),
            Status = StatusConta.Aberta,
            TipoPagamento = TipoPagamento.Boleto,
            Ativo = true,
            DataCriacao = DateTime.UtcNow.AddDays(-2)
        });

        await context.SaveChangesAsync();
    }
}
