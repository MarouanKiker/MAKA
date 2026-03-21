using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace CrmService.Data;

/// <summary>
/// Factory utilisée par EF Core CLI (dotnet ef migrations) pour créer le DbContext
/// sans avoir besoin de lancer l'application (qui nécessite Docker).
/// </summary>
public class CrmDbContextFactory : IDesignTimeDbContextFactory<CrmDbContext>
{
    public CrmDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<CrmDbContext>();

        // Connexion factice pour la génération de migrations
        // La vraie connexion vient de docker-compose au runtime
        optionsBuilder.UseNpgsql("Host=localhost;Database=crm_db;Username=crm_user;Password=crm_pass");

        return new CrmDbContext(optionsBuilder.Options);
    }
}
