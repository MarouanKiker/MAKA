using CrmService.DTOs.Interactions;

namespace CrmService.Interfaces;

public interface IInteractionService
{
    Task<List<InteractionResponseDto>> GetAllAsync();
    Task<InteractionResponseDto?> GetByIdAsync(int id);
    Task<InteractionResponseDto> CreateAsync(CreateInteractionDto dto);
    Task<InteractionResponseDto?> UpdateAsync(int id, UpdateInteractionDto dto);
    Task<bool> DeleteAsync(int id);
}
