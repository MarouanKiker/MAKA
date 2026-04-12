using Microsoft.EntityFrameworkCore;
using CrmService.Data;
using CrmService.Interfaces;
using CrmService.Models;

namespace CrmService.Repositories;

public class TicketRepository : ITicketRepository
{
    private readonly CrmDbContext _context;

    public TicketRepository(CrmDbContext context)
    {
        _context = context;
    }

    public async Task<List<Ticket>> GetAllAsync()
    {
        return await _context.Tickets
            .Include(t => t.Lead)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<Ticket?> GetByIdAsync(int id)
    {
        return await _context.Tickets
            .Include(t => t.Lead)
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<Ticket> CreateAsync(Ticket ticket)
    {
        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync();
        return ticket;
    }

    public async Task<Ticket> UpdateAsync(Ticket ticket)
    {
        _context.Tickets.Update(ticket);
        await _context.SaveChangesAsync();
        return ticket;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var ticket = await _context.Tickets.FindAsync(id);
        if (ticket == null) return false;

        _context.Tickets.Remove(ticket);
        await _context.SaveChangesAsync();
        return true;
    }
}
