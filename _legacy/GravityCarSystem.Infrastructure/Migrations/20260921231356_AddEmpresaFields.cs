using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GravityCarSystem.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEmpresaFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Complemento",
                table: "Empresas",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InscricaoMunicipal",
                table: "Empresas",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RegimeTributario",
                table: "Empresas",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ResponsavelTecnico",
                table: "Empresas",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Site",
                table: "Empresas",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Complemento",
                table: "Empresas");

            migrationBuilder.DropColumn(
                name: "InscricaoMunicipal",
                table: "Empresas");

            migrationBuilder.DropColumn(
                name: "RegimeTributario",
                table: "Empresas");

            migrationBuilder.DropColumn(
                name: "ResponsavelTecnico",
                table: "Empresas");

            migrationBuilder.DropColumn(
                name: "Site",
                table: "Empresas");
        }
    }
}
