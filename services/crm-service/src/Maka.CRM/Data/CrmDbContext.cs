using Maka.CRM.Models;
using Microsoft.EntityFrameworkCore;

namespace Maka.CRM.Data;

public class CrmDbContext : DbContext
{
    public CrmDbContext(DbContextOptions<CrmDbContext> options) : base(options) { }

    public DbSet<Lead> Leads => Set<Lead>();
    public DbSet<Opportunite> Opportunites => Set<Opportunite>();
    public DbSet<Compte> Comptes => Set<Compte>();
    public DbSet<Contact> Contacts => Set<Contact>();
    public DbSet<Interaction> Interactions => Set<Interaction>();
    public DbSet<Tache> Taches => Set<Tache>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<CampagneMarketing> Campagnes => Set<CampagneMarketing>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Lead>()
            .HasOne(l => l.Campagne)
            .WithMany(c => c.Leads)
            .HasForeignKey(l => l.CampagneId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Opportunite>()
            .HasOne(o => o.Lead)
            .WithMany(l => l.Opportunites)
            .HasForeignKey(o => o.LeadId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Contact>()
            .HasOne(c => c.Compte)
            .WithMany(cp => cp.Contacts)
            .HasForeignKey(c => c.CompteId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Interaction>()
            .HasOne(i => i.Contact)
            .WithMany(c => c.Interactions)
            .HasForeignKey(i => i.ContactId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Tache>()
            .HasOne(t => t.Lead)
            .WithMany(l => l.Taches)
            .HasForeignKey(t => t.LeadId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Ticket>()
            .HasOne(t => t.Compte)
            .WithMany(c => c.Tickets)
            .HasForeignKey(t => t.CompteId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
