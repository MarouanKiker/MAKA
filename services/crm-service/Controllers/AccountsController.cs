using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CrmService.DTOs.Comptes;
using CrmService.Interfaces;

namespace CrmService.Controllers;

[ApiController]
[Route("api/crm/accounts")]
[Authorize]
public class AccountsController : ControllerBase
{
    private readonly ICompteService _compteService;

    public AccountsController(ICompteService compteService)
    {
        _compteService = compteService;
    }

    // GET /api/crm/accounts?search=Maroc&page=1&pageSize=10
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        if (page < 1)     return BadRequest(new { error = "La page doit être >= 1." });
        if (pageSize < 1) return BadRequest(new { error = "pageSize doit être >= 1." });

        var (items, total) = await _compteService.GetAllAsync(search, page, pageSize);

        return Ok(new
        {
            data        = items,
            total       = total,
            page        = page,
            pageSize    = pageSize,
            totalPages  = (int)Math.Ceiling((double)total / pageSize)
        });
    }

    // GET /api/crm/accounts/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var compte = await _compteService.GetByIdAsync(id);
        if (compte == null)
            return NotFound(new { error = $"Compte avec l'id {id} introuvable." });

        return Ok(compte);
    }

    // POST /api/crm/accounts
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCompteDto dto)
    {
        var compte = await _compteService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = compte.Id }, compte);
    }

    // PUT /api/crm/accounts/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCompteDto dto)
    {
        var compte = await _compteService.UpdateAsync(id, dto);
        if (compte == null)
            return NotFound(new { error = $"Compte avec l'id {id} introuvable." });

        return Ok(compte);
    }

    // DELETE /api/crm/accounts/{id}
    // Avec DeleteBehavior.Restrict : retourne 409 si des contacts sont encore liés
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var deleted = await _compteService.DeleteAsync(id);
            if (!deleted)
                return NotFound(new { error = $"Compte avec l'id {id} introuvable." });

            return NoContent();
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException ex)
        when (ex.InnerException?.Message.Contains("violates foreign key constraint") == true
           || ex.InnerException?.Message.Contains("FOREIGN KEY") == true)
        {
            // Retourne 409 Conflict si le compte a encore des contacts liés
            return Conflict(new
            {
                error = "Impossible de supprimer ce compte : des contacts y sont encore liés.",
                hint  = "Veuillez d'abord supprimer ou délier les contacts associés."
            });
        }
    }
}
