using Microsoft.EntityFrameworkCore;
using CrmService.Data;
using CrmService.Interfaces;
using CrmService.Models;

namespace CrmService.Repositories;

public class CampagneRepository : ICampagneRepository
{
    private readonly CrmDbContext _context;

    public CampagneRepository(CrmDbContext context)
    {
        _context = context;
    }

    public async Task<List<CampagneMarketing>> GetAllAsync()
    {
        return await _context.CampagnesMarketing
            .Include(c => c.Leads)
            .OrderByDescending(c => c.DateDebut)
            .ToListAsync();
    }

    public async Task<CampagneMarketing?> GetByIdAsync(int id)
    {
        return await _context.CampagnesMarketing
            .Include(c => c.Leads)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<CampagneMarketing> CreateAsync(CampagneMarketing campagne)
    {
        _context.CampagnesMarketing.Add(campagne);
        await _context.SaveChangesAsync();
        return campagne;
    }

    public async Task<CampagneMarketing> UpdateAsync(CampagneMarketing campagne)
    {
        _context.CampagnesMarketing.Update(campagne);
        await _context.SaveChangesAsync();
        return campagne;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var campagne = await _context.CampagnesMarketing.FindAsync(id);
        if (campagne == null) return false;

        _context.CampagnesMarketing.Remove(campagne);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await _context.CampagnesMarketing.AnyAsync(c => c.Id == id);
    }
}
