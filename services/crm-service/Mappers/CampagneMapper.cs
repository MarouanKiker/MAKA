using CrmService.DTOs.Campagnes;
using CrmService.Models;

namespace CrmService.Mappers;

public static class CampagneMapper
{
    public static CampagneMarketing ToEntity(CreateCampagneDto dto)
    {
        return new CampagneMarketing
        {
            Nom = dto.Nom,
            Budget = dto.Budget,
            DateDebut = dto.DateDebut,
            DateFin = dto.DateFin
        };
    }

    public static CampagneResponseDto ToResponseDto(CampagneMarketing campagne)
    {
        return new CampagneResponseDto
        {
            Id = campagne.Id,
            Nom = campagne.Nom,
            Budget = campagne.Budget,
            DateDebut = campagne.DateDebut,
            DateFin = campagne.DateFin,
            NombreLeads = campagne.Leads?.Count ?? 0
        };
    }
}
