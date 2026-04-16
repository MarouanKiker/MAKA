using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CrmService.DTOs.Tickets;
using CrmService.Interfaces;

namespace CrmService.Controllers;

[ApiController]
[Route("api/crm/tickets")]
[Authorize]
public class TicketsController : ControllerBase
{
    private readonly ITicketService _service;

    public TicketsController(ITicketService service)
    {
        _service = service;
    }

    // GET /api/crm/tickets
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var tickets = await _service.GetAllAsync();
        return Ok(tickets);
    }

    // GET /api/crm/tickets/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var ticket = await _service.GetByIdAsync(id);
        if (ticket == null)
            return NotFound(new { error = $"Ticket avec l'id {id} introuvable." });

        return Ok(ticket);
    }

    // POST /api/crm/tickets
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTicketDto dto)
    {
        var ticket = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = ticket.Id }, ticket);
    }

    // PUT /api/crm/tickets/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTicketDto dto)
    {
        var ticket = await _service.UpdateAsync(id, dto);
        if (ticket == null)
            return NotFound(new { error = $"Ticket avec l'id {id} introuvable." });

        return Ok(ticket);
    }

    // DELETE /api/crm/tickets/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id);
        if (!deleted)
            return NotFound(new { error = $"Ticket avec l'id {id} introuvable." });

        return NoContent();
    }
}
