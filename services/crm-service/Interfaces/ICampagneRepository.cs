using CrmService.Models;

namespace CrmService.Interfaces;

public interface ICampagneRepository
{
    Task<List<CampagneMarketing>> GetAllAsync();
    Task<CampagneMarketing?> GetByIdAsync(int id);
    Task<CampagneMarketing> CreateAsync(CampagneMarketing campagne);
    Task<CampagneMarketing> UpdateAsync(CampagneMarketing campagne);
    Task<bool> DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);
}
