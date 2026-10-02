using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MotorsXySystem.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Empresas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RazaoSocial = table.Column<string>(type: "text", nullable: false),
                    NomeFantasia = table.Column<string>(type: "text", nullable: false),
                    Cnpj = table.Column<string>(type: "text", nullable: true),
                    LogoUrl = table.Column<string>(type: "text", nullable: true),
                    TemaCorPrincipal = table.Column<string>(type: "text", nullable: true),
                    TemaCorSecundaria = table.Column<string>(type: "text", nullable: true),
                    DataCriacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CriadoPor = table.Column<string>(type: "text", nullable: true),
                    DataAtualizacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AtualizadoPor = table.Column<string>(type: "text", nullable: true),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Empresas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Veiculos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Placa = table.Column<string>(type: "text", nullable: true),
                    Renavam = table.Column<string>(type: "text", nullable: true),
                    Chassi = table.Column<string>(type: "text", nullable: true),
                    Tipo = table.Column<int>(type: "integer", nullable: false),
                    Marca = table.Column<string>(type: "text", nullable: false),
                    Modelo = table.Column<string>(type: "text", nullable: false),
                    Versao = table.Column<string>(type: "text", nullable: false),
                    AnoFabricacao = table.Column<short>(type: "smallint", nullable: true),
                    AnoModelo = table.Column<short>(type: "smallint", nullable: true),
                    Cor = table.Column<string>(type: "text", nullable: true),
                    Combustivel = table.Column<string>(type: "text", nullable: true),
                    Cambio = table.Column<string>(type: "text", nullable: true),
                    Quilometragem = table.Column<int>(type: "integer", nullable: true),
                    Cilindrada = table.Column<int>(type: "integer", nullable: true),
                    CategoriaMoto = table.Column<int>(type: "integer", nullable: true),
                    TipoRefrigeracao = table.Column<string>(type: "text", nullable: true),
                    TipoFreio = table.Column<string>(type: "text", nullable: true),
                    PossuiABS = table.Column<bool>(type: "boolean", nullable: true),
                    HabilitacaoNecessaria = table.Column<string>(type: "text", nullable: true),
                    NumeroPortas = table.Column<int>(type: "integer", nullable: true),
                    NumeroLugares = table.Column<int>(type: "integer", nullable: true),
                    Carroceria = table.Column<int>(type: "integer", nullable: true),
                    Motorizacao = table.Column<decimal>(type: "numeric", nullable: true),
                    ValorCompra = table.Column<decimal>(type: "numeric", nullable: true),
                    ValorVenda = table.Column<decimal>(type: "numeric", nullable: true),
                    ValorFipe = table.Column<decimal>(type: "numeric", nullable: true),
                    DataEntrada = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DataVenda = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Consignado = table.Column<bool>(type: "boolean", nullable: false),
                    Observacoes = table.Column<string>(type: "text", nullable: true),
                    DataCriacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CriadoPor = table.Column<string>(type: "text", nullable: true),
                    DataAtualizacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AtualizadoPor = table.Column<string>(type: "text", nullable: true),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false),
                    EmpresaId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Veiculos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Assinaturas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EmpresaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Plano = table.Column<int>(type: "integer", nullable: false),
                    DataInicio = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DataFim = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Ativa = table.Column<bool>(type: "boolean", nullable: false),
                    ValorMensal = table.Column<decimal>(type: "numeric", nullable: false),
                    DataCriacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CriadoPor = table.Column<string>(type: "text", nullable: true),
                    DataAtualizacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AtualizadoPor = table.Column<string>(type: "text", nullable: true),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Assinaturas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Assinaturas_Empresas_EmpresaId",
                        column: x => x.EmpresaId,
                        principalTable: "Empresas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VeiculoAcessorios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VeiculoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "text", nullable: false),
                    Descricao = table.Column<string>(type: "text", nullable: true),
                    Valor = table.Column<decimal>(type: "numeric", nullable: true),
                    Incluso = table.Column<bool>(type: "boolean", nullable: false),
                    DataCriacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CriadoPor = table.Column<string>(type: "text", nullable: true),
                    DataAtualizacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AtualizadoPor = table.Column<string>(type: "text", nullable: true),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false),
                    EmpresaId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VeiculoAcessorios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VeiculoAcessorios_Veiculos_VeiculoId",
                        column: x => x.VeiculoId,
                        principalTable: "Veiculos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VeiculoInspecoes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VeiculoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Item = table.Column<string>(type: "text", nullable: false),
                    Aprovado = table.Column<bool>(type: "boolean", nullable: false),
                    Observacao = table.Column<string>(type: "text", nullable: true),
                    DataInspecao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    InspecionadoPor = table.Column<string>(type: "text", nullable: true),
                    DataCriacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CriadoPor = table.Column<string>(type: "text", nullable: true),
                    DataAtualizacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AtualizadoPor = table.Column<string>(type: "text", nullable: true),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false),
                    EmpresaId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VeiculoInspecoes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VeiculoInspecoes_Veiculos_VeiculoId",
                        column: x => x.VeiculoId,
                        principalTable: "Veiculos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Assinaturas_EmpresaId",
                table: "Assinaturas",
                column: "EmpresaId");

            migrationBuilder.CreateIndex(
                name: "IX_VeiculoAcessorios_VeiculoId",
                table: "VeiculoAcessorios",
                column: "VeiculoId");

            migrationBuilder.CreateIndex(
                name: "IX_VeiculoInspecoes_VeiculoId",
                table: "VeiculoInspecoes",
                column: "VeiculoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Assinaturas");

            migrationBuilder.DropTable(
                name: "VeiculoAcessorios");

            migrationBuilder.DropTable(
                name: "VeiculoInspecoes");

            migrationBuilder.DropTable(
                name: "Empresas");

            migrationBuilder.DropTable(
                name: "Veiculos");
        }
    }
}
