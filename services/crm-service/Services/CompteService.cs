using CrmService.DTOs.Comptes;
using CrmService.Interfaces;
using CrmService.Mappers;

namespace CrmService.Services;

public class CompteService : ICompteService
{
    private readonly ICompteRepository _compteRepository;

    public CompteService(ICompteRepository compteRepository)
    {
        _compteRepository = compteRepository;
    }

    public async Task<(List<CompteResponseDto> Items, int Total)> GetAllAsync(string? search, int page, int pageSize)
    {
        var items = await _compteRepository.GetAllAsync(search, page, pageSize);
        var total = await _compteRepository.CountAsync(search);

        return (items.Select(CompteMapper.ToResponseDto).ToList(), total);
    }

    public async Task<CompteResponseDto?> GetByIdAsync(int id)
    {
        var compte = await _compteRepository.GetByIdAsync(id);
        return compte == null ? null : CompteMapper.ToResponseDto(compte);
    }

    public async Task<CompteResponseDto> CreateAsync(CreateCompteDto dto)
    {
        var compte = CompteMapper.ToEntity(dto);
        var created = await _compteRepository.CreateAsync(compte);
        var result = await _compteRepository.GetByIdAsync(created.Id);
        return CompteMapper.ToResponseDto(result!);
    }

    public async Task<CompteResponseDto?> UpdateAsync(int id, UpdateCompteDto dto)
    {
        var compte = await _compteRepository.GetByIdAsync(id);
        if (compte == null) return null;

        if (dto.Nom != null)             compte.Nom             = dto.Nom;
        if (dto.Email != null)           compte.Email           = dto.Email;
        if (dto.Telephone != null)       compte.Telephone       = dto.Telephone;
        if (dto.SecteurActivite != null) compte.SecteurActivite = dto.SecteurActivite;
        if (dto.Adresse != null)         compte.Adresse         = dto.Adresse;

        var updated = await _compteRepository.UpdateAsync(compte);
        return CompteMapper.ToResponseDto(updated);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        return await _compteRepository.DeleteAsync(id);
    }
}
