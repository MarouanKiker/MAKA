using CrmService.DTOs.Leads;
using CrmService.Models;

namespace CrmService.Mappers;

public static class LeadMapper
{
    public static Lead ToEntity(CreateLeadDto dto)
    {
        return new Lead
        {
            Source = dto.Source,
            Score = dto.Score,
            CampagneId = dto.CampagneId,
            UtilisateurId = dto.UtilisateurId,
            Statut = Enums.LeadStatut.NOUVEAU,
            DateCreation = DateTime.UtcNow
        };
    }

    public static LeadResponseDto ToResponseDto(Lead lead)
    {
        return new LeadResponseDto
        {
            Id = lead.Id,
            Source = lead.Source,
            Statut = lead.Statut.ToString(),
            Score = lead.Score,
            DateCreation = lead.DateCreation,
            UtilisateurId = lead.UtilisateurId,
            CampagneId = lead.CampagneId,
            CampagneNom = lead.Campagne?.Nom
        };
    }
}
