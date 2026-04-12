using CrmService.DTOs.Interactions;
using CrmService.Interfaces;
using CrmService.Mappers;

namespace CrmService.Services;

public class InteractionService : IInteractionService
{
    private readonly IInteractionRepository _repo;

    public InteractionService(IInteractionRepository repo)
    {
        _repo = repo;
    }

    public async Task<List<InteractionResponseDto>> GetAllAsync()
    {
        var interactions = await _repo.GetAllAsync();
        return interactions.Select(InteractionMapper.ToResponseDto).ToList();
    }

    public async Task<InteractionResponseDto?> GetByIdAsync(int id)
    {
        var interaction = await _repo.GetByIdAsync(id);
        return interaction == null ? null : InteractionMapper.ToResponseDto(interaction);
    }

    public async Task<InteractionResponseDto> CreateAsync(CreateInteractionDto dto)
    {
        var interaction = InteractionMapper.ToEntity(dto);
        var created = await _repo.CreateAsync(interaction);
        var result = await _repo.GetByIdAsync(created.Id);
        return InteractionMapper.ToResponseDto(result!);
    }

    public async Task<InteractionResponseDto?> UpdateAsync(int id, UpdateInteractionDto dto)
    {
        var interaction = await _repo.GetByIdAsync(id);
        if (interaction == null) return null;

        if (dto.Type != null)
            interaction.Type = dto.Type;

        if (dto.Notes != null)
            interaction.Notes = dto.Notes;

        if (dto.Date.HasValue)
            interaction.Date = dto.Date.Value;

        if (dto.LeadId.HasValue)
            interaction.LeadId = dto.LeadId;

        var updated = await _repo.UpdateAsync(interaction);
        return InteractionMapper.ToResponseDto(updated);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        return await _repo.DeleteAsync(id);
    }
}
