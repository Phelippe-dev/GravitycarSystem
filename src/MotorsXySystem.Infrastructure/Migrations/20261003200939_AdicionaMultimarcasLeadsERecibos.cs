using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MotorsXySystem.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AdicionaMultimarcasLeadsERecibos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "NumeroVenda",
                table: "Vendas",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "UsuarioId",
                table: "Vendas",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "CodigoFipe",
                table: "Veiculos",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DataConsultaFipe",
                table: "Veiculos",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MesReferenciaFipe",
                table: "Veiculos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Partida",
                table: "Veiculos",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Refrigeracao",
                table: "Veiculos",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Cep",
                table: "Empresas",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Cidade",
                table: "Empresas",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Empresas",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Endereco",
                table: "Empresas",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InscricaoEstadual",
                table: "Empresas",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LeadApiKey",
                table: "Empresas",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Slug",
                table: "Empresas",
                type: "character varying(63)",
                maxLength: 63,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Telefone",
                table: "Empresas",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TermoGarantiaPadrao",
                table: "Empresas",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Uf",
                table: "Empresas",
                type: "character varying(2)",
                maxLength: 2,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Leads",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Email = table.Column<string>(type: "text", nullable: true),
                    Telefone = table.Column<string>(type: "text", nullable: true),
                    Mensagem = table.Column<string>(type: "text", nullable: true),
                    Estagio = table.Column<int>(type: "integer", nullable: false),
                    Ordem = table.Column<int>(type: "integer", nullable: false),
                    TipoOportunidade = table.Column<int>(type: "integer", nullable: false),
                    Origem = table.Column<int>(type: "integer", nullable: false),
                    Canal = table.Column<string>(type: "text", nullable: true),
                    UtmSource = table.Column<string>(type: "text", nullable: true),
                    UtmMedium = table.Column<string>(type: "text", nullable: true),
                    UtmCampaign = table.Column<string>(type: "text", nullable: true),
                    MotivoPerda = table.Column<string>(type: "text", nullable: true),
                    ValorEstimado = table.Column<decimal>(type: "numeric", nullable: true),
                    DataProximoContato = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DataFechamento = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    InteresseTipo = table.Column<int>(type: "integer", nullable: true),
                    InteresseMarca = table.Column<string>(type: "text", nullable: true),
                    InteresseModelo = table.Column<string>(type: "text", nullable: true),
                    InteressePrecoMin = table.Column<decimal>(type: "numeric", nullable: true),
                    InteressePrecoMax = table.Column<decimal>(type: "numeric", nullable: true),
                    InteresseAnoMin = table.Column<short>(type: "smallint", nullable: true),
                    InteresseAnoMax = table.Column<short>(type: "smallint", nullable: true),
                    VeiculoInteresseId = table.Column<Guid>(type: "uuid", nullable: true),
                    ClienteId = table.Column<Guid>(type: "uuid", nullable: true),
                    ResponsavelId = table.Column<Guid>(type: "uuid", nullable: true),
                    DataCriacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CriadoPor = table.Column<string>(type: "text", nullable: true),
                    DataAtualizacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AtualizadoPor = table.Column<string>(type: "text", nullable: true),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false),
                    EmpresaId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Leads", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Leads_Clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Leads_Veiculos_VeiculoInteresseId",
                        column: x => x.VeiculoInteresseId,
                        principalTable: "Veiculos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Recibos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Numero = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Tipo = table.Column<int>(type: "integer", nullable: false),
                    VendaId = table.Column<Guid>(type: "uuid", nullable: true),
                    ClienteId = table.Column<Guid>(type: "uuid", nullable: true),
                    VeiculoId = table.Column<Guid>(type: "uuid", nullable: true),
                    ValorTotal = table.Column<decimal>(type: "numeric", nullable: false),
                    ValorRecebido = table.Column<decimal>(type: "numeric", nullable: false),
                    DadosJson = table.Column<string>(type: "text", nullable: false),
                    HashSha256 = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    PdfSha256 = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    EmitidoEmUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EmitidoPorId = table.Column<Guid>(type: "uuid", nullable: true),
                    Pdf = table.Column<byte[]>(type: "bytea", nullable: false),
                    Cancelado = table.Column<bool>(type: "boolean", nullable: false),
                    MotivoCancelamento = table.Column<string>(type: "text", nullable: true),
                    StatusAssinatura = table.Column<int>(type: "integer", nullable: false),
                    ProvedorAssinatura = table.Column<string>(type: "text", nullable: true),
                    IdExternoAssinatura = table.Column<string>(type: "text", nullable: true),
                    UrlAssinatura = table.Column<string>(type: "text", nullable: true),
                    DataAssinatura = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PdfAssinado = table.Column<byte[]>(type: "bytea", nullable: true),
                    DataCriacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CriadoPor = table.Column<string>(type: "text", nullable: true),
                    DataAtualizacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AtualizadoPor = table.Column<string>(type: "text", nullable: true),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false),
                    EmpresaId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Recibos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LeadInteracoes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LeadId = table.Column<Guid>(type: "uuid", nullable: false),
                    Tipo = table.Column<string>(type: "text", nullable: false),
                    Descricao = table.Column<string>(type: "text", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: true),
                    DataCriacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CriadoPor = table.Column<string>(type: "text", nullable: true),
                    DataAtualizacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AtualizadoPor = table.Column<string>(type: "text", nullable: true),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false),
                    EmpresaId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LeadInteracoes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LeadInteracoes_Leads_LeadId",
                        column: x => x.LeadId,
                        principalTable: "Leads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Veiculos_EmpresaId_Tipo_Status",
                table: "Veiculos",
                columns: new[] { "EmpresaId", "Tipo", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Empresas_Slug",
                table: "Empresas",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LeadInteracoes_LeadId",
                table: "LeadInteracoes",
                column: "LeadId");

            migrationBuilder.CreateIndex(
                name: "IX_Leads_ClienteId",
                table: "Leads",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Leads_EmpresaId_Estagio_Ordem",
                table: "Leads",
                columns: new[] { "EmpresaId", "Estagio", "Ordem" });

            migrationBuilder.CreateIndex(
                name: "IX_Leads_VeiculoInteresseId",
                table: "Leads",
                column: "VeiculoInteresseId");

            migrationBuilder.CreateIndex(
                name: "IX_Recibos_EmpresaId_Numero",
                table: "Recibos",
                columns: new[] { "EmpresaId", "Numero" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Recibos_HashSha256",
                table: "Recibos",
                column: "HashSha256",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Recibos_ProvedorAssinatura_IdExternoAssinatura",
                table: "Recibos",
                columns: new[] { "ProvedorAssinatura", "IdExternoAssinatura" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LeadInteracoes");

            migrationBuilder.DropTable(
                name: "Recibos");

            migrationBuilder.DropTable(
                name: "Leads");

            migrationBuilder.DropIndex(
                name: "IX_Veiculos_EmpresaId_Tipo_Status",
                table: "Veiculos");

            migrationBuilder.DropIndex(
                name: "IX_Empresas_Slug",
                table: "Empresas");

            migrationBuilder.DropColumn(
                name: "NumeroVenda",
                table: "Vendas");

            migrationBuilder.DropColumn(
                name: "UsuarioId",
                table: "Vendas");

            migrationBuilder.DropColumn(
                name: "CodigoFipe",
                table: "Veiculos");

            migrationBuilder.DropColumn(
                name: "DataConsultaFipe",
                table: "Veiculos");

            migrationBuilder.DropColumn(
                name: "MesReferenciaFipe",
                table: "Veiculos");

            migrationBuilder.DropColumn(
                name: "Partida",
                table: "Veiculos");

            migrationBuilder.DropColumn(
                name: "Refrigeracao",
                table: "Veiculos");

            migrationBuilder.DropColumn(
                name: "Cep",
                table: "Empresas");

            migrationBuilder.DropColumn(
                name: "Cidade",
                table: "Empresas");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "Empresas");

            migrationBuilder.DropColumn(
                name: "Endereco",
                table: "Empresas");

            migrationBuilder.DropColumn(
                name: "InscricaoEstadual",
                table: "Empresas");

            migrationBuilder.DropColumn(
                name: "LeadApiKey",
                table: "Empresas");

            migrationBuilder.DropColumn(
                name: "Slug",
                table: "Empresas");

            migrationBuilder.DropColumn(
                name: "Telefone",
                table: "Empresas");

            migrationBuilder.DropColumn(
                name: "TermoGarantiaPadrao",
                table: "Empresas");

            migrationBuilder.DropColumn(
                name: "Uf",
                table: "Empresas");
        }
    }
}
