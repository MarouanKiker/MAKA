using CrmService.DTOs.Contacts;
using CrmService.Models;

namespace CrmService.Mappers;

public static class ContactMapper
{
    public static Contact ToEntity(CreateContactDto dto)
    {
        return new Contact
        {
            Prenom       = dto.Prenom,
            Nom          = dto.Nom,
            Email        = dto.Email,
            Telephone    = dto.Telephone,
            Type         = dto.Type,
            Adresse      = dto.Adresse,
            CompteId     = dto.CompteId,
            DateCreation = DateTime.UtcNow
        };
    }

    public static ContactResponseDto ToResponseDto(Contact contact)
    {
        return new ContactResponseDto
        {
            Id           = contact.Id,
            Prenom       = contact.Prenom,
            Nom          = contact.Nom,
            Email        = contact.Email,
            Telephone    = contact.Telephone,
            Type         = contact.Type,
            Adresse      = contact.Adresse,
            DateCreation = contact.DateCreation,
            CompteId     = contact.CompteId,
            CompteNom    = contact.Compte?.Nom ?? string.Empty
        };
    }
}
