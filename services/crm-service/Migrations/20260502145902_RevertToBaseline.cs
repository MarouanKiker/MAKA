using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CrmService.Migrations
{
    /// <inheritdoc />
    public partial class RevertToBaseline : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_leads_comptes_AccountId",
                table: "leads");

            migrationBuilder.DropForeignKey(
                name: "FK_tasks_opportunites_OpportuniteId",
                table: "tasks");

            migrationBuilder.DropTable(
                name: "contacts");

            migrationBuilder.DropTable(
                name: "comptes");

            migrationBuilder.DropIndex(
                name: "IX_tasks_OpportuniteId",
                table: "tasks");

            migrationBuilder.DropIndex(
                name: "IX_leads_AccountId",
                table: "leads");

            migrationBuilder.DropColumn(
                name: "Priorite",
                table: "tickets");

            migrationBuilder.DropColumn(
                name: "UtilisateurId",
                table: "tickets");

            migrationBuilder.DropColumn(
                name: "OpportuniteId",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "Priorite",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "UtilisateurId",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "AccountId",
                table: "leads");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "leads");

            migrationBuilder.DropColumn(
                name: "Entreprise",
                table: "leads");

            migrationBuilder.DropColumn(
                name: "NomContact",
                table: "leads");

            migrationBuilder.DropColumn(
                name: "Telephone",
                table: "leads");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Priorite",
                table: "tickets",
                type: "integer",
                nullable: false,
                defaultValue: 2);

            migrationBuilder.AddColumn<int>(
                name: "UtilisateurId",
                table: "tickets",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OpportuniteId",
                table: "tasks",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Priorite",
                table: "tasks",
                type: "integer",
                nullable: false,
                defaultValue: 2);

            migrationBuilder.AddColumn<int>(
                name: "UtilisateurId",
                table: "tasks",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AccountId",
                table: "leads",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "leads",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Entreprise",
                table: "leads",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "NomContact",
                table: "leads",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Telephone",
                table: "leads",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "comptes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Nom = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Responsable = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Telephone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    UtilisateurId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_comptes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "contacts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AccountId = table.Column<int>(type: "integer", nullable: false),
                    Adresse = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Nom = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contacts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_contacts_comptes_AccountId",
                        column: x => x.AccountId,
                        principalTable: "comptes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_tasks_OpportuniteId",
                table: "tasks",
                column: "OpportuniteId");

            migrationBuilder.CreateIndex(
                name: "IX_leads_AccountId",
                table: "leads",
                column: "AccountId");

            migrationBuilder.CreateIndex(
                name: "IX_contacts_AccountId",
                table: "contacts",
                column: "AccountId");

            migrationBuilder.AddForeignKey(
                name: "FK_leads_comptes_AccountId",
                table: "leads",
                column: "AccountId",
                principalTable: "comptes",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_tasks_opportunites_OpportuniteId",
                table: "tasks",
                column: "OpportuniteId",
                principalTable: "opportunites",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
