using Microsoft.EntityFrameworkCore;
using CrmService.Data;
using CrmService.Interfaces;
using CrmService.Models;

namespace CrmService.Repositories;

public class OpportuniteRepository : IOpportuniteRepository
{
    private readonly CrmDbContext _context;

    public OpportuniteRepository(CrmDbContext context)
    {
        _context = context;
    }

    public async Task<List<Opportunite>> GetAllAsync()
    {
        return await _context.Opportunites
            .Include(o => o.Lead)
            .OrderByDescending(o => o.Id)
            .ToListAsync();
    }

    public async Task<Opportunite?> GetByIdAsync(int id)
    {
        return await _context.Opportunites
            .Include(o => o.Lead)
            .FirstOrDefaultAsync(o => o.Id == id);
    }

    public async Task<Opportunite?> GetByLeadIdAsync(int leadId)
    {
        return await _context.Opportunites
            .Include(o => o.Lead)
            .FirstOrDefaultAsync(o => o.LeadId == leadId);
    }

    public async Task<bool> ExistsForLeadAsync(int leadId)
    {
        return await _context.Opportunites.AnyAsync(o => o.LeadId == leadId);
    }

    public async Task<Opportunite> CreateAsync(Opportunite opportunite)
    {
        _context.Opportunites.Add(opportunite);
        await _context.SaveChangesAsync();
        return opportunite;
    }

    public async Task<Opportunite> UpdateAsync(Opportunite opportunite)
    {
        _context.Opportunites.Update(opportunite);
        await _context.SaveChangesAsync();
        return opportunite;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var opportunite = await _context.Opportunites.FindAsync(id);
        if (opportunite == null) return false;

        _context.Opportunites.Remove(opportunite);
        await _context.SaveChangesAsync();
        return true;
    }
}
