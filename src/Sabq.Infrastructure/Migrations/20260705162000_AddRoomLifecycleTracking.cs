using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Sabq.Infrastructure.Data;

#nullable disable

namespace Sabq.Infrastructure.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(SabqDbContext))]
    [Migration("20260705162000_AddRoomLifecycleTracking")]
    public partial class AddRoomLifecycleTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CurrentQuestionId",
                table: "GameRooms",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CurrentQuestionIndex",
                table: "GameRooms",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FinishedAtUtc",
                table: "GameRooms",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastActivityAtUtc",
                table: "GameRooms",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "QuestionStartedAtUtc",
                table: "GameRooms",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "StartedAtUtc",
                table: "GameRooms",
                type: "datetime2",
                nullable: true);

            migrationBuilder.Sql(@"
                UPDATE GameRooms
                SET LastActivityAtUtc = CreatedAt
                WHERE LastActivityAtUtc IS NULL;
            ");

            migrationBuilder.CreateIndex(
                name: "IX_GameRooms_CurrentQuestionId",
                table: "GameRooms",
                column: "CurrentQuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_GameRooms_LastActivityAtUtc",
                table: "GameRooms",
                column: "LastActivityAtUtc");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_GameRooms_CurrentQuestionId",
                table: "GameRooms");

            migrationBuilder.DropIndex(
                name: "IX_GameRooms_LastActivityAtUtc",
                table: "GameRooms");

            migrationBuilder.DropColumn(
                name: "CurrentQuestionId",
                table: "GameRooms");

            migrationBuilder.DropColumn(
                name: "CurrentQuestionIndex",
                table: "GameRooms");

            migrationBuilder.DropColumn(
                name: "FinishedAtUtc",
                table: "GameRooms");

            migrationBuilder.DropColumn(
                name: "LastActivityAtUtc",
                table: "GameRooms");

            migrationBuilder.DropColumn(
                name: "QuestionStartedAtUtc",
                table: "GameRooms");

            migrationBuilder.DropColumn(
                name: "StartedAtUtc",
                table: "GameRooms");
        }
    }
}
