using Maka.CRM.Data;
using Maka.CRM.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Maka.CRM.Controllers;

[ApiController]
[Route("api/crm/campagnes")]
public class CampagneController : ControllerBase
{
    private readonly CrmDbContext _context;

    public CampagneController(CrmDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _context.Campagnes.ToListAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var campagne = await _context.Campagnes.FindAsync(id);
        if (campagne is null) return NotFound();
        return Ok(campagne);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CampagneMarketing campagne)
    {
        _context.Campagnes.Add(campagne);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = campagne.Id }, campagne);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CampagneMarketing updated)
    {
        var campagne = await _context.Campagnes.FindAsync(id);
        if (campagne is null) return NotFound();

        campagne.Nom = updated.Nom;
        campagne.Budget = updated.Budget;
        campagne.DateDebut = updated.DateDebut;
        campagne.DateFin = updated.DateFin;

        await _context.SaveChangesAsync();
        return Ok(campagne);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var campagne = await _context.Campagnes.FindAsync(id);
        if (campagne is null) return NotFound();
        _context.Campagnes.Remove(campagne);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
