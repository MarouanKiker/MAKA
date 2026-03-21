using CrmService.Models;

namespace CrmService.Interfaces;

public interface IOpportuniteRepository
{
    Task<List<Opportunite>> GetAllAsync();
    Task<Opportunite?> GetByIdAsync(int id);
    Task<Opportunite?> GetByLeadIdAsync(int leadId);
    Task<bool> ExistsForLeadAsync(int leadId);
    Task<Opportunite> CreateAsync(Opportunite opportunite);
    Task<Opportunite> UpdateAsync(Opportunite opportunite);
    Task<bool> DeleteAsync(int id);
}
