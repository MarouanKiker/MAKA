using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CrmService.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // --- Table campagnes_marketing ---
            migrationBuilder.CreateTable(
                name: "campagnes_marketing",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nom = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Budget = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    DateDebut = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DateFin = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_campagnes_marketing", x => x.Id);
                });

            // --- Table leads ---
            migrationBuilder.CreateTable(
                name: "leads",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Source = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Statut = table.Column<int>(type: "integer", nullable: false),
                    Score = table.Column<int>(type: "integer", nullable: false),
                    DateCreation = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UtilisateurId = table.Column<int>(type: "integer", nullable: true),
                    CampagneId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_leads", x => x.Id);
                    table.ForeignKey(
                        name: "FK_leads_campagnes_marketing_CampagneId",
                        column: x => x.CampagneId,
                        principalTable: "campagnes_marketing",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            // --- Table opportunites ---
            migrationBuilder.CreateTable(
                name: "opportunites",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Titre = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Valeur = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Statut = table.Column<int>(type: "integer", nullable: false),
                    DateCloture = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LeadId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_opportunites", x => x.Id);
                    table.ForeignKey(
                        name: "FK_opportunites_leads_LeadId",
                        column: x => x.LeadId,
                        principalTable: "leads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            // --- Index ---
            migrationBuilder.CreateIndex(
                name: "IX_leads_CampagneId",
                table: "leads",
                column: "CampagneId");

            // Index unique : un lead ne peut avoir qu'une seule opportunité
            migrationBuilder.CreateIndex(
                name: "IX_opportunites_LeadId",
                table: "opportunites",
                column: "LeadId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "opportunites");
            migrationBuilder.DropTable(name: "leads");
            migrationBuilder.DropTable(name: "campagnes_marketing");
        }
    }
}
