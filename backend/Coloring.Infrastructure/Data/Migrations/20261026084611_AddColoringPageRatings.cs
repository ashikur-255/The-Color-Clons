using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Coloring.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddColoringPageRatings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ColoringPageRatings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ColoringPageId = table.Column<int>(type: "int", nullable: false),
                    Rating = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ColoringPageRatings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ColoringPageRatings_ColoringPages_ColoringPageId",
                        column: x => x.ColoringPageId,
                        principalTable: "ColoringPages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ColoringPageRatings_ColoringPageId",
                table: "ColoringPageRatings",
                column: "ColoringPageId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ColoringPageRatings");
        }
    }
}
