using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GravityCarSystem.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFinanciamentoToVendaPagamento : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BancoFinanciamento",
                table: "VendaPagamentos",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Parcelas",
                table: "VendaPagamentos",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TaxaJuros",
                table: "VendaPagamentos",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ValorParcela",
                table: "VendaPagamentos",
                type: "decimal(18,2)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BancoFinanciamento",
                table: "VendaPagamentos");

            migrationBuilder.DropColumn(
                name: "Parcelas",
                table: "VendaPagamentos");

            migrationBuilder.DropColumn(
                name: "TaxaJuros",
                table: "VendaPagamentos");

            migrationBuilder.DropColumn(
                name: "ValorParcela",
                table: "VendaPagamentos");
        }
    }
}
