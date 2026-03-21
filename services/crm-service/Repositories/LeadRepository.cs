using Microsoft.EntityFrameworkCore;
using CrmService.Data;
using CrmService.Enums;
using CrmService.Interfaces;
using CrmService.Models;

namespace CrmService.Repositories;

public class LeadRepository : ILeadRepository
{
    private readonly CrmDbContext _context;

    public LeadRepository(CrmDbContext context)
    {
        _context = context;
    }

    public async Task<List<Lead>> GetAllAsync(string? source, LeadStatut? statut, int? scoreMin)
    {
        IQueryable<Lead> query = _context.Leads.Include(l => l.Campagne);

        if (!string.IsNullOrEmpty(source))
            query = query.Where(l => l.Source.Contains(source));

        if (statut.HasValue)
            query = query.Where(l => l.Statut == statut.Value);

        if (scoreMin.HasValue)
            query = query.Where(l => l.Score >= scoreMin.Value);

        return await query.OrderByDescending(l => l.DateCreation).ToListAsync();
    }

    public async Task<Lead?> GetByIdAsync(int id)
    {
        return await _context.Leads
            .Include(l => l.Campagne)
            .FirstOrDefaultAsync(l => l.Id == id);
    }

    public async Task<Lead> CreateAsync(Lead lead)
    {
        _context.Leads.Add(lead);
        await _context.SaveChangesAsync();
        return lead;
    }

    public async Task<Lead> UpdateAsync(Lead lead)
    {
        _context.Leads.Update(lead);
        await _context.SaveChangesAsync();
        return lead;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var lead = await _context.Leads.FindAsync(id);
        if (lead == null) return false;

        _context.Leads.Remove(lead);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await _context.Leads.AnyAsync(l => l.Id == id);
    }
}
