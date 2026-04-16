using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CrmService.DTOs.Interactions;
using CrmService.Interfaces;

namespace CrmService.Controllers;

[ApiController]
[Route("api/crm/interactions")]
[Authorize]
public class InteractionsController : ControllerBase
{
    private readonly IInteractionService _service;

    public InteractionsController(IInteractionService service)
    {
        _service = service;
    }

    // GET /api/crm/interactions
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var interactions = await _service.GetAllAsync();
        return Ok(interactions);
    }

    // GET /api/crm/interactions/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var interaction = await _service.GetByIdAsync(id);
        if (interaction == null)
            return NotFound(new { error = $"Interaction avec l'id {id} introuvable." });

        return Ok(interaction);
    }

    // POST /api/crm/interactions
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInteractionDto dto)
    {
        var interaction = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = interaction.Id }, interaction);
    }

    // PUT /api/crm/interactions/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateInteractionDto dto)
    {
        var interaction = await _service.UpdateAsync(id, dto);
        if (interaction == null)
            return NotFound(new { error = $"Interaction avec l'id {id} introuvable." });

        return Ok(interaction);
    }

    // DELETE /api/crm/interactions/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id);
        if (!deleted)
            return NotFound(new { error = $"Interaction avec l'id {id} introuvable." });

        return NoContent();
    }
}
