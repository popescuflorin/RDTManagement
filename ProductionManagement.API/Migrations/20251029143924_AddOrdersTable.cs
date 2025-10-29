using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProductionManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class AddOrdersTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Orders",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClientName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ClientContactPerson = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ClientEmail = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ClientPhone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    ClientAddress = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ClientCity = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ClientPostalCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ClientCountry = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    OrderDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpectedDeliveryDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeliveryDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TransportId = table.Column<int>(type: "int", nullable: true),
                    CreatedByUserName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TransportId1 = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Orders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Orders_Transports_TransportId",
                        column: x => x.TransportId,
                        principalTable: "Transports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Orders_Transports_TransportId1",
                        column: x => x.TransportId1,
                        principalTable: "Transports",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "OrderMaterials",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OrderId = table.Column<int>(type: "int", nullable: false),
                    RawMaterialId = table.Column<int>(type: "int", nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    MaterialName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    MaterialColor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    QuantityType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    UnitPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderMaterials", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrderMaterials_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OrderMaterials_RawMaterials_RawMaterialId",
                        column: x => x.RawMaterialId,
                        principalTable: "RawMaterials",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OrderMaterials_OrderId",
                table: "OrderMaterials",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderMaterials_RawMaterialId",
                table: "OrderMaterials",
                column: "RawMaterialId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_TransportId",
                table: "Orders",
                column: "TransportId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_TransportId1",
                table: "Orders",
                column: "TransportId1");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OrderMaterials");

            migrationBuilder.DropTable(
                name: "Orders");
        }
    }
}
