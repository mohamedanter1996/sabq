using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sabq.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSeoAndContactFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "Questions",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Slug",
                table: "Questions",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TextEn",
                table: "Questions",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAtUtc",
                table: "Questions",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DisplayOrder",
                table: "Options",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "TextEn",
                table: "Options",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Categories",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DisplayOrder",
                table: "Categories",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "NameEn",
                table: "Categories",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Slug",
                table: "Categories",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "ContactMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Message = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    IsRead = table.Column<bool>(type: "bit", nullable: false),
                    IsReplied = table.Column<bool>(type: "bit", nullable: false),
                    ReplyText = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    RepliedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IpAddress = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    UserAgent = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContactMessages", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Questions_Category_Id",
                table: "Questions",
                columns: new[] { "CategoryId", "Id" });

            // Generate unique slugs for existing Questions before creating unique index
            migrationBuilder.Sql(@"
                UPDATE Questions 
                SET Slug = LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
                    CAST(NEWID() AS NVARCHAR(36)) + '-' + LEFT(ISNULL(TextAr, ''), 50),
                    ' ', '-'), '?', ''), '''', ''), '.', ''), ',', '')),
                    CreatedAtUtc = SYSUTCDATETIME()
                WHERE Slug = '' OR Slug IS NULL
            ");

            // Generate unique slugs for existing Categories before creating unique index
            migrationBuilder.Sql(@"
                UPDATE Categories 
                SET Slug = LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
                    CAST(NEWID() AS NVARCHAR(36)) + '-' + LEFT(ISNULL(NameAr, ''), 50),
                    ' ', '-'), '?', ''), '''', ''), '.', ''), ',', ''))
                WHERE Slug = '' OR Slug IS NULL
            ");

            migrationBuilder.CreateIndex(
                name: "IX_Questions_Slug",
                table: "Questions",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Categories_Slug",
                table: "Categories",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ContactMessages_CreatedAtUtc",
                table: "ContactMessages",
                column: "CreatedAtUtc",
                descending: new bool[0]);

            migrationBuilder.CreateIndex(
                name: "IX_ContactMessages_IsRead",
                table: "ContactMessages",
                column: "IsRead");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ContactMessages");

            migrationBuilder.DropIndex(
                name: "IX_Questions_Category_Id",
                table: "Questions");

            migrationBuilder.DropIndex(
                name: "IX_Questions_Slug",
                table: "Questions");

            migrationBuilder.DropIndex(
                name: "IX_Categories_Slug",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "CreatedAtUtc",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "Slug",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "TextEn",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "UpdatedAtUtc",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "DisplayOrder",
                table: "Options");

            migrationBuilder.DropColumn(
                name: "TextEn",
                table: "Options");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "DisplayOrder",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "NameEn",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "Slug",
                table: "Categories");
        }
    }
}
