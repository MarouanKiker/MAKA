using CrmService.DTOs.Opportunites;

namespace CrmService.Interfaces;

public interface IOpportuniteService
{
    Task<List<OpportuniteResponseDto>> GetAllAsync();
    Task<OpportuniteResponseDto?> GetByIdAsync(int id);
    Task<OpportuniteResponseDto> CreateAsync(CreateOpportuniteDto dto);
    Task<OpportuniteResponseDto?> UpdateAsync(int id, UpdateOpportuniteDto dto);
    Task<bool> DeleteAsync(int id);
}
