using CrmService.DTOs.Contacts;

namespace CrmService.Interfaces;

public interface IContactService
{
    Task<List<ContactResponseDto>> GetAllAsync(int? compteId, string? search);
    Task<ContactResponseDto?> GetByIdAsync(int id);
    Task<ContactResponseDto> CreateAsync(CreateContactDto dto);
    Task<ContactResponseDto?> UpdateAsync(int id, UpdateContactDto dto);
    Task<bool> DeleteAsync(int id);
}
