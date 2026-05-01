using CrmService.Models;

namespace CrmService.Interfaces;

public interface IContactRepository
{
    Task<List<Contact>> GetAllAsync(int? compteId, string? search);
    Task<Contact?> GetByIdAsync(int id);
    Task<Contact> CreateAsync(Contact contact);
    Task<Contact> UpdateAsync(Contact contact);
    Task<bool> DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);
}
