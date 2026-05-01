using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CrmService.DTOs.Contacts;
using CrmService.Interfaces;

namespace CrmService.Controllers;

[ApiController]
[Route("api/crm/contacts")]
[Authorize]
public class ContactsController : ControllerBase
{
    private readonly IContactService _contactService;

    public ContactsController(IContactService contactService)
    {
        _contactService = contactService;
    }

    // GET /api/crm/contacts?compteId=3&search=Ahmed
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? compteId,
        [FromQuery] string? search)
    {
        var contacts = await _contactService.GetAllAsync(compteId, search);
        return Ok(contacts);
    }

    // GET /api/crm/contacts/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var contact = await _contactService.GetByIdAsync(id);
        if (contact == null)
            return NotFound(new { error = $"Contact avec l'id {id} introuvable." });

        return Ok(contact);
    }

    // POST /api/crm/contacts
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateContactDto dto)
    {
        try
        {
            var contact = await _contactService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = contact.Id }, contact);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    // PUT /api/crm/contacts/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateContactDto dto)
    {
        try
        {
            var contact = await _contactService.UpdateAsync(id, dto);
            if (contact == null)
                return NotFound(new { error = $"Contact avec l'id {id} introuvable." });

            return Ok(contact);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    // DELETE /api/crm/contacts/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _contactService.DeleteAsync(id);
        if (!deleted)
            return NotFound(new { error = $"Contact avec l'id {id} introuvable." });

        return NoContent();
    }
}
