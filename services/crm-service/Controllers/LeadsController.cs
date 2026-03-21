using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CrmService.DTOs.Leads;
using CrmService.Interfaces;

namespace CrmService.Controllers;

[ApiController]
[Route("api/crm/leads")]
[Authorize]
public class LeadsController : ControllerBase
{
    private readonly ILeadService _leadService;

    public LeadsController(ILeadService leadService)
    {
        _leadService = leadService;
    }

    // GET /api/crm/leads?source=Web&statut=NOUVEAU&scoreMin=50
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? source,
        [FromQuery] string? statut,
        [FromQuery] int? scoreMin)
    {
        try
        {
            var leads = await _leadService.GetAllAsync(source, statut, scoreMin);
            return Ok(leads);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // GET /api/crm/leads/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var lead = await _leadService.GetByIdAsync(id);
        if (lead == null)
            return NotFound(new { error = $"Lead avec l'id {id} introuvable." });

        return Ok(lead);
    }

    // POST /api/crm/leads
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLeadDto dto)
    {
        var lead = await _leadService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = lead.Id }, lead);
    }

    // PUT /api/crm/leads/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateLeadDto dto)
    {
        try
        {
            var lead = await _leadService.UpdateAsync(id, dto);
            if (lead == null)
                return NotFound(new { error = $"Lead avec l'id {id} introuvable." });

            return Ok(lead);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // DELETE /api/crm/leads/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _leadService.DeleteAsync(id);
        if (!deleted)
            return NotFound(new { error = $"Lead avec l'id {id} introuvable." });

        return NoContent();
    }

    // POST /api/crm/leads/{id}/convert
    [HttpPost("{id}/convert")]
    public async Task<IActionResult> Convert(int id, [FromBody] ConvertLeadRequest request)
    {
        try
        {
            var opportunite = await _leadService.ConvertToOpportuniteAsync(id, request.Titre, request.Valeur);
            return Ok(opportunite);
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
}

// Requête pour la conversion lead → opportunité
public class ConvertLeadRequest
{
    public string Titre { get; set; } = string.Empty;
    public decimal Valeur { get; set; }
}
