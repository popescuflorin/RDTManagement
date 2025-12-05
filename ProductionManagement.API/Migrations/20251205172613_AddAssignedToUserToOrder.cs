using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ProductionManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class AddAssignedToUserToOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AssignedToUserId",
                table: "Orders",
                type: "int",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 33,
                column: "Permission",
                value: "Transports.ViewTab");

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 34,
                column: "Permission",
                value: "Transports.Create");

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 35,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Transports.View", "Admin" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 36,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Transports.Edit", "Admin" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 37,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Transports.Delete", "Admin" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 38,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Clients.ViewTab", "Admin" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 39,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Clients.Create", "Admin" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 40,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Clients.View", "Admin" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 41,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Clients.Edit", "Admin" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 42,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Clients.Delete", "Admin" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 43,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Suppliers.ViewTab", "Admin" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 44,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Suppliers.Create", "Admin" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 45,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Suppliers.View", "Admin" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 46,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Suppliers.Edit", "Admin" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 47,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Suppliers.Delete", "Admin" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 48,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Roles.ViewTab", "Admin" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 49,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Roles.ManagePermissions", "Admin" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 50,
                column: "Permission",
                value: "Acquisitions.ViewTab");

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 51,
                column: "Permission",
                value: "Acquisitions.Create");

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 52,
                column: "Permission",
                value: "Acquisitions.View");

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 53,
                column: "Permission",
                value: "Acquisitions.Edit");

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 54,
                column: "Permission",
                value: "Acquisitions.Cancel");

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 55,
                column: "Permission",
                value: "Acquisitions.Receive");

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 56,
                column: "Permission",
                value: "Acquisitions.Process");

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 57,
                column: "Permission",
                value: "Inventory.ViewTab");

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 58,
                column: "Permission",
                value: "Inventory.Add");

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 59,
                column: "Permission",
                value: "Inventory.Edit");

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 60,
                column: "Permission",
                value: "Inventory.View");

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 61,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Inventory.Deactivate", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 62,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Inventory.Activate", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 63,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Production.ViewTab", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 64,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Production.Create", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 65,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Production.Edit", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 66,
                column: "Role",
                value: "Manager");

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 67,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Production.Cancel", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 68,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Production.Execute", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 69,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Production.Receive", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 70,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Orders.ViewTab", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 71,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Orders.Create", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 72,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Orders.Edit", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 73,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Orders.View", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 74,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Orders.Cancel", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 75,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Orders.Process", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 76,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Transports.ViewTab", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 77,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Transports.Create", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 78,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Transports.View", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 79,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Transports.Edit", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 80,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Transports.Delete", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 81,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Clients.ViewTab", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 82,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Clients.Create", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 83,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Clients.View", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 84,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Clients.Edit", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 85,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Clients.Delete", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 86,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Suppliers.ViewTab", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 87,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Suppliers.Create", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 88,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Suppliers.View", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 89,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Suppliers.Edit", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 90,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Suppliers.Delete", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 91,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Acquisitions.ViewTab", "User" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 92,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Acquisitions.View", "User" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 93,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Inventory.ViewTab", "User" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 94,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Inventory.View", "User" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 95,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Production.ViewTab", "User" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 96,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Production.View", "User" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 97,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Orders.ViewTab", "User" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 98,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Orders.View", "User" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 99,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Acquisitions.ViewTab", "Supervisor" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 100,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Acquisitions.Create", "Supervisor" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 101,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Acquisitions.View", "Supervisor" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 102,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Acquisitions.Edit", "Supervisor" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 103,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Acquisitions.Cancel", "Supervisor" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 104,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Acquisitions.Receive", "Supervisor" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 105,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Acquisitions.Process", "Supervisor" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 106,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Inventory.ViewTab", "Supervisor" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 107,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Inventory.Add", "Supervisor" });

            migrationBuilder.InsertData(
                table: "RolePermissions",
                columns: new[] { "Id", "CreatedAt", "CreatedByUserId", "Permission", "Role" },
                values: new object[,]
                {
                    { 108, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.Edit", "Supervisor" },
                    { 109, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.View", "Supervisor" },
                    { 110, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.Deactivate", "Supervisor" },
                    { 111, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.Activate", "Supervisor" },
                    { 112, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Production.ViewTab", "Supervisor" },
                    { 113, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Production.Create", "Supervisor" },
                    { 114, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Production.Edit", "Supervisor" },
                    { 115, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Production.View", "Supervisor" },
                    { 116, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Production.Cancel", "Supervisor" },
                    { 117, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Production.Execute", "Supervisor" },
                    { 118, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Production.Receive", "Supervisor" },
                    { 119, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Orders.ViewTab", "Supervisor" },
                    { 120, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Orders.Create", "Supervisor" },
                    { 121, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Orders.Edit", "Supervisor" },
                    { 122, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Orders.View", "Supervisor" },
                    { 123, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Orders.Cancel", "Supervisor" },
                    { 124, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Orders.Process", "Supervisor" },
                    { 125, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.ViewTab", "Warehouse Operator" },
                    { 126, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.Create", "Warehouse Operator" },
                    { 127, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.View", "Warehouse Operator" },
                    { 128, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.Edit", "Warehouse Operator" },
                    { 129, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.Cancel", "Warehouse Operator" },
                    { 130, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.Receive", "Warehouse Operator" },
                    { 131, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Acquisitions.Process", "Warehouse Operator" },
                    { 132, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.ViewTab", "Warehouse Operator" },
                    { 133, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.Add", "Warehouse Operator" },
                    { 134, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.Edit", "Warehouse Operator" },
                    { 135, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.View", "Warehouse Operator" },
                    { 136, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.Deactivate", "Warehouse Operator" },
                    { 137, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Inventory.Activate", "Warehouse Operator" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Orders_AssignedToUserId",
                table: "Orders",
                column: "AssignedToUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Users_AssignedToUserId",
                table: "Orders",
                column: "AssignedToUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Users_AssignedToUserId",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_AssignedToUserId",
                table: "Orders");

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 108);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 109);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 110);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 111);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 112);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 113);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 114);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 115);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 116);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 117);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 118);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 119);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 120);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 121);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 122);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 123);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 124);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 125);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 126);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 127);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 128);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 129);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 130);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 131);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 132);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 133);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 134);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 135);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 136);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 137);

            migrationBuilder.DropColumn(
                name: "AssignedToUserId",
                table: "Orders");

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 33,
                column: "Permission",
                value: "Roles.ViewTab");

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 34,
                column: "Permission",
                value: "Roles.ManagePermissions");

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 35,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Acquisitions.ViewTab", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 36,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Acquisitions.Create", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 37,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Acquisitions.View", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 38,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Acquisitions.Edit", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 39,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Acquisitions.Cancel", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 40,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Acquisitions.Receive", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 41,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Acquisitions.Process", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 42,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Inventory.ViewTab", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 43,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Inventory.Add", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 44,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Inventory.Edit", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 45,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Inventory.View", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 46,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Inventory.Deactivate", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 47,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Inventory.Activate", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 48,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Production.ViewTab", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 49,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Production.Create", "Manager" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 50,
                column: "Permission",
                value: "Production.Edit");

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 51,
                column: "Permission",
                value: "Production.View");

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 52,
                column: "Permission",
                value: "Production.Cancel");

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 53,
                column: "Permission",
                value: "Production.Execute");

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 54,
                column: "Permission",
                value: "Production.Receive");

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 55,
                column: "Permission",
                value: "Orders.ViewTab");

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 56,
                column: "Permission",
                value: "Orders.Create");

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 57,
                column: "Permission",
                value: "Orders.Edit");

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 58,
                column: "Permission",
                value: "Orders.View");

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 59,
                column: "Permission",
                value: "Orders.Cancel");

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 60,
                column: "Permission",
                value: "Orders.Process");

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 61,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Acquisitions.ViewTab", "User" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 62,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Acquisitions.View", "User" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 63,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Inventory.ViewTab", "User" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 64,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Inventory.View", "User" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 65,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Production.ViewTab", "User" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 66,
                column: "Role",
                value: "User");

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 67,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Orders.ViewTab", "User" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 68,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Orders.View", "User" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 69,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Acquisitions.ViewTab", "Supervisor" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 70,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Acquisitions.Create", "Supervisor" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 71,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Acquisitions.View", "Supervisor" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 72,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Acquisitions.Edit", "Supervisor" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 73,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Acquisitions.Cancel", "Supervisor" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 74,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Acquisitions.Receive", "Supervisor" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 75,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Acquisitions.Process", "Supervisor" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 76,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Inventory.ViewTab", "Supervisor" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 77,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Inventory.Add", "Supervisor" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 78,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Inventory.Edit", "Supervisor" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 79,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Inventory.View", "Supervisor" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 80,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Inventory.Deactivate", "Supervisor" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 81,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Inventory.Activate", "Supervisor" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 82,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Production.ViewTab", "Supervisor" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 83,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Production.Create", "Supervisor" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 84,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Production.Edit", "Supervisor" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 85,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Production.View", "Supervisor" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 86,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Production.Cancel", "Supervisor" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 87,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Production.Execute", "Supervisor" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 88,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Production.Receive", "Supervisor" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 89,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Orders.ViewTab", "Supervisor" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 90,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Orders.Create", "Supervisor" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 91,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Orders.Edit", "Supervisor" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 92,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Orders.View", "Supervisor" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 93,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Orders.Cancel", "Supervisor" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 94,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Orders.Process", "Supervisor" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 95,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Acquisitions.ViewTab", "Warehouse Operator" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 96,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Acquisitions.Create", "Warehouse Operator" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 97,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Acquisitions.View", "Warehouse Operator" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 98,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Acquisitions.Edit", "Warehouse Operator" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 99,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Acquisitions.Cancel", "Warehouse Operator" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 100,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Acquisitions.Receive", "Warehouse Operator" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 101,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Acquisitions.Process", "Warehouse Operator" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 102,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Inventory.ViewTab", "Warehouse Operator" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 103,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Inventory.Add", "Warehouse Operator" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 104,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Inventory.Edit", "Warehouse Operator" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 105,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Inventory.View", "Warehouse Operator" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 106,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Inventory.Deactivate", "Warehouse Operator" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 107,
                columns: new[] { "Permission", "Role" },
                values: new object[] { "Inventory.Activate", "Warehouse Operator" });
        }
    }
}
