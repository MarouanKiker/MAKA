using Moq;
using CrmService.Services;
using CrmService.Interfaces;
using CrmService.Models;
using CrmService.Enums;
using CrmService.DTOs.Leads;
using Xunit;

namespace CrmService.Tests;

public class LeadServiceTests
{
    private readonly Mock<ILeadRepository> _mockLeadRepo;
    private readonly Mock<IOpportuniteRepository> _mockOppRepo;
    private readonly LeadService _service;

    public LeadServiceTests()
    {
        _mockLeadRepo = new Mock<ILeadRepository>();
        _mockOppRepo = new Mock<IOpportuniteRepository>();
        _service = new LeadService(_mockLeadRepo.Object, _mockOppRepo.Object);
    }

    [Fact]
    public async Task GetAllAsync_ShouldReturnMappedDtos()
    {
        // Arrange
        var leads = new List<Lead>
        {
            new Lead { Id = 1, Source = "Web", Score = 80, Statut = LeadStatut.NOUVEAU }
        };
        _mockLeadRepo.Setup(r => r.GetAllAsync(null, null, null)).ReturnsAsync(leads);

        // Act
        var result = await _service.GetAllAsync(null, null, null);

        // Assert
        Assert.Single(result);
        Assert.Equal("Web", result[0].Source);
        Assert.Equal("NOUVEAU", result[0].Statut);
    }

    [Fact]
    public async Task CreateAsync_ShouldReturnCreatedDto()
    {
        // Arrange
        var dto = new CreateLeadDto { Source = "Email", Score = 50 };
        var createdLead = new Lead { Id = 1, Source = "Email", Score = 50, Statut = LeadStatut.NOUVEAU };
        
        _mockLeadRepo.Setup(r => r.CreateAsync(It.IsAny<Lead>())).ReturnsAsync(createdLead);
        _mockLeadRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(createdLead);

        // Act
        var result = await _service.CreateAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Email", result.Source);
        Assert.Equal(50, result.Score);
    }

    [Fact]
    public async Task ConvertToOpportuniteAsync_ValidLead_ShouldReturnOpportunite()
    {
        // Arrange
        var lead = new Lead { Id = 1, Statut = LeadStatut.QUALIFIE, Source = "Web" };
        var newOpp = new Opportunite { Id = 10, Titre = "Achat SaaS", Valeur = 5000, LeadId = 1, Statut = OpportuniteStatut.NOUVELLE };
        
        _mockLeadRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(lead);
        _mockOppRepo.Setup(r => r.ExistsForLeadAsync(1)).ReturnsAsync(false);
        _mockOppRepo.Setup(r => r.CreateAsync(It.IsAny<Opportunite>())).ReturnsAsync(newOpp);
        _mockOppRepo.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(newOpp);

        // Act
        var result = await _service.ConvertToOpportuniteAsync(1, "Achat SaaS", 5000);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Achat SaaS", result.Titre);
        Assert.Equal(5000, result.Valeur);
        Assert.Equal("NOUVELLE", result.Statut);
        
        // Ensure lead status is updated to CONVERTI
        // The service updates 'lead.Statut' correctly before calling UpdateAsync
        _mockLeadRepo.Verify(r => r.UpdateAsync(It.Is<Lead>(l => l.Statut == LeadStatut.CONVERTI)), Times.Once);
    }

    [Fact]
    public async Task ConvertToOpportuniteAsync_LeadAlreadyConverted_ThrowsInvalidOperationException()
    {
        // Arrange
        var lead = new Lead { Id = 1, Statut = LeadStatut.CONVERTI };
        _mockLeadRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(lead);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() => 
            _service.ConvertToOpportuniteAsync(1, "Test", 100));
        
        Assert.Contains("déjà converti", exception.Message);
    }
}
