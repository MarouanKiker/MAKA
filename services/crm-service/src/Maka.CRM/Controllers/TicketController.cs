using Maka.CRM.Data;
using Maka.CRM.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Maka.CRM.Controllers;

[ApiController]
[Route("api/crm/tickets")]
public class TicketController : ControllerBase
{
    private readonly CrmDbContext _context;

    public TicketController(CrmDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _context.Tickets.Include(t => t.Compte).ToListAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var ticket = await _context.Tickets.Include(t => t.Compte).FirstOrDefaultAsync(t => t.Id == id);
        if (ticket is null) return NotFound();
        return Ok(ticket);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Ticket ticket)
    {
        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = ticket.Id }, ticket);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Ticket updated)
    {
        var ticket = await _context.Tickets.FindAsync(id);
        if (ticket is null) return NotFound();

        ticket.Sujet = updated.Sujet;
        ticket.Statut = updated.Statut;
        ticket.Priorite = updated.Priorite;

        await _context.SaveChangesAsync();
        return Ok(ticket);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var ticket = await _context.Tickets.FindAsync(id);
        if (ticket is null) return NotFound();
        _context.Tickets.Remove(ticket);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("{id:int}/assign")]
    public async Task<IActionResult> Assign(int id, [FromBody] int utilisateurId)
    {
        var ticket = await _context.Tickets.FindAsync(id);
        if (ticket is null) return NotFound();

        ticket.UtilisateurId = utilisateurId;
        ticket.Statut = StatutTicket.EnCours;
        await _context.SaveChangesAsync();
        return Ok(ticket);
    }

    [HttpPut("{id:int}/resolve")]
    public async Task<IActionResult> Resolve(int id)
    {
        var ticket = await _context.Tickets.FindAsync(id);
        if (ticket is null) return NotFound();

        ticket.Statut = StatutTicket.Resolu;
        await _context.SaveChangesAsync();
        return Ok(ticket);
    }
}
