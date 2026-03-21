using CrmService.DTOs.Campagnes;

namespace CrmService.Interfaces;

public interface ICampagneService
{
    Task<List<CampagneResponseDto>> GetAllAsync();
    Task<CampagneResponseDto?> GetByIdAsync(int id);
    Task<CampagneResponseDto> CreateAsync(CreateCampagneDto dto);
    Task<CampagneResponseDto?> UpdateAsync(int id, UpdateCampagneDto dto);
    Task<bool> DeleteAsync(int id);
}
