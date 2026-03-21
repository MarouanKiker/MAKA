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
    }
}
