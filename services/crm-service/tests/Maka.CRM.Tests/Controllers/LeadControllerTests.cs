using Maka.CRM.Controllers;
using Maka.CRM.DTOs;
using Maka.CRM.Models;
using Maka.CRM.Services;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace Maka.CRM.Tests.Controllers;

public class LeadControllerTests
{
    private readonly Mock<ILeadService> _mockService;
    private readonly LeadController _controller;

    public LeadControllerTests()
    {
        _mockService = new Mock<ILeadService>();
        _controller = new LeadController(_mockService.Object);
    }

    [Fact]
    public async Task GetAll_ShouldReturnOkWithLeads()
    {
        var leads = new List<LeadResponseDto>
        {
            new() { Id = 1, Nom = "Lead A", Statut = "Nouveau" },
            new() { Id = 2, Nom = "Lead B", Statut = "Qualifie" },
        };
        _mockService.Setup(s => s.GetAllAsync()).ReturnsAsync(leads);

        var result = await _controller.GetAll();

        var ok = Assert.IsType<OkObjectResult>(result);
        var data = Assert.IsAssignableFrom<IEnumerable<LeadResponseDto>>(ok.Value);
        Assert.Equal(2, data.Count());
    }

    [Fact]
    public async Task GetById_WhenLeadNotFound_ShouldReturnNotFound()
    {
        _mockService.Setup(s => s.GetByIdAsync(99)).ReturnsAsync((LeadResponseDto?) null);

        var result = await _controller.GetById(99);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Create_ShouldReturnCreatedAtAction()
    {
        var dto = new CreateLeadDto { Nom = "Nouveau Lead" };
        var response = new LeadResponseDto { Id = 1, Nom = "Nouveau Lead", Statut = "Nouveau" };
        _mockService.Setup(s => s.CreateAsync(dto)).ReturnsAsync(response);

        var result = await _controller.Create(dto);

        var created = Assert.IsType<CreatedAtActionResult>(result);
        Assert.Equal(nameof(_controller.GetById), created.ActionName);
    }

    [Fact]
    public async Task Delete_WhenLeadExists_ShouldReturnNoContent()
    {
        _mockService.Setup(s => s.DeleteAsync(1)).ReturnsAsync(true);

        var result = await _controller.Delete(1);

        Assert.IsType<NoContentResult>(result);
    }
}
