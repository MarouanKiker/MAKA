using CrmService.DTOs.Leads;
using CrmService.DTOs.Opportunites;

namespace CrmService.Interfaces;

public interface ILeadService
{
    Task<List<LeadResponseDto>> GetAllAsync(string? source, string? statut, int? scoreMin);
    Task<LeadResponseDto?> GetByIdAsync(int id);
    Task<LeadResponseDto> CreateAsync(CreateLeadDto dto);
    Task<LeadResponseDto?> UpdateAsync(int id, UpdateLeadDto dto);
    Task<bool> DeleteAsync(int id);
    Task<OpportuniteResponseDto> ConvertToOpportuniteAsync(int leadId, string titre, decimal valeur);
}
