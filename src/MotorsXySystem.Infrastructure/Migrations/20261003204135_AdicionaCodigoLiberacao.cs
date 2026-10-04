using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MotorsXySystem.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AdicionaCodigoLiberacao : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CodigoLiberacao",
                table: "Usuarios",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DataExpiracaoCodigoLiberacao",
                table: "Usuarios",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CodigoLiberacao",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "DataExpiracaoCodigoLiberacao",
                table: "Usuarios");
        }
    }
}
