using CrmService.Enums;
using CrmService.Models;

namespace CrmService.Interfaces;

public interface ILeadRepository
{
    Task<List<Lead>> GetAllAsync(string? source, LeadStatut? statut, int? scoreMin);
    Task<Lead?> GetByIdAsync(int id);
    Task<Lead> CreateAsync(Lead lead);
    Task<Lead> UpdateAsync(Lead lead);
    Task<bool> DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);
}
