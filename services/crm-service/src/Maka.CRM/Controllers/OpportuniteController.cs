using Maka.CRM.Data;
using Maka.CRM.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Maka.CRM.Controllers;

[ApiController]
[Route("api/crm/opportunites")]
public class OpportuniteController : ControllerBase
{
    private readonly CrmDbContext _context;

    public OpportuniteController(CrmDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var opportunites = await _context.Opportunites.Include(o => o.Lead).ToListAsync();
        return Ok(opportunites);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var op = await _context.Opportunites.Include(o => o.Lead).FirstOrDefaultAsync(o => o.Id == id);
        if (op is null) return NotFound();
        return Ok(op);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Opportunite opportunite)
    {
        _context.Opportunites.Add(opportunite);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = opportunite.Id }, opportunite);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Opportunite updated)
    {
        var op = await _context.Opportunites.FindAsync(id);
        if (op is null) return NotFound();

        op.Titre = updated.Titre;
        op.Valeur = updated.Valeur;
        op.Priorite = updated.Priorite;
        op.Statut = updated.Statut;
        op.DateCloture = updated.DateCloture;

        await _context.SaveChangesAsync();
        return Ok(op);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var op = await _context.Opportunites.FindAsync(id);
        if (op is null) return NotFound();

        _context.Opportunites.Remove(op);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("pipeline")]
    public async Task<IActionResult> GetPipeline()
    {
        var pipeline = await _context.Opportunites
            .GroupBy(o => o.Statut)
            .Select(g => new { Statut = g.Key.ToString(), Opportunites = g.ToList() })
            .ToListAsync();
        return Ok(pipeline);
    }
}
