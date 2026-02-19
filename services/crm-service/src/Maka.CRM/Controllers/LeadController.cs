using Maka.CRM.Data;
using Maka.CRM.DTOs;
using Maka.CRM.Models;
using Maka.CRM.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Maka.CRM.Controllers;

[ApiController]
[Route("api/crm/leads")]
public class LeadController : ControllerBase
{
    private readonly ILeadService _leadService;

    public LeadController(ILeadService leadService)
    {
        _leadService = leadService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var leads = await _leadService.GetAllAsync();
        return Ok(leads);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var lead = await _leadService.GetByIdAsync(id);
        if (lead is null) return NotFound();
        return Ok(lead);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLeadDto dto)
    {
        var created = await _leadService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateLeadDto dto)
    {
        var updated = await _leadService.UpdateAsync(id, dto);
        if (updated is null) return NotFound();
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _leadService.DeleteAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpPost("{id:int}/qualify")]
    public async Task<IActionResult> Qualify(int id)
    {
        var result = await _leadService.QualifyAsync(id);
        if (result is null) return NotFound();
        return Ok(result);
    }

    [HttpPost("{id:int}/convert-to-opportunity")]
    public async Task<IActionResult> ConvertToOpportunity(int id)
    {
        var result = await _leadService.ConvertToOpportunityAsync(id);
        if (result is null) return NotFound();
        return Ok(result);
    }
}
