using CrmService.DTOs.Opportunites;
using CrmService.Enums;
using CrmService.Interfaces;
using CrmService.Mappers;

namespace CrmService.Services;

public class OpportuniteService : IOpportuniteService
{
    private readonly IOpportuniteRepository _opportuniteRepository;
    private readonly ILeadRepository _leadRepository;

    public OpportuniteService(IOpportuniteRepository opportuniteRepository, ILeadRepository leadRepository)
    {
        _opportuniteRepository = opportuniteRepository;
        _leadRepository = leadRepository;
    }

    public async Task<List<OpportuniteResponseDto>> GetAllAsync()
    {
        var opportunites = await _opportuniteRepository.GetAllAsync();
        return opportunites.Select(OpportuniteMapper.ToResponseDto).ToList();
    }

    public async Task<OpportuniteResponseDto?> GetByIdAsync(int id)
    {
        var opportunite = await _opportuniteRepository.GetByIdAsync(id);
        return opportunite == null ? null : OpportuniteMapper.ToResponseDto(opportunite);
    }

    public async Task<OpportuniteResponseDto> CreateAsync(CreateOpportuniteDto dto)
    {
        // Vérifier que le lead existe
        if (!await _leadRepository.ExistsAsync(dto.LeadId))
            throw new KeyNotFoundException($"Lead avec l'id {dto.LeadId} introuvable.");

        // Vérifier qu'il n'y a pas déjà une opportunité pour ce lead
        if (await _opportuniteRepository.ExistsForLeadAsync(dto.LeadId))
            throw new InvalidOperationException($"Une opportunité existe déjà pour le lead {dto.LeadId}.");

        var opportunite = OpportuniteMapper.ToEntity(dto);
        var created = await _opportuniteRepository.CreateAsync(opportunite);

        var result = await _opportuniteRepository.GetByIdAsync(created.Id);
        return OpportuniteMapper.ToResponseDto(result!);
    }

    public async Task<OpportuniteResponseDto?> UpdateAsync(int id, UpdateOpportuniteDto dto)
    {
        var opportunite = await _opportuniteRepository.GetByIdAsync(id);
        if (opportunite == null) return null;

        if (dto.Titre != null)
            opportunite.Titre = dto.Titre;

        if (dto.Valeur.HasValue)
            opportunite.Valeur = dto.Valeur.Value;

        if (dto.Statut != null)
        {
            if (Enum.TryParse<OpportuniteStatut>(dto.Statut, ignoreCase: true, out var parsed))
                opportunite.Statut = parsed;
            else
                throw new ArgumentException($"Statut invalide : {dto.Statut}");
        }

        if (dto.DateCloture.HasValue)
            opportunite.DateCloture = dto.DateCloture;

        // ===================================================================
        // RÈGLE MÉTIER : date_cloture obligatoire si GAGNEE ou PERDUE
        // ===================================================================
        if (opportunite.Statut == OpportuniteStatut.GAGNEE || opportunite.Statut == OpportuniteStatut.PERDUE)
        {
            if (opportunite.DateCloture == null)
                throw new ArgumentException(
                    "La date de clôture est obligatoire lorsque le statut est GAGNEE ou PERDUE.");
        }

        var updated = await _opportuniteRepository.UpdateAsync(opportunite);
        return OpportuniteMapper.ToResponseDto(updated);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        return await _opportuniteRepository.DeleteAsync(id);
    }
}
