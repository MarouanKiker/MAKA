using CrmService.Models;

namespace CrmService.Interfaces;

public interface IInteractionRepository
{
    Task<List<Interaction>> GetAllAsync();
    Task<Interaction?> GetByIdAsync(int id);
    Task<Interaction> CreateAsync(Interaction interaction);
    Task<Interaction> UpdateAsync(Interaction interaction);
    Task<bool> DeleteAsync(int id);
}
