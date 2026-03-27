using Moq;
using CrmService.Services;
using CrmService.Interfaces;
using CrmService.Models;
using CrmService.DTOs.Campagnes;
using Xunit;

namespace CrmService.Tests;

public class CampagneServiceTests
{
    private readonly Mock<ICampagneRepository> _mockRepo;
    private readonly CampagneService _service;

    public CampagneServiceTests()
    {
        _mockRepo = new Mock<ICampagneRepository>();
        _service = new CampagneService(_mockRepo.Object);
    }

    [Fact]
    public async Task CreateAsync_ValidDates_ReturnsDto()
    {
        // Arrange
        var dto = new CreateCampagneDto 
        { 
            Nom = "Campagne Hiver", 
            DateDebut = new DateTime(2026, 1, 1), 
            DateFin = new DateTime(2026, 2, 1) // Fin > Debut
        };
        
        var entity = new CampagneMarketing { Id = 1, Nom = "Campagne Hiver", DateDebut = dto.DateDebut, DateFin = dto.DateFin };
        
        _mockRepo.Setup(r => r.CreateAsync(It.IsAny<CampagneMarketing>())).ReturnsAsync(entity);
        _mockRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(entity);

        // Act
        var result = await _service.CreateAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Campagne Hiver", result.Nom);
    }

    [Fact]
    public async Task CreateAsync_InvalidDates_ThrowsArgumentException()
    {
        // Arrange: DateFin <= DateDebut
        var dto = new CreateCampagneDto 
        { 
            Nom = "Invalid Dates", 
            DateDebut = new DateTime(2026, 2, 1), 
            DateFin = new DateTime(2026, 1, 1) 
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateAsync(dto));
        Assert.Contains("postérieure à la date de début", exception.Message);
    }
}
