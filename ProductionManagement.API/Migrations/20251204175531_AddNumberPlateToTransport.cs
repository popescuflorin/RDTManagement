using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProductionManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class AddNumberPlateToTransport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "NumberPlate",
                table: "Transports",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NumberPlate",
                table: "Transports");
        }
    }
}
