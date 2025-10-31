using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ProductionManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Clients",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ContactPerson = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Phone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Address = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    City = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PostalCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Country = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedByUserName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Clients", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Products",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SellingPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    EstimatedProductionTimeMinutes = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Products", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RawMaterials",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Color = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    QuantityType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    MinimumStock = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    UnitCost = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RawMaterials", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RolePermissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Role = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Permission = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RolePermissions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsSystemRole = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Suppliers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ContactPerson = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Phone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Address = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    City = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    PostalCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Country = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    TaxId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    RegistrationNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedByUserId = table.Column<int>(type: "int", nullable: false),
                    CreatedByUserName = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Suppliers", x => x.Id);
                });

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

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Username = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FirstName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Role = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastLoginAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    ReceiveEmails = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProductMaterials",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    MaterialId = table.Column<int>(type: "int", nullable: false),
                    RequiredQuantity = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    MaterialName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    MaterialColor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    QuantityType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductMaterials", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductMaterials_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProductMaterials_RawMaterials_MaterialId",
                        column: x => x.MaterialId,
                        principalTable: "RawMaterials",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ProductTemplates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FinishedProductId = table.Column<int>(type: "int", nullable: false),
                    EstimatedProductionTimeMinutes = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductTemplates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductTemplates_RawMaterials_FinishedProductId",
                        column: x => x.FinishedProductId,
                        principalTable: "RawMaterials",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Orders",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClientId = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    OrderDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpectedDeliveryDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeliveryDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TransportId = table.Column<int>(type: "int", nullable: true),
                    TransportDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TransportNotes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedByUserName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Orders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Orders_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Orders_Transports_TransportId",
                        column: x => x.TransportId,
                        principalTable: "Transports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Acquisitions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReceivedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedByUserId = table.Column<int>(type: "int", nullable: false),
                    ReceivedByUserId = table.Column<int>(type: "int", nullable: true),
                    AssignedToUserId = table.Column<int>(type: "int", nullable: true),
                    SupplierId = table.Column<int>(type: "int", nullable: true),
                    SupplierName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    SupplierContact = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DueDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TransportId = table.Column<int>(type: "int", nullable: true),
                    TransportDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TransportNotes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    TotalEstimatedCost = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    TotalActualCost = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    SupplierId1 = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Acquisitions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Acquisitions_Suppliers_SupplierId",
                        column: x => x.SupplierId,
                        principalTable: "Suppliers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Acquisitions_Suppliers_SupplierId1",
                        column: x => x.SupplierId1,
                        principalTable: "Suppliers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Acquisitions_Transports_TransportId",
                        column: x => x.TransportId,
                        principalTable: "Transports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Acquisitions_Users_AssignedToUserId",
                        column: x => x.AssignedToUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Acquisitions_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Acquisitions_Users_ReceivedByUserId",
                        column: x => x.ReceivedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ProductionPlans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TargetProductId = table.Column<int>(type: "int", nullable: false),
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
                    table.PrimaryKey("PK_ProductionPlans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductionPlans_RawMaterials_TargetProductId",
                        column: x => x.TargetProductId,
                        principalTable: "RawMaterials",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProductionPlans_Users_CompletedByUserId",
                        column: x => x.CompletedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProductionPlans_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProductionPlans_Users_StartedByUserId",
                        column: x => x.StartedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ProductTemplateMaterials",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProductTemplateId = table.Column<int>(type: "int", nullable: false),
                    RawMaterialId = table.Column<int>(type: "int", nullable: false),
                    RequiredQuantity = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductTemplateMaterials", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductTemplateMaterials_ProductTemplates_ProductTemplateId",
                        column: x => x.ProductTemplateId,
                        principalTable: "ProductTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProductTemplateMaterials_RawMaterials_RawMaterialId",
                        column: x => x.RawMaterialId,
                        principalTable: "RawMaterials",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
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

            migrationBuilder.CreateTable(
                name: "AcquisitionHistories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AcquisitionId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Action = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Changes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AcquisitionHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AcquisitionHistories_Acquisitions_AcquisitionId",
                        column: x => x.AcquisitionId,
                        principalTable: "Acquisitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AcquisitionHistories_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AcquisitionItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AcquisitionId = table.Column<int>(type: "int", nullable: false),
                    RawMaterialId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Color = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    QuantityType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ActualUnitCost = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AcquisitionItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AcquisitionItems_Acquisitions_AcquisitionId",
                        column: x => x.AcquisitionId,
                        principalTable: "Acquisitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AcquisitionItems_RawMaterials_RawMaterialId",
                        column: x => x.RawMaterialId,
                        principalTable: "RawMaterials",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ProductionPlanMaterials",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProductionPlanId = table.Column<int>(type: "int", nullable: false),
                    RawMaterialId = table.Column<int>(type: "int", nullable: false),
                    RequiredQuantity = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    ActualQuantityUsed = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    EstimatedUnitCost = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    ActualUnitCost = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductionPlanMaterials", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductionPlanMaterials_ProductionPlans_ProductionPlanId",
                        column: x => x.ProductionPlanId,
                        principalTable: "ProductionPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProductionPlanMaterials_RawMaterials_RawMaterialId",
                        column: x => x.RawMaterialId,
                        principalTable: "RawMaterials",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ProcessedMaterials",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AcquisitionId = table.Column<int>(type: "int", nullable: false),
                    AcquisitionItemId = table.Column<int>(type: "int", nullable: false),
                    RawMaterialId = table.Column<int>(type: "int", nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcessedMaterials", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProcessedMaterials_AcquisitionItems_AcquisitionItemId",
                        column: x => x.AcquisitionItemId,
                        principalTable: "AcquisitionItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProcessedMaterials_Acquisitions_AcquisitionId",
                        column: x => x.AcquisitionId,
                        principalTable: "Acquisitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProcessedMaterials_RawMaterials_RawMaterialId",
                        column: x => x.RawMaterialId,
                        principalTable: "RawMaterials",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "RawMaterials",
                columns: new[] { "Id", "Color", "CreatedAt", "Description", "IsActive", "MinimumStock", "Name", "Quantity", "QuantityType", "Type", "UnitCost", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, "Silver", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "High-grade steel sheets for manufacturing", true, 50m, "Steel Sheets", 150.5m, "kg", 0, 2.50m, new DateTime(2024, 1, 5, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 2, "Silver", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "6mm aluminum rods", true, 20m, "Aluminum Rods", 75m, "pieces", 0, 15.00m, new DateTime(2024, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 3, "Blue", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "High-quality blue paint", true, 10m, "Paint", 25.8m, "liters", 0, 12.00m, new DateTime(2024, 1, 15, 0, 0, 0, 0, DateTimeKind.Utc) }
                });

            migrationBuilder.InsertData(
                table: "RolePermissions",
                columns: new[] { "Id", "CreatedAt", "CreatedByUserId", "Permission", "Role" },
                values: new object[,]
                {
                    { 1, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.ViewTab", "Admin" },
                    { 2, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.Create", "Admin" },
                    { 3, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.View", "Admin" },
                    { 4, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.Edit", "Admin" },
                    { 5, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.Cancel", "Admin" },
                    { 6, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.Receive", "Admin" },
                    { 7, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.Process", "Admin" },
                    { 8, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.ViewTab", "Admin" },
                    { 9, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.Add", "Admin" },
                    { 10, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.Edit", "Admin" },
                    { 11, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.View", "Admin" },
                    { 12, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.Deactivate", "Admin" },
                    { 13, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.Activate", "Admin" },
                    { 14, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Production.ViewTab", "Admin" },
                    { 15, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Production.Create", "Admin" },
                    { 16, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Production.Edit", "Admin" },
                    { 17, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Production.View", "Admin" },
                    { 18, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Production.Cancel", "Admin" },
                    { 19, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Production.Execute", "Admin" },
                    { 20, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Production.Receive", "Admin" },
                    { 21, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Orders.ViewTab", "Admin" },
                    { 22, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Orders.Create", "Admin" },
                    { 23, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Orders.Edit", "Admin" },
                    { 24, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Orders.View", "Admin" },
                    { 25, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Orders.Cancel", "Admin" },
                    { 26, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Orders.Process", "Admin" },
                    { 27, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Users.ViewTab", "Admin" },
                    { 28, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Users.Create", "Admin" },
                    { 29, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Users.Edit", "Admin" },
                    { 30, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Users.View", "Admin" },
                    { 31, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Users.Deactivate", "Admin" },
                    { 32, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Users.Activate", "Admin" },
                    { 33, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Roles.ViewTab", "Admin" },
                    { 34, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Roles.ManagePermissions", "Admin" },
                    { 35, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.ViewTab", "Manager" },
                    { 36, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.Create", "Manager" },
                    { 37, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.View", "Manager" },
                    { 38, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.Edit", "Manager" },
                    { 39, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.Cancel", "Manager" },
                    { 40, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.Receive", "Manager" },
                    { 41, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.Process", "Manager" },
                    { 42, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.ViewTab", "Manager" },
                    { 43, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.Add", "Manager" },
                    { 44, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.Edit", "Manager" },
                    { 45, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.View", "Manager" },
                    { 46, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.Deactivate", "Manager" },
                    { 47, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.Activate", "Manager" },
                    { 48, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Production.ViewTab", "Manager" },
                    { 49, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Production.Create", "Manager" },
                    { 50, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Production.Edit", "Manager" },
                    { 51, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Production.View", "Manager" },
                    { 52, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Production.Cancel", "Manager" },
                    { 53, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Production.Execute", "Manager" },
                    { 54, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Production.Receive", "Manager" },
                    { 55, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Orders.ViewTab", "Manager" },
                    { 56, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Orders.Create", "Manager" },
                    { 57, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Orders.Edit", "Manager" },
                    { 58, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Orders.View", "Manager" },
                    { 59, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Orders.Cancel", "Manager" },
                    { 60, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Orders.Process", "Manager" },
                    { 61, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.ViewTab", "User" },
                    { 62, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.View", "User" },
                    { 63, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.ViewTab", "User" },
                    { 64, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.View", "User" },
                    { 65, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Production.ViewTab", "User" },
                    { 66, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Production.View", "User" },
                    { 67, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Orders.ViewTab", "User" },
                    { 68, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Orders.View", "User" },
                    { 69, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.ViewTab", "Supervisor" },
                    { 70, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.Create", "Supervisor" },
                    { 71, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.View", "Supervisor" },
                    { 72, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.Edit", "Supervisor" },
                    { 73, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.Cancel", "Supervisor" },
                    { 74, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.Receive", "Supervisor" },
                    { 75, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.Process", "Supervisor" },
                    { 76, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.ViewTab", "Supervisor" },
                    { 77, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.Add", "Supervisor" },
                    { 78, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.Edit", "Supervisor" },
                    { 79, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.View", "Supervisor" },
                    { 80, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.Deactivate", "Supervisor" },
                    { 81, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.Activate", "Supervisor" },
                    { 82, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Production.ViewTab", "Supervisor" },
                    { 83, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Production.Create", "Supervisor" },
                    { 84, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Production.Edit", "Supervisor" },
                    { 85, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Production.View", "Supervisor" },
                    { 86, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Production.Cancel", "Supervisor" },
                    { 87, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Production.Execute", "Supervisor" },
                    { 88, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Production.Receive", "Supervisor" },
                    { 89, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Orders.ViewTab", "Supervisor" },
                    { 90, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Orders.Create", "Supervisor" },
                    { 91, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Orders.Edit", "Supervisor" },
                    { 92, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Orders.View", "Supervisor" },
                    { 93, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Orders.Cancel", "Supervisor" },
                    { 94, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Orders.Process", "Supervisor" },
                    { 95, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.ViewTab", "Warehouse Operator" },
                    { 96, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.Create", "Warehouse Operator" },
                    { 97, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.View", "Warehouse Operator" },
                    { 98, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.Edit", "Warehouse Operator" },
                    { 99, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.Cancel", "Warehouse Operator" },
                    { 100, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.Receive", "Warehouse Operator" },
                    { 101, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.Process", "Warehouse Operator" },
                    { 102, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.ViewTab", "Warehouse Operator" },
                    { 103, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.Add", "Warehouse Operator" },
                    { 104, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.Edit", "Warehouse Operator" },
                    { 105, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.View", "Warehouse Operator" },
                    { 106, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.Deactivate", "Warehouse Operator" },
                    { 107, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.Activate", "Warehouse Operator" }
                });

            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "Id", "CreatedAt", "CreatedByUserId", "Description", "IsSystemRole", "Name" },
                values: new object[,]
                {
                    { 1, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Full system access with all permissions", true, "Admin" },
                    { 2, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Manage operations without user administration", true, "Manager" },
                    { 3, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Basic access with view-only permissions", true, "User" },
                    { 4, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Supervise production and inventory, limited administrative access", false, "Supervisor" },
                    { 5, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Manage inventory and acquisitions only", false, "Warehouse Operator" }
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "Email", "FirstName", "IsActive", "LastLoginAt", "LastName", "PasswordHash", "ReceiveEmails", "Role", "Username" },
                values: new object[] { 1, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "admin@productionmanagement.com", "Admin", true, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "User", "JAvlGPq9JyTdtvBO6x2llnRI1+gxwIyPqCKAn3THIKk=", true, "Admin", "admin" });

            migrationBuilder.CreateIndex(
                name: "IX_AcquisitionHistories_AcquisitionId",
                table: "AcquisitionHistories",
                column: "AcquisitionId");

            migrationBuilder.CreateIndex(
                name: "IX_AcquisitionHistories_UserId",
                table: "AcquisitionHistories",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AcquisitionItems_AcquisitionId",
                table: "AcquisitionItems",
                column: "AcquisitionId");

            migrationBuilder.CreateIndex(
                name: "IX_AcquisitionItems_RawMaterialId",
                table: "AcquisitionItems",
                column: "RawMaterialId");

            migrationBuilder.CreateIndex(
                name: "IX_Acquisitions_AssignedToUserId",
                table: "Acquisitions",
                column: "AssignedToUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Acquisitions_CreatedByUserId",
                table: "Acquisitions",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Acquisitions_ReceivedByUserId",
                table: "Acquisitions",
                column: "ReceivedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Acquisitions_SupplierId",
                table: "Acquisitions",
                column: "SupplierId");

            migrationBuilder.CreateIndex(
                name: "IX_Acquisitions_SupplierId1",
                table: "Acquisitions",
                column: "SupplierId1");

            migrationBuilder.CreateIndex(
                name: "IX_Acquisitions_TransportId",
                table: "Acquisitions",
                column: "TransportId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderMaterials_OrderId",
                table: "OrderMaterials",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderMaterials_RawMaterialId",
                table: "OrderMaterials",
                column: "RawMaterialId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_ClientId",
                table: "Orders",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_TransportId",
                table: "Orders",
                column: "TransportId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessedMaterials_AcquisitionId",
                table: "ProcessedMaterials",
                column: "AcquisitionId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessedMaterials_AcquisitionItemId",
                table: "ProcessedMaterials",
                column: "AcquisitionItemId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessedMaterials_RawMaterialId",
                table: "ProcessedMaterials",
                column: "RawMaterialId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductionPlanMaterials_ProductionPlanId",
                table: "ProductionPlanMaterials",
                column: "ProductionPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductionPlanMaterials_RawMaterialId",
                table: "ProductionPlanMaterials",
                column: "RawMaterialId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductionPlans_CompletedByUserId",
                table: "ProductionPlans",
                column: "CompletedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductionPlans_CreatedByUserId",
                table: "ProductionPlans",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductionPlans_StartedByUserId",
                table: "ProductionPlans",
                column: "StartedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductionPlans_TargetProductId",
                table: "ProductionPlans",
                column: "TargetProductId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductMaterials_MaterialId",
                table: "ProductMaterials",
                column: "MaterialId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductMaterials_ProductId",
                table: "ProductMaterials",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductTemplateMaterials_ProductTemplateId",
                table: "ProductTemplateMaterials",
                column: "ProductTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductTemplateMaterials_RawMaterialId",
                table: "ProductTemplateMaterials",
                column: "RawMaterialId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductTemplates_FinishedProductId",
                table: "ProductTemplates",
                column: "FinishedProductId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RolePermissions_Role_Permission",
                table: "RolePermissions",
                columns: new[] { "Role", "Permission" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Roles_Name",
                table: "Roles",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Username",
                table: "Users",
                column: "Username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AcquisitionHistories");

            migrationBuilder.DropTable(
                name: "OrderMaterials");

            migrationBuilder.DropTable(
                name: "ProcessedMaterials");

            migrationBuilder.DropTable(
                name: "ProductionPlanMaterials");

            migrationBuilder.DropTable(
                name: "ProductMaterials");

            migrationBuilder.DropTable(
                name: "ProductTemplateMaterials");

            migrationBuilder.DropTable(
                name: "RolePermissions");

            migrationBuilder.DropTable(
                name: "Roles");

            migrationBuilder.DropTable(
                name: "Orders");

            migrationBuilder.DropTable(
                name: "AcquisitionItems");

            migrationBuilder.DropTable(
                name: "ProductionPlans");

            migrationBuilder.DropTable(
                name: "Products");

            migrationBuilder.DropTable(
                name: "ProductTemplates");

            migrationBuilder.DropTable(
                name: "Clients");

            migrationBuilder.DropTable(
                name: "Acquisitions");

            migrationBuilder.DropTable(
                name: "RawMaterials");

            migrationBuilder.DropTable(
                name: "Suppliers");

            migrationBuilder.DropTable(
                name: "Transports");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
