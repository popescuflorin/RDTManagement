using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProductionManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class AddRecyclableProductionPlan : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RecyclableProductionPlans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TargetRawMaterialId = table.Column<int>(type: "int", nullable: false),
                    QuantityToProduce = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "int", nullable: false),
                    StartedByUserId = table.Column<int>(type: "int", nullable: true),
                    CompletedByUserId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PlannedStartDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EstimatedCost = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    ActualCost = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    EstimatedProductionTimeMinutes = table.Column<int>(type: "int", nullable: false),
                    ActualProductionTimeMinutes = table.Column<int>(type: "int", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecyclableProductionPlans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RecyclableProductionPlans_RawMaterials_TargetRawMaterialId",
                        column: x => x.TargetRawMaterialId,
                        principalTable: "RawMaterials",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RecyclableProductionPlans_Users_CompletedByUserId",
                        column: x => x.CompletedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RecyclableProductionPlans_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RecyclableProductionPlans_Users_StartedByUserId",
                        column: x => x.StartedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RecyclablePlanMaterials",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RecyclableProductionPlanId = table.Column<int>(type: "int", nullable: false),
                    RawMaterialId = table.Column<int>(type: "int", nullable: false),
                    RequiredQuantity = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    ActualQuantityUsed = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecyclablePlanMaterials", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RecyclablePlanMaterials_RawMaterials_RawMaterialId",
                        column: x => x.RawMaterialId,
                        principalTable: "RawMaterials",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RecyclablePlanMaterials_RecyclableProductionPlans_RecyclableProductionPlanId",
                        column: x => x.RecyclableProductionPlanId,
                        principalTable: "RecyclableProductionPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RecyclablePlanMaterials_RawMaterialId",
                table: "RecyclablePlanMaterials",
                column: "RawMaterialId");

            migrationBuilder.CreateIndex(
                name: "IX_RecyclablePlanMaterials_RecyclableProductionPlanId",
                table: "RecyclablePlanMaterials",
                column: "RecyclableProductionPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_RecyclableProductionPlans_CompletedByUserId",
                table: "RecyclableProductionPlans",
                column: "CompletedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_RecyclableProductionPlans_CreatedByUserId",
                table: "RecyclableProductionPlans",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_RecyclableProductionPlans_StartedByUserId",
                table: "RecyclableProductionPlans",
                column: "StartedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_RecyclableProductionPlans_TargetRawMaterialId",
                table: "RecyclableProductionPlans",
                column: "TargetRawMaterialId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RecyclablePlanMaterials");

            migrationBuilder.DropTable(
                name: "RecyclableProductionPlans");
        }
    }
}
