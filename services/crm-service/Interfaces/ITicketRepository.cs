using CrmService.Models;

namespace CrmService.Interfaces;

public interface ITicketRepository
{
    Task<List<Ticket>> GetAllAsync();
    Task<Ticket?> GetByIdAsync(int id);
    Task<Ticket> CreateAsync(Ticket ticket);
    Task<Ticket> UpdateAsync(Ticket ticket);
    Task<bool> DeleteAsync(int id);
}
