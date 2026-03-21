using CrmService.DTOs.Campagnes;
using CrmService.Interfaces;
using CrmService.Mappers;

namespace CrmService.Services;

public class CampagneService : ICampagneService
{
    private readonly ICampagneRepository _campagneRepository;

    public CampagneService(ICampagneRepository campagneRepository)
    {
        _campagneRepository = campagneRepository;
    }

    public async Task<List<CampagneResponseDto>> GetAllAsync()
    {
        var campagnes = await _campagneRepository.GetAllAsync();
        return campagnes.Select(CampagneMapper.ToResponseDto).ToList();
    }

    public async Task<CampagneResponseDto?> GetByIdAsync(int id)
    {
        var campagne = await _campagneRepository.GetByIdAsync(id);
        return campagne == null ? null : CampagneMapper.ToResponseDto(campagne);
    }

    public async Task<CampagneResponseDto> CreateAsync(CreateCampagneDto dto)
    {
        // Validation : DateFin doit être après DateDebut
        if (dto.DateFin <= dto.DateDebut)
            throw new ArgumentException("La date de fin doit être postérieure à la date de début.");

        var campagne = CampagneMapper.ToEntity(dto);
        var created = await _campagneRepository.CreateAsync(campagne);

        var result = await _campagneRepository.GetByIdAsync(created.Id);
        return CampagneMapper.ToResponseDto(result!);
    }

    public async Task<CampagneResponseDto?> UpdateAsync(int id, UpdateCampagneDto dto)
    {
        var campagne = await _campagneRepository.GetByIdAsync(id);
        if (campagne == null) return null;

        if (dto.Nom != null)
            campagne.Nom = dto.Nom;

        if (dto.Budget.HasValue)
            campagne.Budget = dto.Budget.Value;

        if (dto.DateDebut.HasValue)
            campagne.DateDebut = dto.DateDebut.Value;

        if (dto.DateFin.HasValue)
            campagne.DateFin = dto.DateFin.Value;

        // Revalider les dates après modification
        if (campagne.DateFin <= campagne.DateDebut)
            throw new ArgumentException("La date de fin doit être postérieure à la date de début.");

        var updated = await _campagneRepository.UpdateAsync(campagne);
        return CampagneMapper.ToResponseDto(updated);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        return await _campagneRepository.DeleteAsync(id);
    }
}
