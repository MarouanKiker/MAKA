using Maka.CRM.Data;
using Maka.CRM.DTOs;
using Maka.CRM.Models;
using Maka.CRM.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace Maka.CRM.Tests.Services;

public class LeadServiceTests
{
    private CrmDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<CrmDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new CrmDbContext(options);
    }

    [Fact]
    public async Task CreateAsync_ShouldReturnLeadResponseDto()
    {
        var context = CreateInMemoryContext();
        var publisher = new Mock<RabbitMqPublisher>(MockBehavior.Loose, null!);
        var service = new LeadService(context, publisher.Object);

        var dto = new CreateLeadDto { Nom = "Entreprise Test", Source = "Web", Score = 80 };
        var result = await service.CreateAsync(dto);

        Assert.NotNull(result);
        Assert.Equal("Entreprise Test", result.Nom);
        Assert.Equal(StatutLead.Nouveau.ToString(), result.Statut);
    }

    [Fact]
    public async Task GetByIdAsync_WhenLeadDoesNotExist_ShouldReturnNull()
    {
        var context = CreateInMemoryContext();
        var publisher = new Mock<RabbitMqPublisher>(MockBehavior.Loose, null!);
        var service = new LeadService(context, publisher.Object);

        var result = await service.GetByIdAsync(999);

        Assert.Null(result);
    }

    [Fact]
    public async Task QualifyAsync_ShouldSetStatutQualifie()
    {
        var context = CreateInMemoryContext();
        context.Leads.Add(new Lead { Nom = "Lead A", Statut = StatutLead.Nouveau });
        await context.SaveChangesAsync();

        var publisher = new Mock<RabbitMqPublisher>(MockBehavior.Loose, null!);
        var service = new LeadService(context, publisher.Object);

        var lead = context.Leads.First();
        var result = await service.QualifyAsync(lead.Id);

        Assert.NotNull(result);
        Assert.Equal(StatutLead.Qualifie.ToString(), result.Statut);
    }

    [Fact]
    public async Task DeleteAsync_WhenLeadExists_ShouldReturnTrue()
    {
        var context = CreateInMemoryContext();
        context.Leads.Add(new Lead { Nom = "Lead B" });
        await context.SaveChangesAsync();

        var publisher = new Mock<RabbitMqPublisher>(MockBehavior.Loose, null!);
        var service = new LeadService(context, publisher.Object);

        var lead = context.Leads.First();
        var success = await service.DeleteAsync(lead.Id);

        Assert.True(success);
        Assert.Empty(context.Leads);
    }
}
