using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CrmService.Migrations
{
    /// <inheritdoc />
    public partial class McdComptesTasks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "tickets",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

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

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "tasks",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

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

            migrationBuilder.AlterColumn<string>(
                name: "Notes",
                table: "interactions",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "comptes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nom = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Telephone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Responsable = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
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
                    Nom = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Adresse = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    AccountId = table.Column<int>(type: "integer", nullable: false)
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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_leads_comptes_AccountId",
                table: "leads");

            migrationBuilder.DropTable(
                name: "contacts");

            migrationBuilder.DropTable(
                name: "comptes");

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
                name: "Priorite",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "UtilisateurId",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "AccountId",
                table: "leads");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "tickets",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(1000)",
                oldMaxLength: 1000);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "tasks",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(1000)",
                oldMaxLength: 1000);

            migrationBuilder.AlterColumn<string>(
                name: "Notes",
                table: "interactions",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(1000)",
                oldMaxLength: 1000);
        }
    }
}
