using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CrmService.Migrations
{
    public partial class AddTasksTicketsInteractions : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // --- Table tasks ---
            migrationBuilder.CreateTable(
                name: "tasks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false, defaultValue: ""),
                    DueDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsCompleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    LeadId = table.Column<int>(type: "integer", nullable: true),
                    OpportuniteId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_tasks_leads_LeadId",
                        column: x => x.LeadId,
                        principalTable: "leads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_tasks_opportunites_OpportuniteId",
                        column: x => x.OpportuniteId,
                        principalTable: "opportunites",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            // --- Table tickets ---
            migrationBuilder.CreateTable(
                name: "tickets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false, defaultValue: ""),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Open"),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    LeadId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tickets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_tickets_leads_LeadId",
                        column: x => x.LeadId,
                        principalTable: "leads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            // --- Table interactions ---
            migrationBuilder.CreateTable(
                name: "interactions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false, defaultValue: ""),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    LeadId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_interactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_interactions_leads_LeadId",
                        column: x => x.LeadId,
                        principalTable: "leads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            // --- Index ---
            migrationBuilder.CreateIndex(name: "IX_tasks_LeadId", table: "tasks", column: "LeadId");
            migrationBuilder.CreateIndex(name: "IX_tasks_OpportuniteId", table: "tasks", column: "OpportuniteId");
            migrationBuilder.CreateIndex(name: "IX_tickets_LeadId", table: "tickets", column: "LeadId");
            migrationBuilder.CreateIndex(name: "IX_interactions_LeadId", table: "interactions", column: "LeadId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "interactions");
            migrationBuilder.DropTable(name: "tickets");
            migrationBuilder.DropTable(name: "tasks");
        }
    }
}
