using Microsoft.EntityFrameworkCore;
using CrmService.Data;
using CrmService.Interfaces;
using CrmService.Models;

namespace CrmService.Repositories;

public class InteractionRepository : IInteractionRepository
{
    private readonly CrmDbContext _context;

    public InteractionRepository(CrmDbContext context)
    {
        _context = context;
    }

    public async Task<List<Interaction>> GetAllAsync()
    {
        return await _context.Interactions
            .Include(i => i.Lead)
            .OrderByDescending(i => i.Date)
            .ToListAsync();
    }

    public async Task<Interaction?> GetByIdAsync(int id)
    {
        return await _context.Interactions
            .Include(i => i.Lead)
            .FirstOrDefaultAsync(i => i.Id == id);
    }

    public async Task<Interaction> CreateAsync(Interaction interaction)
    {
        _context.Interactions.Add(interaction);
        await _context.SaveChangesAsync();
        return interaction;
    }

    public async Task<Interaction> UpdateAsync(Interaction interaction)
    {
        _context.Interactions.Update(interaction);
        await _context.SaveChangesAsync();
        return interaction;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var interaction = await _context.Interactions.FindAsync(id);
        if (interaction == null) return false;

        _context.Interactions.Remove(interaction);
        await _context.SaveChangesAsync();
        return true;
    }
}
