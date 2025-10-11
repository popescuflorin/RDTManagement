using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProductionManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class AddAssignedToUserToAcquisition : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Acquisitions_Users_CreatedByUserId",
                table: "Acquisitions");

            migrationBuilder.DropForeignKey(
                name: "FK_Acquisitions_Users_ReceivedByUserId",
                table: "Acquisitions");

            migrationBuilder.AddColumn<int>(
                name: "AssignedToUserId",
                table: "Acquisitions",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Acquisitions_AssignedToUserId",
                table: "Acquisitions",
                column: "AssignedToUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Acquisitions_Users_AssignedToUserId",
                table: "Acquisitions",
                column: "AssignedToUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Acquisitions_Users_CreatedByUserId",
                table: "Acquisitions",
                column: "CreatedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Acquisitions_Users_ReceivedByUserId",
                table: "Acquisitions",
                column: "ReceivedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Acquisitions_Users_AssignedToUserId",
                table: "Acquisitions");

            migrationBuilder.DropForeignKey(
                name: "FK_Acquisitions_Users_CreatedByUserId",
                table: "Acquisitions");

            migrationBuilder.DropForeignKey(
                name: "FK_Acquisitions_Users_ReceivedByUserId",
                table: "Acquisitions");

            migrationBuilder.DropIndex(
                name: "IX_Acquisitions_AssignedToUserId",
                table: "Acquisitions");

            migrationBuilder.DropColumn(
                name: "AssignedToUserId",
                table: "Acquisitions");

            migrationBuilder.AddForeignKey(
                name: "FK_Acquisitions_Users_CreatedByUserId",
                table: "Acquisitions",
                column: "CreatedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Acquisitions_Users_ReceivedByUserId",
                table: "Acquisitions",
                column: "ReceivedByUserId",
                principalTable: "Users",
                principalColumn: "Id");
        }
    }
}
