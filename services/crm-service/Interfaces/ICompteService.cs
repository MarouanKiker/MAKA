using CrmService.DTOs.Comptes;

namespace CrmService.Interfaces;

public interface ICompteService
{
    Task<(List<CompteResponseDto> Items, int Total)> GetAllAsync(string? search, int page, int pageSize);
    Task<CompteResponseDto?> GetByIdAsync(int id);
    Task<CompteResponseDto> CreateAsync(CreateCompteDto dto);
    Task<CompteResponseDto?> UpdateAsync(int id, UpdateCompteDto dto);
    Task<bool> DeleteAsync(int id);
}