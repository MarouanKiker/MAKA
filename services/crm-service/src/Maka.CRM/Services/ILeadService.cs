using Maka.CRM.DTOs;
using Maka.CRM.Models;

namespace Maka.CRM.Services;

public interface ILeadService
{
    Task<IEnumerable<LeadResponseDto>> GetAllAsync();
    Task<LeadResponseDto?> GetByIdAsync(int id);
    Task<LeadResponseDto> CreateAsync(CreateLeadDto dto);
    Task<LeadResponseDto?> UpdateAsync(int id, UpdateLeadDto dto);
    Task<bool> DeleteAsync(int id);
    Task<LeadResponseDto?> QualifyAsync(int id);
    Task<LeadResponseDto?> ConvertToOpportunityAsync(int id);
}
