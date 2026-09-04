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
builder.Services.AddScoped<GravityCarSystem.Application.Interfaces.Integracoes.ISenatranService, GravityCarSystem.Application.Services.Integracoes.SenatranMockService>();
builder.Services.AddScoped<GravityCarSystem.Application.Interfaces.IAvaliacaoService, GravityCarSystem.Application.Services.Veiculos.AvaliacaoService>();
builder.Services.AddScoped<GravityCarSystem.Application.Interfaces.IChequeService, GravityCarSystem.Application.Services.Negocio.ChequeService>();
builder.Services.AddScoped<GravityCarSystem.Application.Interfaces.Acesso.IEmpresaService, GravityCarSystem.Application.Services.Acesso.EmpresaService>();

// Database Configuration (Suporte a SQLite e SQL Server)
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
        options.UseSqlServer(connectionString)
               .AddInterceptors(interceptor);
    }
});

var app = builder.Build();

// Seed & Inicialização Automática do Banco
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();

    // 1. Empresa Padrão
    var empresaId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    var empresa = db.Empresas.FirstOrDefault(e => e.Id == empresaId);
    if (empresa == null)
    {
        empresa = new GravityCarSystem.Domain.Entities.Acesso.Empresa
        {
            Id = empresaId,
            RazaoSocial = "Gravity Motors Concessionária LTDA",
            NomeFantasia = "Gravity Motors",
            Cnpj = "12.345.678/0001-99",
            Ativa = true,
            DataCadastro = DateTime.UtcNow
        };
        db.Empresas.Add(empresa);
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

    // 3. Clientes Iniciais
    if (!db.Clientes.IgnoreQueryFilters().Any())
    {
        db.Clientes.AddRange(
            new GravityCarSystem.Domain.Entities.Cadastros.Cliente
            {
                Id = Guid.NewGuid(),
                EmpresaId = empresaId,
                NomeRazaoSocial = "Carlos Eduardo Santos",
                CpfCnpj = "123.456.789-00",
                Email = "carlos.santos@email.com",
                Telefone = "(11) 98765-4321",
                Ativo = true,
                DataCadastro = DateTime.UtcNow
            },
            new GravityCarSystem.Domain.Entities.Cadastros.Cliente
            {
                Id = Guid.NewGuid(),
                EmpresaId = empresaId,
                NomeRazaoSocial = "Mariana Albuquerque Ferreira",
                CpfCnpj = "987.654.321-11",
                Email = "mariana.albuquerque@email.com",
                Telefone = "(11) 91234-5678",
                Ativo = true,
                DataCadastro = DateTime.UtcNow
            }
        );
        db.SaveChanges();
    }

    // 4. Veículos de Amostra no Estoque
    if (!db.Veiculos.IgnoreQueryFilters().Any())
    {
        db.Veiculos.AddRange(
            new GravityCarSystem.Domain.Entities.Veiculos.Veiculo
            {
                Id = Guid.NewGuid(),
                EmpresaId = empresaId,
                Marca = "Toyota",
                Modelo = "Corolla",
                Versao = "2.0 XEi 16V Flex Automático",
                AnoFabricacao = 2023,
                AnoModelo = 2024,
                Placa = "GRA-2024",
                Cor = "Prata",
                Combustivel = "Flex",
                Cambio = "Automático",
                Quilometragem = 18500,
                ValorCompra = 125000m,
                ValorVenda = 142900m,
                DataEntrada = DateTime.UtcNow.AddDays(-20),
                Status = GravityCarSystem.Domain.Enums.StatusVeiculo.Disponivel,
                Observacoes = "Veículo impecável, único dono, revisões na concessionária.",
                DataCadastro = DateTime.UtcNow
            },
            new GravityCarSystem.Domain.Entities.Veiculos.Veiculo
            {
                Id = Guid.NewGuid(),
                EmpresaId = empresaId,
                Marca = "Honda",
                Modelo = "Civic",
                Versao = "Touring 1.5 Turbo Automático",
                AnoFabricacao = 2022,
                AnoModelo = 2022,
                Placa = "GCS-7788",
                Cor = "Preto Cristal",
                Combustivel = "Gasolina",
                Cambio = "CVT",
                Quilometragem = 32000,
                ValorCompra = 138000m,
                ValorVenda = 156900m,
                DataEntrada = DateTime.UtcNow.AddDays(-15),
                Status = GravityCarSystem.Domain.Enums.StatusVeiculo.Disponivel,
                Observacoes = "Teto solar, sensor de ponto cego, interior em couro claro.",
                DataCadastro = DateTime.UtcNow
            },
            new GravityCarSystem.Domain.Entities.Veiculos.Veiculo
            {
                Id = Guid.NewGuid(),
                EmpresaId = empresaId,
                Marca = "Jeep",
                Modelo = "Compass",
                Versao = "Longitude 1.3 Turbo Flex",
                AnoFabricacao = 2023,
                AnoModelo = 2023,
                Placa = "XYZ-9900",
                Cor = "Branco Polar",
                Combustivel = "Flex",
                Cambio = "Automático",
                Quilometragem = 21000,
                ValorCompra = 145000m,
                ValorVenda = 164500m,
                DataEntrada = DateTime.UtcNow.AddDays(-10),
                Status = GravityCarSystem.Domain.Enums.StatusVeiculo.Disponivel,
                Observacoes = "Pacote 80 Anos, painel digital, som Beats.",
                DataCadastro = DateTime.UtcNow
            },
            new GravityCarSystem.Domain.Entities.Veiculos.Veiculo
            {
                Id = Guid.NewGuid(),
                EmpresaId = empresaId,
                Marca = "Volkswagen",
                Modelo = "Nivus",
                Versao = "Highline 1.0 200 TSI",
                AnoFabricacao = 2024,
                AnoModelo = 2024,
                Placa = "NIV-2024",
                Cor = "Cinza Moonstone",
                Combustivel = "Flex",
                Cambio = "Automático",
                Quilometragem = 8900,
                ValorCompra = 112000m,
                ValorVenda = 127900m,
                DataEntrada = DateTime.UtcNow.AddDays(-5),
                Status = GravityCarSystem.Domain.Enums.StatusVeiculo.Disponivel,
                Observacoes = "Estado de 0km, garantia de fábrica até 2027.",
                DataCadastro = DateTime.UtcNow
            }
        );
        db.SaveChanges();
    }
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
