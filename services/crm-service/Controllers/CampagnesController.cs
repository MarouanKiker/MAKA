using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CrmService.DTOs.Campagnes;
using CrmService.Interfaces;

namespace CrmService.Controllers;

[ApiController]
[Route("api/crm/campagnes")]
[Authorize]
public class CampagnesController : ControllerBase
{
    private readonly ICampagneService _campagneService;

    public CampagnesController(ICampagneService campagneService)
    {
        _campagneService = campagneService;
    }

    // GET /api/crm/campagnes
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var campagnes = await _campagneService.GetAllAsync();
        return Ok(campagnes);
    }

    // GET /api/crm/campagnes/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var campagne = await _campagneService.GetByIdAsync(id);
        if (campagne == null)
            return NotFound(new { error = $"Campagne avec l'id {id} introuvable." });

        return Ok(campagne);
    }

    // POST /api/crm/campagnes
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCampagneDto dto)
    {
        try
        {
            var campagne = await _campagneService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = campagne.Id }, campagne);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // PUT /api/crm/campagnes/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCampagneDto dto)
    {
        try
        {
            var campagne = await _campagneService.UpdateAsync(id, dto);
            if (campagne == null)
                return NotFound(new { error = $"Campagne avec l'id {id} introuvable." });

            return Ok(campagne);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // DELETE /api/crm/campagnes/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _campagneService.DeleteAsync(id);
        if (!deleted)
            return NotFound(new { error = $"Campagne avec l'id {id} introuvable." });

        return NoContent();
    }
}
