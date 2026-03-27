using Moq;
using CrmService.Services;
using CrmService.Interfaces;
using CrmService.Models;
using CrmService.Enums;
using CrmService.DTOs.Opportunites;
using Xunit;

namespace CrmService.Tests;

public class OpportuniteServiceTests
{
    private readonly Mock<IOpportuniteRepository> _mockOppRepo;
    private readonly Mock<ILeadRepository> _mockLeadRepo;
    private readonly OpportuniteService _service;

    public OpportuniteServiceTests()
    {
        _mockOppRepo = new Mock<IOpportuniteRepository>();
        _mockLeadRepo = new Mock<ILeadRepository>();
        _service = new OpportuniteService(_mockOppRepo.Object, _mockLeadRepo.Object);
    }

    [Fact]
    public async Task UpdateAsync_GagneeWithoutDateCloture_ThrowsArgumentException()
    {
        // Arrange
        var opp = new Opportunite { Id = 1, Statut = OpportuniteStatut.NOUVELLE, DateCloture = null };
        var dto = new UpdateOpportuniteDto { Statut = "GAGNEE", DateCloture = null };
        
        _mockOppRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(opp);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(() => _service.UpdateAsync(1, dto));
        Assert.Contains("date de clôture est obligatoire", exception.Message);
    }

    [Fact]
    public async Task CreateAsync_NonExistingLead_ThrowsKeyNotFoundException()
    {
        // Arrange
        var dto = new CreateOpportuniteDto { Titre = "Test", LeadId = 99 };
        _mockLeadRepo.Setup(r => r.ExistsAsync(99)).ReturnsAsync(false);

        // Act & Assert
        await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.CreateAsync(dto));
    }
}
