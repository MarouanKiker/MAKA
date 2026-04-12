using Microsoft.EntityFrameworkCore;
using CrmService.Models;

namespace CrmService.Data;

public class CrmDbContext : DbContext
{
    public CrmDbContext(DbContextOptions<CrmDbContext> options) : base(options)
    {
    }

    public DbSet<Lead> Leads => Set<Lead>();
    public DbSet<CampagneMarketing> CampagnesMarketing => Set<CampagneMarketing>();
    public DbSet<Opportunite> Opportunites => Set<Opportunite>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<Interaction> Interactions => Set<Interaction>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // --- Configuration Lead ---
        modelBuilder.Entity<Lead>(entity =>
        {
            entity.ToTable("leads");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Source).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Statut).IsRequired();
            entity.Property(e => e.Score).IsRequired();
            entity.Property(e => e.DateCreation).HasDefaultValueSql("NOW()");

            // Relation : Lead → CampagneMarketing (N → 1, nullable)
            entity.HasOne(e => e.Campagne)
                  .WithMany(c => c.Leads)
                  .HasForeignKey(e => e.CampagneId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // --- Configuration CampagneMarketing ---
        modelBuilder.Entity<CampagneMarketing>(entity =>
        {
            entity.ToTable("campagnes_marketing");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Nom).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Budget).HasColumnType("decimal(18,2)");
        });

        // --- Configuration Opportunite ---
        modelBuilder.Entity<Opportunite>(entity =>
        {
            entity.ToTable("opportunites");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Titre).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Valeur).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Statut).IsRequired();
            entity.Property(e => e.DateCloture).IsRequired(false);

            // Relation : Opportunite → Lead (1 → 1, index unique)
            entity.HasOne(e => e.Lead)
                  .WithOne(l => l.Opportunite)
                  .HasForeignKey<Opportunite>(e => e.LeadId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Index unique : un lead ne peut avoir qu'une seule opportunité
            entity.HasIndex(e => e.LeadId).IsUnique();
        });
        modelBuilder.Entity<TaskItem>(entity =>
        {
            entity.ToTable("tasks");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.DueDate).IsRequired();
            entity.Property(e => e.IsCompleted).HasDefaultValue(false);

            // Relation Task → Lead (N → 1)
            entity.HasOne(e => e.Lead)
                  .WithMany()
                  .HasForeignKey(e => e.LeadId)
                  .OnDelete(DeleteBehavior.SetNull);

            // Relation Task → Opportunite (N → 1)
            entity.HasOne(e => e.Opportunite)
                  .WithMany()
                  .HasForeignKey(e => e.OpportuniteId)
                  .OnDelete(DeleteBehavior.SetNull);
        });
        modelBuilder.Entity<Ticket>(entity =>
        {
            entity.ToTable("tickets");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW()");

            // Relation Ticket → Lead
            entity.HasOne(e => e.Lead)
                  .WithMany()
                  .HasForeignKey(e => e.LeadId)
                  .OnDelete(DeleteBehavior.SetNull);
        });
        modelBuilder.Entity<Interaction>(entity =>
{
    entity.ToTable("interactions");
    entity.HasKey(e => e.Id);

    entity.Property(e => e.Type).IsRequired().HasMaxLength(50);
    entity.Property(e => e.Notes).HasMaxLength(1000);
    entity.Property(e => e.Date).HasDefaultValueSql("NOW()");

    // Relation Interaction → Lead
    entity.HasOne(e => e.Lead)
          .WithMany()
          .HasForeignKey(e => e.LeadId)
          .OnDelete(DeleteBehavior.SetNull);
});
    }
}
