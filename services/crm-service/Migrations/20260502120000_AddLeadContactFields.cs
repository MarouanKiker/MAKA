using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CrmService.Migrations
{
/// <summary>
/// Colonnes contact manquantes par rapport au modèle Lead (sinon SaveChanges échoue en SQL).
/// </summary>
public partial class AddLeadContactFields : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
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
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "Email", table: "leads");
        migrationBuilder.DropColumn(name: "Entreprise", table: "leads");
        migrationBuilder.DropColumn(name: "NomContact", table: "leads");
        migrationBuilder.DropColumn(name: "Telephone", table: "leads");
    }
}
}
