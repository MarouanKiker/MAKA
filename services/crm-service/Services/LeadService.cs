using CrmService.DTOs.Leads;
using CrmService.DTOs.Opportunites;
using CrmService.Enums;
using CrmService.Interfaces;
using CrmService.Mappers;
using CrmService.Models;

namespace CrmService.Services;

public class LeadService : ILeadService
{
    private readonly ILeadRepository _leadRepository;
    private readonly IOpportuniteRepository _opportuniteRepository;

    public LeadService(ILeadRepository leadRepository, IOpportuniteRepository opportuniteRepository)
    {
        _leadRepository = leadRepository;
        _opportuniteRepository = opportuniteRepository;
    }

    public async Task<List<LeadResponseDto>> GetAllAsync(string? source, string? statut, int? scoreMin)
    {
        // Convertir le statut string → enum si fourni
        LeadStatut? statutEnum = null;
        if (!string.IsNullOrEmpty(statut))
        {
            if (Enum.TryParse<LeadStatut>(statut, ignoreCase: true, out var parsed))
                statutEnum = parsed;
            else
                throw new ArgumentException($"Statut invalide : {statut}");
        }

        var leads = await _leadRepository.GetAllAsync(source, statutEnum, scoreMin);
        return leads.Select(LeadMapper.ToResponseDto).ToList();
    }

    public async Task<LeadResponseDto?> GetByIdAsync(int id)
    {
        var lead = await _leadRepository.GetByIdAsync(id);
        return lead == null ? null : LeadMapper.ToResponseDto(lead);
    }

    public async Task<LeadResponseDto> CreateAsync(CreateLeadDto dto)
    {
        var lead = LeadMapper.ToEntity(dto);
        var created = await _leadRepository.CreateAsync(lead);

        // Recharger avec l'include de la campagne
        var result = await _leadRepository.GetByIdAsync(created.Id);
        return LeadMapper.ToResponseDto(result!);
    }

    public async Task<LeadResponseDto?> UpdateAsync(int id, UpdateLeadDto dto)
    {
        var lead = await _leadRepository.GetByIdAsync(id);
        if (lead == null) return null;

        // Appliquer les champs modifiés
        if (dto.Source != null)
            lead.Source = dto.Source;

        if (dto.Statut != null)
        {
            if (Enum.TryParse<LeadStatut>(dto.Statut, ignoreCase: true, out var parsed))
                lead.Statut = parsed;
            else
                throw new ArgumentException($"Statut invalide : {dto.Statut}");
        }

        if (dto.Score.HasValue)
            lead.Score = dto.Score.Value;

        if (dto.CampagneId.HasValue)
            lead.CampagneId = dto.CampagneId;

        var updated = await _leadRepository.UpdateAsync(lead);
        return LeadMapper.ToResponseDto(updated);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        return await _leadRepository.DeleteAsync(id);
    }

    /// <summary>
    /// Convertir un lead en opportunité.
    /// Règles :
    /// 1. Le lead doit exister
    /// 2. Le lead ne doit pas déjà être CONVERTI
    /// 3. Il ne doit pas y avoir d'opportunité existante pour ce lead
    /// → Sinon : InvalidOperationException (sera traduit en 409 par le contrôleur)
    /// </summary>
    public async Task<OpportuniteResponseDto> ConvertToOpportuniteAsync(int leadId, string titre, decimal valeur)
    {
        // 1. Vérifier que le lead existe
        var lead = await _leadRepository.GetByIdAsync(leadId);
        if (lead == null)
            throw new KeyNotFoundException($"Lead avec l'id {leadId} introuvable.");

        // 2. Vérifier que le lead n'est pas déjà converti
        if (lead.Statut == LeadStatut.CONVERTI)
            throw new InvalidOperationException($"Le lead {leadId} est déjà converti.");

        // 3. Vérifier qu'il n'y a pas déjà une opportunité pour ce lead
        if (await _opportuniteRepository.ExistsForLeadAsync(leadId))
            throw new InvalidOperationException($"Une opportunité existe déjà pour le lead {leadId}.");

        // 4. Créer l'opportunité
        var opportunite = new Opportunite
        {
            Titre = titre,
            Valeur = valeur,
            LeadId = leadId,
            Statut = OpportuniteStatut.NOUVELLE
        };

        var created = await _opportuniteRepository.CreateAsync(opportunite);

        // 5. Mettre à jour le statut du lead
        lead.Statut = LeadStatut.CONVERTI;
        await _leadRepository.UpdateAsync(lead);

        // 6. Recharger avec les navigations
        var result = await _opportuniteRepository.GetByIdAsync(created.Id);
        return OpportuniteMapper.ToResponseDto(result!);
    }
}
