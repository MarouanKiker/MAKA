using CrmService.Models;

namespace CrmService.Interfaces;

public interface ICompteRepository
{
    Task<List<Compte>> GetAllAsync(string? search, int page, int pageSize);
    Task<int> CountAsync(string? search);
    Task<Compte?> GetByIdAsync(int id);
    Task<Compte> CreateAsync(Compte compte);
    Task<Compte> UpdateAsync(Compte compte);
    Task<bool> DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);
}