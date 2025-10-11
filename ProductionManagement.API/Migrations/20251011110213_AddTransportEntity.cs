using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProductionManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class AddTransportEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TransportCarName",
                table: "Acquisitions");

            migrationBuilder.DropColumn(
                name: "TransportPhoneNumber",
                table: "Acquisitions");

            migrationBuilder.AddColumn<int>(
                name: "TransportId",
                table: "Acquisitions",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Transports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CarName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PhoneNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Transports", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Acquisitions_TransportId",
                table: "Acquisitions",
                column: "TransportId");

            migrationBuilder.AddForeignKey(
                name: "FK_Acquisitions_Transports_TransportId",
                table: "Acquisitions",
                column: "TransportId",
                principalTable: "Transports",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Acquisitions_Transports_TransportId",
                table: "Acquisitions");

            migrationBuilder.DropTable(
                name: "Transports");

            migrationBuilder.DropIndex(
                name: "IX_Acquisitions_TransportId",
                table: "Acquisitions");

            migrationBuilder.DropColumn(
                name: "TransportId",
                table: "Acquisitions");

            migrationBuilder.AddColumn<string>(
                name: "TransportCarName",
                table: "Acquisitions",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TransportPhoneNumber",
                table: "Acquisitions",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);
        }
    }
}
