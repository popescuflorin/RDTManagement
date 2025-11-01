using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProductionManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderedAndReceivedQuantitiesToAcquisitionItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Quantity",
                table: "AcquisitionItems",
                newName: "OrderedQuantity");

            migrationBuilder.AddColumn<decimal>(
                name: "ReceivedQuantity",
                table: "AcquisitionItems",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReceivedQuantity",
                table: "AcquisitionItems");

            migrationBuilder.RenameColumn(
                name: "OrderedQuantity",
                table: "AcquisitionItems",
                newName: "Quantity");
        }
    }
}
