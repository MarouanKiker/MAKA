using Maka.CRM.Data;
using Maka.CRM.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Maka.CRM.Controllers;

[ApiController]
[Route("api/crm/comptes")]
public class CompteController : ControllerBase
{
    private readonly CrmDbContext _context;

    public CompteController(CrmDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _context.Comptes.Include(c => c.Contacts).ToListAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var compte = await _context.Comptes.Include(c => c.Contacts).FirstOrDefaultAsync(c => c.Id == id);
        if (compte is null) return NotFound();
        return Ok(compte);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Compte compte)
    {
        _context.Comptes.Add(compte);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = compte.Id }, compte);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Compte updated)
    {
        var compte = await _context.Comptes.FindAsync(id);
        if (compte is null) return NotFound();

        compte.Nom = updated.Nom;
        compte.Email = updated.Email;
        compte.Telephone = updated.Telephone;
        compte.Fonction = updated.Fonction;

        await _context.SaveChangesAsync();
        return Ok(compte);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var compte = await _context.Comptes.FindAsync(id);
        if (compte is null) return NotFound();
        _context.Comptes.Remove(compte);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
