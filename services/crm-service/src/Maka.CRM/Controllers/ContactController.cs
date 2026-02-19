using Maka.CRM.Data;
using Maka.CRM.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Maka.CRM.Controllers;

[ApiController]
[Route("api/crm/contacts")]
public class ContactController : ControllerBase
{
    private readonly CrmDbContext _context;

    public ContactController(CrmDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _context.Contacts.Include(c => c.Compte).ToListAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var contact = await _context.Contacts.Include(c => c.Compte).FirstOrDefaultAsync(c => c.Id == id);
        if (contact is null) return NotFound();
        return Ok(contact);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Contact contact)
    {
        _context.Contacts.Add(contact);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = contact.Id }, contact);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Contact updated)
    {
        var contact = await _context.Contacts.FindAsync(id);
        if (contact is null) return NotFound();

        contact.Nom = updated.Nom;
        contact.Type = updated.Type;
        contact.Email = updated.Email;
        contact.Adresse = updated.Adresse;

        await _context.SaveChangesAsync();
        return Ok(contact);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var contact = await _context.Contacts.FindAsync(id);
        if (contact is null) return NotFound();
        _context.Contacts.Remove(contact);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
