using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CrmService.DTOs.Opportunites;
using CrmService.Interfaces;

namespace CrmService.Controllers;

[ApiController]
[Route("api/crm/opportunites")]
[Authorize]
public class OpportunitesController : ControllerBase
{
    private readonly IOpportuniteService _opportuniteService;

    public OpportunitesController(IOpportuniteService opportuniteService)
    {
        _opportuniteService = opportuniteService;
    }

    // GET /api/crm/opportunites
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var opportunites = await _opportuniteService.GetAllAsync();
        return Ok(opportunites);
    }

    // GET /api/crm/opportunites/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var opportunite = await _opportuniteService.GetByIdAsync(id);
        if (opportunite == null)
            return NotFound(new { error = $"Opportunité avec l'id {id} introuvable." });

        return Ok(opportunite);
    }

    // POST /api/crm/opportunites
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOpportuniteDto dto)
    {
        try
        {
            var opportunite = await _opportuniteService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = opportunite.Id }, opportunite);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    // PUT /api/crm/opportunites/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateOpportuniteDto dto)
    {
        try
        {
            var opportunite = await _opportuniteService.UpdateAsync(id, dto);
            if (opportunite == null)
                return NotFound(new { error = $"Opportunité avec l'id {id} introuvable." });

            return Ok(opportunite);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // DELETE /api/crm/opportunites/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _opportuniteService.DeleteAsync(id);
        if (!deleted)
            return NotFound(new { error = $"Opportunité avec l'id {id} introuvable." });

        return NoContent();
    }
}
