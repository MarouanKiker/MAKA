using CrmService.DTOs.Comptes;
using CrmService.Models;

namespace CrmService.Mappers;

public static class CompteMapper
{
    public static Compte ToEntity(CreateCompteDto dto)
    {
        return new Compte
        {
            Nom             = dto.Nom,
            Email           = dto.Email,
            Telephone       = dto.Telephone,
            SecteurActivite = dto.SecteurActivite,
            Adresse         = dto.Adresse,
            DateCreation    = DateTime.UtcNow
        };
    }

    public static CompteResponseDto ToResponseDto(Compte compte)
    {
        return new CompteResponseDto
        {
            Id              = compte.Id,
            Nom             = compte.Nom,
            Email           = compte.Email,
            Telephone       = compte.Telephone,
            SecteurActivite = compte.SecteurActivite,
            Adresse         = compte.Adresse,
            DateCreation    = compte.DateCreation,
            NombreContacts  = compte.Contacts?.Count ?? 0
        };
    }
}
