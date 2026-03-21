using CrmService.DTOs.Opportunites;
using CrmService.Models;

namespace CrmService.Mappers;

public static class OpportuniteMapper
{
    public static Opportunite ToEntity(CreateOpportuniteDto dto)
    {
        return new Opportunite
        {
            Titre = dto.Titre,
            Valeur = dto.Valeur,
            LeadId = dto.LeadId,
            Statut = Enums.OpportuniteStatut.NOUVELLE
        };
    }

    public static OpportuniteResponseDto ToResponseDto(Opportunite opportunite)
    {
        return new OpportuniteResponseDto
        {
            Id = opportunite.Id,
            Titre = opportunite.Titre,
            Valeur = opportunite.Valeur,
            Statut = opportunite.Statut.ToString(),
            DateCloture = opportunite.DateCloture,
            LeadId = opportunite.LeadId,
            LeadSource = opportunite.Lead?.Source
        };
    }
}
