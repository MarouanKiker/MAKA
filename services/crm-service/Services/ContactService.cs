using CrmService.DTOs.Contacts;
using CrmService.Interfaces;
using CrmService.Mappers;

namespace CrmService.Services;

public class ContactService : IContactService
{
    private readonly IContactRepository _contactRepository;
    private readonly ICompteRepository  _compteRepository;

    public ContactService(IContactRepository contactRepository, ICompteRepository compteRepository)
    {
        _contactRepository = contactRepository;
        _compteRepository  = compteRepository;
    }

    public async Task<List<ContactResponseDto>> GetAllAsync(int? compteId, string? search)
    {
        var contacts = await _contactRepository.GetAllAsync(compteId, search);
        return contacts.Select(ContactMapper.ToResponseDto).ToList();
    }

    public async Task<ContactResponseDto?> GetByIdAsync(int id)
    {
        var contact = await _contactRepository.GetByIdAsync(id);
        return contact == null ? null : ContactMapper.ToResponseDto(contact);
    }

    public async Task<ContactResponseDto> CreateAsync(CreateContactDto dto)
    {
        // Vérifie que le compte existe
        if (!await _compteRepository.ExistsAsync(dto.CompteId))
            throw new KeyNotFoundException($"Compte avec l'id {dto.CompteId} introuvable.");

        var contact = ContactMapper.ToEntity(dto);
        var created = await _contactRepository.CreateAsync(contact);
        var result  = await _contactRepository.GetByIdAsync(created.Id);
        return ContactMapper.ToResponseDto(result!);
    }

    public async Task<ContactResponseDto?> UpdateAsync(int id, UpdateContactDto dto)
    {
        var contact = await _contactRepository.GetByIdAsync(id);
        if (contact == null) return null;

        if (dto.Prenom   != null) contact.Prenom   = dto.Prenom;
        if (dto.Nom      != null) contact.Nom       = dto.Nom;
        if (dto.Email    != null) contact.Email     = dto.Email;
        if (dto.Telephone != null) contact.Telephone = dto.Telephone;
        if (dto.Type     != null) contact.Type      = dto.Type;
        if (dto.Adresse  != null) contact.Adresse   = dto.Adresse;

        if (dto.CompteId.HasValue)
        {
            if (!await _compteRepository.ExistsAsync(dto.CompteId.Value))
                throw new KeyNotFoundException($"Compte avec l'id {dto.CompteId.Value} introuvable.");
            contact.CompteId = dto.CompteId.Value;
        }

        var updated = await _contactRepository.UpdateAsync(contact);
        return ContactMapper.ToResponseDto(updated);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        return await _contactRepository.DeleteAsync(id);
    }
}
