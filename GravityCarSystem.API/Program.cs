using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using GravityCarSystem.Application.Interfaces;
using GravityCarSystem.Infrastructure.Data;
using GravityCarSystem.Infrastructure.Data.Interceptors;
using GravityCarSystem.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddHttpContextAccessor();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy.AllowAnyOrigin()
                        .AllowAnyMethod()
                        .AllowAnyHeader());
});

// Configure JWT Authentication
var secretKey = builder.Configuration["JwtSettings:Secret"] ?? "MySuperSecretKeyForDevelopmentOnly_NeedToBeLongerToWorkProperly32Chars";
var key = Encoding.ASCII.GetBytes(secretKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false
    };
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();


// GravityCarSystem Services
builder.Services.AddScoped<ICurrentTenantService, CurrentTenantService>();
builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddScoped<AuditableEntitySaveChangesInterceptor>();
builder.Services.AddScoped<IFileStorageService, LocalFileStorageService>();

// Application Services
builder.Services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());
builder.Services.AddScoped<GravityCarSystem.Application.Interfaces.IClienteService, GravityCarSystem.Application.Services.Cadastros.ClienteService>();
builder.Services.AddScoped<GravityCarSystem.Application.Interfaces.IVeiculoService, GravityCarSystem.Application.Services.Veiculos.VeiculoService>();
builder.Services.AddScoped<GravityCarSystem.Application.Interfaces.IVendaService, GravityCarSystem.Application.Services.Negocio.VendaService>();
builder.Services.AddScoped<GravityCarSystem.Application.Interfaces.Financeiro.IContaPagarService, GravityCarSystem.Application.Services.Financeiro.ContaPagarService>();
builder.Services.AddScoped<GravityCarSystem.Application.Interfaces.Financeiro.IContaReceberService, GravityCarSystem.Application.Services.Financeiro.ContaReceberService>();
builder.Services.AddScoped<GravityCarSystem.Application.Interfaces.Relatorios.IRelatorioService, GravityCarSystem.Application.Services.Relatorios.RelatorioService>();
builder.Services.AddScoped<GravityCarSystem.Application.Interfaces.Fiscal.INotaFiscalService, GravityCarSystem.Application.Services.Fiscal.NotaFiscalService>();
// Configurar HttpClient para a ApiBrasil
builder.Services.AddHttpClient<GravityCarSystem.Application.Interfaces.Integracoes.ISenatranService, GravityCarSystem.Application.Services.Integracoes.ApiBrasilService>();

builder.Services.AddScoped<GravityCarSystem.Application.Interfaces.IAvaliacaoService, GravityCarSystem.Application.Services.Veiculos.AvaliacaoService>();
builder.Services.AddScoped<GravityCarSystem.Application.Interfaces.IChequeService, GravityCarSystem.Application.Services.Negocio.ChequeService>();
builder.Services.AddScoped<GravityCarSystem.Application.Interfaces.Acesso.IEmpresaService, GravityCarSystem.Application.Services.Acesso.EmpresaService>();

// Database Configuration (SQLite para dev, PostgreSQL para produção via Docker)
var useSqlite = builder.Configuration.GetValue<bool>("UseSqlite", true);
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<AppDbContext>((sp, options) =>
{
    var interceptor = sp.GetRequiredService<AuditableEntitySaveChangesInterceptor>();
    if (useSqlite)
    {
        var sqliteConn = builder.Configuration.GetConnectionString("SqliteConnection") ?? "Data Source=gravitycarsystem.db";
        options.UseSqlite(sqliteConn)
               .AddInterceptors(interceptor);
    }
    else
    {
        // PostgreSQL em produção (Docker)
        options.UseNpgsql(connectionString)
               .AddInterceptors(interceptor);
    }
});

var app = builder.Build();

// =====================================================================
// Seed & Inicialização Automática do Banco
// IMPORTANTE: Database.Migrate() cria/atualiza o banco automaticamente
// ao iniciar uma nova versao — sem perda de dados!
// =====================================================================
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        // Migra o banco (cria tabelas se nao existirem, aplica migrations pendentes)
        if (useSqlite)
            db.Database.EnsureCreated(); // SQLite: EnsureCreated (nao suporta Migrate bem)
        else
            db.Database.Migrate();       // PostgreSQL: Migrate (preserva dados!)
        
        if (useSqlite)
        {
            try { db.Database.ExecuteSqlRaw("ALTER TABLE Empresas ADD COLUMN SaldoConsultas INTEGER NOT NULL DEFAULT 100;"); } catch { }
            try { db.Database.ExecuteSqlRaw("ALTER TABLE Empresas ADD COLUMN ConsultasRealizadas INTEGER NOT NULL DEFAULT 0;"); } catch { }
            try { db.Database.ExecuteSqlRaw("ALTER TABLE Usuarios ADD COLUMN Cargo TEXT;"); } catch { }
            try { db.Database.ExecuteSqlRaw("ALTER TABLE Usuarios ADD COLUMN ComissaoPercent REAL NOT NULL DEFAULT 2.0;"); } catch { }
            try { db.Database.ExecuteSqlRaw("ALTER TABLE Usuarios ADD COLUMN ResetToken TEXT;"); } catch { }
            try { db.Database.ExecuteSqlRaw("ALTER TABLE Usuarios ADD COLUMN ResetTokenExpiry TEXT;"); } catch { }
            try { db.Database.ExecuteSqlRaw("ALTER TABLE Usuarios ADD COLUMN UltimoLogin TEXT;"); } catch { }
        }

        logger.LogInformation("Banco de dados inicializado com sucesso.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Erro ao inicializar o banco de dados.");
    }

    // Leitura das configuracoes da loja no appsettings.json
    var lojaCfg = app.Configuration.GetSection("LojaCfg");
    var lojaRazaoSocial = lojaCfg["RazaoSocial"] ?? "Gravity Motors Concessionária LTDA";
    var lojaNomeFantasia = lojaCfg["NomeFantasia"] ?? "Gravity Motors";
    var lojaCnpj = lojaCfg["Cnpj"] ?? "00.000.000/0001-00";

    // 1. Empresa — criada a partir da config da loja (nao hardcoded!)
    var empresaId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    var empresa = db.Empresas.FirstOrDefault(e => e.Id == empresaId);
    if (empresa == null)
    {
        empresa = new GravityCarSystem.Domain.Entities.Acesso.Empresa
        {
            Id = empresaId,
            RazaoSocial = lojaRazaoSocial,
            NomeFantasia = lojaNomeFantasia,
            Cnpj = lojaCnpj,
            Ativa = true,
            DataCadastro = DateTime.UtcNow
        };
        db.Empresas.Add(empresa);
        db.SaveChanges();
    }
    else
    {
        // Atualiza dados da empresa na nova versao (ex: mudou CNPJ ou nome)
        empresa.RazaoSocial = lojaRazaoSocial;
        empresa.NomeFantasia = lojaNomeFantasia;
        empresa.Cnpj = lojaCnpj;
        db.SaveChanges();
    }

    // 2. Usuário Administrador (lipehsilva666@gmail.com e admin@gravitycar.com)
    var userEmail = "lipehsilva666@gmail.com";
    var adminUser = db.Usuarios.IgnoreQueryFilters().FirstOrDefault(u => u.Email == userEmail);
    if (adminUser == null)
    {
        adminUser = new GravityCarSystem.Domain.Entities.Acesso.Usuario
        {
            Id = Guid.NewGuid(),
            Nome = "Phelippe Silva",
            Email = userEmail,
            SenhaHash = BCrypt.Net.BCrypt.HashPassword("123456"),
            EmpresaId = empresaId,
            Ativo = true,
            DataCadastro = DateTime.UtcNow
        };
        db.Usuarios.Add(adminUser);
        db.SaveChanges();
    }

    var defaultAdmin = db.Usuarios.IgnoreQueryFilters().FirstOrDefault(u => u.Email == "admin@gravitycar.com");
    if (defaultAdmin == null)
    {
        defaultAdmin = new GravityCarSystem.Domain.Entities.Acesso.Usuario
        {
            Id = Guid.NewGuid(),
            Nome = "Administrador Geral",
            Email = "admin@gravitycar.com",
            SenhaHash = BCrypt.Net.BCrypt.HashPassword("123456"),
            EmpresaId = empresaId,
            Ativo = true,
            DataCadastro = DateTime.UtcNow
        };
        db.Usuarios.Add(defaultAdmin);
        db.SaveChanges();
    }

    // 3. Clientes Iniciais (Garantir no mínimo 20 clientes completos)
    if (db.Clientes.IgnoreQueryFilters().Count() < 20)
    {
        var clientesExistentes = db.Clientes.IgnoreQueryFilters().Select(c => c.CpfCnpj).ToHashSet();
        var listaNovosClientes = new List<GravityCarSystem.Domain.Entities.Cadastros.Cliente>
        {
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, NomeRazaoSocial = "Carlos Eduardo Santos", CpfCnpj = "123.456.789-00", Email = "carlos.santos@email.com", Telefone = "(11) 98765-4321", Celular = "(11) 98765-4321", Logradouro = "Av. Paulista", Numero = "1500", Bairro = "Bela Vista", Cidade = "São Paulo", Estado = "SP", Cep = "01310-100", Ativo = true, DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, NomeRazaoSocial = "Mariana Albuquerque Ferreira", CpfCnpj = "987.654.321-11", Email = "mariana.albuquerque@email.com", Telefone = "(11) 91234-5678", Celular = "(11) 91234-5678", Logradouro = "Rua Oscar Freire", Numero = "720", Bairro = "Cerqueira César", Cidade = "São Paulo", Estado = "SP", Cep = "01426-001", Ativo = true, DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, NomeRazaoSocial = "Roberto Dias Alencar", CpfCnpj = "234.567.890-12", Email = "roberto.alencar@email.com", Telefone = "(31) 98765-1122", Celular = "(31) 98765-1122", Logradouro = "Av. Afonso Pena", Numero = "2200", Bairro = "Funcionários", Cidade = "Belo Horizonte", Estado = "MG", Cep = "30130-007", Ativo = true, DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, NomeRazaoSocial = "Camila Silveira Duarte", CpfCnpj = "345.678.901-23", Email = "camila.duarte@email.com", Telefone = "(31) 99123-3344", Celular = "(31) 99123-3344", Logradouro = "Alameda da Serra", Numero = "890", Bairro = "Vila da Serra", Cidade = "Nova Lima", Estado = "MG", Cep = "34000-000", Ativo = true, DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, NomeRazaoSocial = "Lucas Mendes de Paula", CpfCnpj = "456.789.012-34", Email = "lucas.mendes@email.com", Telefone = "(31) 98877-5566", Celular = "(31) 98877-5566", Logradouro = "Av. João César de Oliveira", Numero = "1420", Bairro = "Eldorado", Cidade = "Contagem", Estado = "MG", Cep = "32315-000", Ativo = true, DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, NomeRazaoSocial = "Fernanda Vasconcelos Lima", CpfCnpj = "567.890.123-45", Email = "fernanda.vasconcelos@email.com", Telefone = "(11) 97654-2211", Celular = "(11) 97654-2211", Logradouro = "Rua Domingos de Morais", Numero = "1800", Bairro = "Vila Mariana", Cidade = "São Paulo", Estado = "SP", Cep = "04010-200", Ativo = true, DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, NomeRazaoSocial = "Rodrigo Guimarães Ribeiro", CpfCnpj = "678.901.234-56", Email = "rodrigo.ribeiro@email.com", Telefone = "(19) 98112-9988", Celular = "(19) 98112-9988", Logradouro = "Av. José de Souza Campos", Numero = "550", Bairro = "Cambuí", Cidade = "Campinas", Estado = "SP", Cep = "13025-320", Ativo = true, DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, NomeRazaoSocial = "Juliana Castro Barreto", CpfCnpj = "789.012.345-67", Email = "juliana.barreto@email.com", Telefone = "(21) 99345-6677", Celular = "(21) 99345-6677", Logradouro = "Av. Atlântica", Numero = "2600", Bairro = "Copacabana", Cidade = "Rio de Janeiro", Estado = "RJ", Cep = "22070-000", Ativo = true, DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, NomeRazaoSocial = "Thiago Henrique Nogueira", CpfCnpj = "890.123.456-78", Email = "thiago.nogueira@email.com", Telefone = "(31) 99554-1234", Celular = "(31) 99554-1234", Logradouro = "Av. Amazonas", Numero = "410", Bairro = "Centro", Cidade = "Betim", Estado = "MG", Cep = "32600-080", Ativo = true, DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, NomeRazaoSocial = "Patrícia Helena Moreira", CpfCnpj = "901.234.567-89", Email = "patricia.moreira@email.com", Telefone = "(34) 98443-5566", Celular = "(34) 98443-5566", Logradouro = "Av. Rondon Pacheco", Numero = "3100", Bairro = "Tibery", Cidade = "Uberlândia", Estado = "MG", Cep = "38405-142", Ativo = true, DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, NomeRazaoSocial = "Bruno Cesar Faria", CpfCnpj = "112.233.445-56", Email = "bruno.faria@email.com", Telefone = "(32) 98665-4321", Celular = "(32) 98665-4321", Logradouro = "Av. Barão do Rio Branco", Numero = "1980", Bairro = "Centro", Cidade = "Juiz de Fora", Estado = "MG", Cep = "36015-510", Ativo = true, DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, NomeRazaoSocial = "Vanessa Cristina Prado", CpfCnpj = "223.344.556-67", Email = "vanessa.prado@email.com", Telefone = "(16) 99123-4567", Celular = "(16) 99123-4567", Logradouro = "Av. Presidente Vargas", Numero = "1200", Bairro = "Jardim América", Cidade = "Ribeirão Preto", Estado = "SP", Cep = "14020-260", Ativo = true, DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, NomeRazaoSocial = "Gabriel Antunes Rezende", CpfCnpj = "334.455.667-78", Email = "gabriel.rezende@email.com", Telefone = "(31) 98765-8899", Celular = "(31) 98765-8899", Logradouro = "Rua Guajajaras", Numero = "650", Bairro = "Lourdes", Cidade = "Belo Horizonte", Estado = "MG", Cep = "30180-100", Ativo = true, DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, NomeRazaoSocial = "Aline Beatriz Fontes", CpfCnpj = "445.566.778-89", Email = "aline.fontes@email.com", Telefone = "(11) 99234-5678", Celular = "(11) 99234-5678", Logradouro = "Av. Portugal", Numero = "780", Bairro = "Centro", Cidade = "Santo André", Estado = "SP", Cep = "09040-010", Ativo = true, DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, NomeRazaoSocial = "Diego Martins Carvalho", CpfCnpj = "556.677.889-90", Email = "diego.carvalho@email.com", Telefone = "(31) 98332-1144", Celular = "(31) 98332-1144", Logradouro = "Rua Lassance Cunha", Numero = "420", Bairro = "Canaã", Cidade = "Sete Lagoas", Estado = "MG", Cep = "35700-024", Ativo = true, DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, NomeRazaoSocial = "Larissa Morais Pinheiro", CpfCnpj = "667.788.990-01", Email = "larissa.pinheiro@email.com", Telefone = "(31) 99778-2233", Celular = "(31) 99778-2233", Logradouro = "Av. Carlos Chagas", Numero = "310", Bairro = "Cidade Nobre", Cidade = "Ipatinga", Estado = "MG", Cep = "35162-359", Ativo = true, DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, NomeRazaoSocial = "Marcelo Augusto Borges", CpfCnpj = "778.899.001-12", Email = "marcelo.borges@email.com", Telefone = "(21) 98123-7788", Celular = "(21) 98123-7788", Logradouro = "Rua Coronel Moreira César", Numero = "160", Bairro = "Icaraí", Cidade = "Niterói", Estado = "RJ", Cep = "24230-061", Ativo = true, DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, NomeRazaoSocial = "Renata Azevedo Pires", CpfCnpj = "889.900.112-23", Email = "renata.pires@email.com", Telefone = "(38) 98899-0011", Celular = "(38) 98899-0011", Logradouro = "Av. Deputado Esteves Rodrigues", Numero = "950", Bairro = "Melo", Cidade = "Montes Claros", Estado = "MG", Cep = "39401-051", Ativo = true, DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, NomeRazaoSocial = "Gustavo Silveira Bueno", CpfCnpj = "990.011.223-34", Email = "gustavo.bueno@email.com", Telefone = "(11) 97345-6677", Celular = "(11) 97345-6677", Logradouro = "Rua Marechal Deodoro", Numero = "1200", Bairro = "Centro", Cidade = "São Bernardo do Campo", Estado = "SP", Cep = "09710-001", Ativo = true, DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, NomeRazaoSocial = "Letícia Toledo Magalhães", CpfCnpj = "001.122.334-45", Email = "leticia.magalhaes@email.com", Telefone = "(35) 99456-7890", Celular = "(35) 99456-7890", Logradouro = "Praça Pedro Sanches", Numero = "110", Bairro = "Centro", Cidade = "Poços de Caldas", Estado = "MG", Cep = "37701-000", Ativo = true, DataCadastro = DateTime.UtcNow }
        };

        foreach (var c in listaNovosClientes)
        {
            if (!clientesExistentes.Contains(c.CpfCnpj))
            {
                db.Clientes.Add(c);
            }
        }
        db.SaveChanges();
    }

    // 4. Veículos no Estoque (Garantir no mínimo 20 veículos diversificados)
    if (db.Veiculos.IgnoreQueryFilters().Count() < 20)
    {
        var placasExistentes = db.Veiculos.IgnoreQueryFilters().Select(v => v.Placa).ToHashSet();
        var listaNovosVeiculos = new List<GravityCarSystem.Domain.Entities.Veiculos.Veiculo>
        {
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, Marca = "Toyota", Modelo = "Corolla", Versao = "2.0 XEi 16V Flex Automático", AnoFabricacao = 2023, AnoModelo = 2024, Placa = "GRA-2024", Cor = "Prata", Combustivel = "Flex", Cambio = "Automático", Quilometragem = 18500, ValorCompra = 125000m, ValorVenda = 142900m, DataEntrada = DateTime.UtcNow.AddDays(-20), Status = GravityCarSystem.Domain.Enums.StatusVeiculo.Disponivel, Observacoes = "Veículo impecável, único dono, todas revisões em concessionária.", DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, Marca = "Honda", Modelo = "Civic", Versao = "Touring 1.5 Turbo Automático", AnoFabricacao = 2022, AnoModelo = 2022, Placa = "GCS-7788", Cor = "Preto Cristal", Combustivel = "Gasolina", Cambio = "CVT", Quilometragem = 32000, ValorCompra = 138000m, ValorVenda = 156900m, DataEntrada = DateTime.UtcNow.AddDays(-15), Status = GravityCarSystem.Domain.Enums.StatusVeiculo.Disponivel, Observacoes = "Teto solar, sensor de ponto cego, interior em couro claro e som premium.", DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, Marca = "Jeep", Modelo = "Compass", Versao = "Longitude 1.3 Turbo Flex", AnoFabricacao = 2023, AnoModelo = 2023, Placa = "XYZ-9900", Cor = "Branco Polar", Combustivel = "Flex", Cambio = "Automático", Quilometragem = 21000, ValorCompra = 145000m, ValorVenda = 164500m, DataEntrada = DateTime.UtcNow.AddDays(-10), Status = GravityCarSystem.Domain.Enums.StatusVeiculo.Disponivel, Observacoes = "Pacote 80 Anos, painel 100% digital, central multimídia 10.1\".", DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, Marca = "Volkswagen", Modelo = "Nivus", Versao = "Highline 1.0 200 TSI", AnoFabricacao = 2024, AnoModelo = 2024, Placa = "NIV-2024", Cor = "Cinza Moonstone", Combustivel = "Flex", Cambio = "Automático", Quilometragem = 8900, ValorCompra = 112000m, ValorVenda = 127900m, DataEntrada = DateTime.UtcNow.AddDays(-5), Status = GravityCarSystem.Domain.Enums.StatusVeiculo.Disponivel, Observacoes = "Estado de 0km, garantia de fábrica até 2027, piloto automático adaptativo.", DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, Marca = "Jeep", Modelo = "Renegade", Versao = "Longitude 1.3 Turbo Flex", AnoFabricacao = 2023, AnoModelo = 2023, Placa = "JEP-3C21", Cor = "Prata Billet", Combustivel = "Flex", Cambio = "Automático", Quilometragem = 24500, ValorCompra = 91000m, ValorVenda = 104900m, DataEntrada = DateTime.UtcNow.AddDays(-12), Status = GravityCarSystem.Domain.Enums.StatusVeiculo.Disponivel, Observacoes = "Faróis Full LED, bancos em couro preto, rodas aro 18.", DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, Marca = "Volkswagen", Modelo = "T-Cross", Versao = "Highline 1.4 250 TSI", AnoFabricacao = 2024, AnoModelo = 2024, Placa = "TCX-4F55", Cor = "Branco Puro", Combustivel = "Flex", Cambio = "Automático", Quilometragem = 12000, ValorCompra = 131000m, ValorVenda = 148900m, DataEntrada = DateTime.UtcNow.AddDays(-8), Status = GravityCarSystem.Domain.Enums.StatusVeiculo.Disponivel, Observacoes = "Teto solar panorâmico Sky View, painel digital Active Info Display.", DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, Marca = "Hyundai", Modelo = "Creta", Versao = "Platinum 1.0 TGDI", AnoFabricacao = 2023, AnoModelo = 2023, Placa = "CRT-8A90", Cor = "Cinza Silk", Combustivel = "Flex", Cambio = "Automático", Quilometragem = 28000, ValorCompra = 111000m, ValorVenda = 126900m, DataEntrada = DateTime.UtcNow.AddDays(-18), Status = GravityCarSystem.Domain.Enums.StatusVeiculo.Disponivel, Observacoes = "Câmera 360 graus, ventilação de bancos, teto panorâmico.", DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, Marca = "Chevrolet", Modelo = "Tracker", Versao = "Premier 1.2 Turbo", AnoFabricacao = 2023, AnoModelo = 2024, Placa = "TRK-2B14", Cor = "Azul Eclipse", Combustivel = "Flex", Cambio = "Automático", Quilometragem = 19300, ValorCompra = 114500m, ValorVenda = 129900m, DataEntrada = DateTime.UtcNow.AddDays(-14), Status = GravityCarSystem.Domain.Enums.StatusVeiculo.Disponivel, Observacoes = "Estacionamento automático Park Assist, Wi-Fi integrado, teto solar.", DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, Marca = "Fiat", Modelo = "Fastback", Versao = "Limited Edition Powered by Abarth 1.3", AnoFabricacao = 2023, AnoModelo = 2024, Placa = "FSB-5E77", Cor = "Preto Vulcano", Combustivel = "Flex", Cambio = "Automático", Quilometragem = 16800, ValorCompra = 118000m, ValorVenda = 134900m, DataEntrada = DateTime.UtcNow.AddDays(-7), Status = GravityCarSystem.Domain.Enums.StatusVeiculo.Disponivel, Observacoes = "Motor turbo de 185cv, porta-malas de 600 litros, design coupé esportivo.", DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, Marca = "Toyota", Modelo = "Hilux", Versao = "SRX 2.8 TDI 4x4 Automática", AnoFabricacao = 2022, AnoModelo = 2023, Placa = "HLX-9D82", Cor = "Branco Polar", Combustivel = "Diesel", Cambio = "Automático", Quilometragem = 48000, ValorCompra = 239000m, ValorVenda = 268000m, DataEntrada = DateTime.UtcNow.AddDays(-22), Status = GravityCarSystem.Domain.Enums.StatusVeiculo.Disponivel, Observacoes = "Tração 4x4 com reduzida, som premium JBL, protetor de caçamba e capota marítima.", DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, Marca = "Honda", Modelo = "HR-V", Versao = "Touring 1.5 Turbo Flex", AnoFabricacao = 2023, AnoModelo = 2024, Placa = "HRV-7G31", Cor = "Vermelho Vênus", Combustivel = "Flex", Cambio = "CVT", Quilometragem = 15200, ValorCompra = 154000m, ValorVenda = 174900m, DataEntrada = DateTime.UtcNow.AddDays(-11), Status = GravityCarSystem.Domain.Enums.StatusVeiculo.Disponivel, Observacoes = "Pacote Honda Sensing de segurança ativa, abertura de porta-malas por sensor.", DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, Marca = "Chevrolet", Modelo = "Onix Plus", Versao = "Premier 1.0 Turbo", AnoFabricacao = 2023, AnoModelo = 2023, Placa = "ONX-6H19", Cor = "Cinza Drake", Combustivel = "Flex", Cambio = "Automático", Quilometragem = 31000, ValorCompra = 78000m, ValorVenda = 89900m, DataEntrada = DateTime.UtcNow.AddDays(-16), Status = GravityCarSystem.Domain.Enums.StatusVeiculo.Disponivel, Observacoes = "Extremamente econômico, chave presencial, carregador sem fio.", DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, Marca = "Hyundai", Modelo = "HB20", Versao = "Diamond Plus 1.0 TGDI", AnoFabricacao = 2023, AnoModelo = 2024, Placa = "HBX-1J45", Cor = "Prata Sand", Combustivel = "Flex", Cambio = "Automático", Quilometragem = 21000, ValorCompra = 75000m, ValorVenda = 86900m, DataEntrada = DateTime.UtcNow.AddDays(-9), Status = GravityCarSystem.Domain.Enums.StatusVeiculo.Disponivel, Observacoes = "Frenagem autônoma de emergência, alerta de mudança de faixa, partida remota.", DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, Marca = "Volkswagen", Modelo = "Polo", Versao = "GTS 1.4 250 TSI", AnoFabricacao = 2023, AnoModelo = 2023, Placa = "PLO-3K88", Cor = "Vermelho Sunset", Combustivel = "Flex", Cambio = "Automático", Quilometragem = 27500, ValorCompra = 104000m, ValorVenda = 119900m, DataEntrada = DateTime.UtcNow.AddDays(-13), Status = GravityCarSystem.Domain.Enums.StatusVeiculo.Disponivel, Observacoes = "Faróis IQ.Light matriciais, bancos esportivos inteiriços, seletor de condução.", DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, Marca = "Nissan", Modelo = "Kicks", Versao = "Advance 1.6 16V Flex", AnoFabricacao = 2022, AnoModelo = 2023, Placa = "KCK-8M12", Cor = "Branco Diamond", Combustivel = "Flex", Cambio = "CVT", Quilometragem = 35000, ValorCompra = 85500m, ValorVenda = 98900m, DataEntrada = DateTime.UtcNow.AddDays(-19), Status = GravityCarSystem.Domain.Enums.StatusVeiculo.Disponivel, Observacoes = "Bancos com tecnologia Zero Gravity, painel multifuncional em HD.", DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, Marca = "BMW", Modelo = "320i", Versao = "M Sport 2.0 Turbo ActiveFlex", AnoFabricacao = 2022, AnoModelo = 2022, Placa = "BMW-3F20", Cor = "Azul Portimao", Combustivel = "Flex", Cambio = "Automático", Quilometragem = 33000, ValorCompra = 229000m, ValorVenda = 259900m, DataEntrada = DateTime.UtcNow.AddDays(-25), Status = GravityCarSystem.Domain.Enums.StatusVeiculo.Disponivel, Observacoes = "Kit M Sport original, pinças de freio M azuis, teto solar, som Harman Kardon.", DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, Marca = "Ford", Modelo = "Ranger", Versao = "Limited 3.0 V6 Turbo Diesel 4x4", AnoFabricacao = 2024, AnoModelo = 2024, Placa = "RNG-4P60", Cor = "Laranja Terra", Combustivel = "Diesel", Cambio = "Automático", Quilometragem = 9400, ValorCompra = 269000m, ValorVenda = 299900m, DataEntrada = DateTime.UtcNow.AddDays(-6), Status = GravityCarSystem.Domain.Enums.StatusVeiculo.Disponivel, Observacoes = "Nova geração Ford Ranger com motor V6 de 250cv, tela vertical Sync 4 de 12\".", DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, Marca = "Peugeot", Modelo = "208", Versao = "Griffe 1.0 Turbo 200", AnoFabricacao = 2024, AnoModelo = 2024, Placa = "PGT-2R80", Cor = "Cinza Artense", Combustivel = "Flex", Cambio = "CVT", Quilometragem = 11200, ValorCompra = 89000m, ValorVenda = 103900m, DataEntrada = DateTime.UtcNow.AddDays(-4), Status = GravityCarSystem.Domain.Enums.StatusVeiculo.Disponivel, Observacoes = "i-Cockpit 3D holográfico, teto panorâmico integral, faróis DRL dente de sabre.", DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, Marca = "Renault", Modelo = "Duster", Versao = "Iconic 1.3 TCe Turbo", AnoFabricacao = 2023, AnoModelo = 2023, Placa = "DST-9S44", Cor = "Marrom Vison", Combustivel = "Flex", Cambio = "CVT", Quilometragem = 29800, ValorCompra = 94000m, ValorVenda = 107900m, DataEntrada = DateTime.UtcNow.AddDays(-17), Status = GravityCarSystem.Domain.Enums.StatusVeiculo.Disponivel, Observacoes = "Motor turbo desenvolvido em parceria com a Mercedes-Benz, robustez e espaço interno.", DataCadastro = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), EmpresaId = empresaId, Marca = "Audi", Modelo = "Q3", Versao = "Black Edition 1.4 TFSI", AnoFabricacao = 2022, AnoModelo = 2022, Placa = "AUD-1Q33", Cor = "Cinza Daytona", Combustivel = "Gasolina", Cambio = "S-Tronic", Quilometragem = 36000, ValorCompra = 189000m, ValorVenda = 214900m, DataEntrada = DateTime.UtcNow.AddDays(-21), Status = GravityCarSystem.Domain.Enums.StatusVeiculo.Disponivel, Observacoes = "Acabamento Black piano, pacote S-Line, cockpit virtual de 12.3 polegadas.", DataCadastro = DateTime.UtcNow }
        };

        foreach (var v in listaNovosVeiculos)
        {
            if (!placasExistentes.Contains(v.Placa))
            {
                db.Veiculos.Add(v);
            }
        }
        db.SaveChanges();
    }

    // 5. Fotos dos Veículos em Estoque
    var veiculoIdsComFoto = db.VeiculoFotos.Select(f => f.VeiculoId).Distinct().ToList();
    var veiculosSemFoto = db.Veiculos.AsNoTracking().Where(v => !veiculoIdsComFoto.Contains(v.Id)).ToList();
    if (veiculosSemFoto.Any())
    {
        foreach (var v in veiculosSemFoto)
        {
            string fotoUrl = (v.Modelo ?? "").ToLower() switch
            {
                var m when m.Contains("corolla") => "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&auto=format&fit=crop&q=80",
                var m when m.Contains("civic") => "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&auto=format&fit=crop&q=80",
                var m when m.Contains("compass") => "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800&auto=format&fit=crop&q=80",
                var m when m.Contains("renegade") => "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80",
                var m when m.Contains("nivus") => "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80",
                var m when m.Contains("t-cross") => "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80",
                var m when m.Contains("creta") => "https://images.unsplash.com/photo-1508974239320-0a029497e820?w=800&auto=format&fit=crop&q=80",
                var m when m.Contains("tracker") => "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80",
                var m when m.Contains("fastback") => "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&auto=format&fit=crop&q=80",
                var m when m.Contains("hilux") => "https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800&auto=format&fit=crop&q=80",
                var m when m.Contains("hr-v") => "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&auto=format&fit=crop&q=80",
                var m when m.Contains("onix") => "https://images.unsplash.com/photo-1541443131876-44b03de101c5?w=800&auto=format&fit=crop&q=80",
                var m when m.Contains("hb20") => "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&auto=format&fit=crop&q=80",
                var m when m.Contains("polo") => "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&auto=format&fit=crop&q=80",
                var m when m.Contains("kicks") => "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&auto=format&fit=crop&q=80",
                var m when m.Contains("bmw") || m.Contains("320i") => "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop&q=80",
                var m when m.Contains("ranger") => "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80",
                var m when m.Contains("208") => "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&auto=format&fit=crop&q=80",
                var m when m.Contains("duster") => "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&auto=format&fit=crop&q=80",
                var m when m.Contains("q3") || m.Contains("audi") => "https://images.unsplash.com/photo-1541348263662-e0c86437db7b?w=800&auto=format&fit=crop&q=80",
                _ => "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80"
            };

            db.VeiculoFotos.Add(new GravityCarSystem.Domain.Entities.Veiculos.VeiculoFoto
            {
                Id = Guid.NewGuid(),
                VeiculoId = v.Id,
                Url = fotoUrl,
                Principal = true,
                DataCadastro = DateTime.UtcNow
            });
        }
        db.SaveChanges();
    }

    // 6. Cheques Iniciais de Demonstração para Custódia Financeira
    if (!db.Cheques.IgnoreQueryFilters().Any())
    {
        var firstCli = db.Clientes.FirstOrDefault();
        if (firstCli != null)
        {
            db.Cheques.AddRange(
                new GravityCarSystem.Domain.Entities.Negocio.Cheque
                {
                    Id = Guid.NewGuid(),
                    EmpresaId = empresaId,
                    ClienteId = firstCli.Id,
                    Valor = 15000m,
                    Banco = "Banco Itaú (341)",
                    Agencia = "1245",
                    Conta = "88902-1",
                    NumeroCheque = "001420",
                    DataEmissao = DateTime.UtcNow.AddDays(-10),
                    DataBomPara = DateTime.UtcNow.AddDays(3), // Vence em 3 dias
                    Status = GravityCarSystem.Domain.Enums.StatusCheque.Recebido,
                    Observacao = "Entrada parcial de venda - 1ª parcela"
                },
                new GravityCarSystem.Domain.Entities.Negocio.Cheque
                {
                    Id = Guid.NewGuid(),
                    EmpresaId = empresaId,
                    ClienteId = firstCli.Id,
                    Valor = 15000m,
                    Banco = "Banco Itaú (341)",
                    Agencia = "1245",
                    Conta = "88902-1",
                    NumeroCheque = "001421",
                    DataEmissao = DateTime.UtcNow.AddDays(-10),
                    DataBomPara = DateTime.UtcNow.AddDays(33), // Vence mês que vem
                    Status = GravityCarSystem.Domain.Enums.StatusCheque.Recebido,
                    Observacao = "Entrada parcial de venda - 2ª parcela"
                },
                new GravityCarSystem.Domain.Entities.Negocio.Cheque
                {
                    Id = Guid.NewGuid(),
                    EmpresaId = empresaId,
                    ClienteId = firstCli.Id,
                    Valor = 20000m,
                    Banco = "Banco Bradesco (237)",
                    Agencia = "0456",
                    Conta = "12389-0",
                    NumeroCheque = "000892",
                    DataEmissao = DateTime.UtcNow.AddDays(-20),
                    DataBomPara = DateTime.UtcNow.AddDays(-2),
                    Status = GravityCarSystem.Domain.Enums.StatusCheque.Depositado,
                    DataDeposito = DateTime.UtcNow.AddDays(-1),
                    Observacao = "Cheque depositado aguardando compensação"
                }
            );
        }
    }

    // 7. Sincronização e Liquidação de Contas a Receber de Vendas à Vista e Regularização de Saldos
    var contaFinanceira = db.ContasFinanceiras.IgnoreQueryFilters().FirstOrDefault(c => c.EmpresaId == empresaId);
    if (contaFinanceira == null)
    {
        contaFinanceira = new GravityCarSystem.Domain.Entities.Financeiro.ContaFinanceira
        {
            Id = Guid.NewGuid(),
            EmpresaId = empresaId,
            Nome = "Caixa Geral / Principal",
            Tipo = 1,
            SaldoInicial = 0,
            Ativa = true,
            DataCadastro = DateTime.UtcNow
        };
        db.ContasFinanceiras.Add(contaFinanceira);
        db.SaveChanges();
    }

    var categoriaVenda = db.CategoriasFinanceiras.IgnoreQueryFilters().FirstOrDefault(c => c.EmpresaId == empresaId && c.Nome == "Vendas de Veículos");
    if (categoriaVenda == null)
    {
        categoriaVenda = new GravityCarSystem.Domain.Entities.Financeiro.CategoriaFinanceira
        {
            Id = Guid.NewGuid(),
            EmpresaId = empresaId,
            Nome = "Vendas de Veículos",
            Tipo = 1,
            Ativa = true,
            DataCadastro = DateTime.UtcNow
        };
        db.CategoriasFinanceiras.Add(categoriaVenda);
        db.SaveChanges();
    }

    var todasContasReceber = db.ContasReceber
        .IgnoreQueryFilters()
        .ToList();

    foreach (var cr in todasContasReceber)
    {
        bool isAVista = cr.Descricao.Contains("Dinheiro") || 
                        cr.Descricao.Contains("Pix") || 
                        cr.Descricao.Contains("Cartao") || 
                        cr.Descricao.Contains("Transferencia");

        if (isAVista || cr.Status == GravityCarSystem.Domain.Enums.StatusConta.Pago)
        {
            cr.Status = GravityCarSystem.Domain.Enums.StatusConta.Pago;
            cr.ValorPago = cr.ValorOriginal;
            cr.Saldo = 0;
            if (!cr.DataPagamento.HasValue) cr.DataPagamento = cr.DataEmissao;

            if (!db.MovimentosFinanceiros.IgnoreQueryFilters().Any(m => m.ContaReceberId == cr.Id))
            {
                db.MovimentosFinanceiros.Add(new GravityCarSystem.Domain.Entities.Financeiro.MovimentoFinanceiro
                {
                    Id = Guid.NewGuid(),
                    EmpresaId = cr.EmpresaId,
                    ContaFinanceiraId = contaFinanceira.Id,
                    CategoriaId = categoriaVenda.Id,
                    Tipo = 1, // Entrada
                    Valor = cr.ValorOriginal,
                    DataMovimento = cr.DataPagamento ?? cr.DataEmissao,
                    Descricao = $"Recebimento {cr.Descricao}",
                    ContaReceberId = cr.Id,
                    VendaId = cr.VendaId
                });
            }
        }
    }
    db.SaveChanges();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseStaticFiles(); // Serve files from wwwroot
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
