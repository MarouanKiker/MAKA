using CrmService.DTOs.Interactions;
using CrmService.Models;

namespace CrmService.Mappers;

public static class InteractionMapper
{
    public static Interaction ToEntity(CreateInteractionDto dto)
    {
        return new Interaction
        {
            Type = dto.Type,
            Notes = dto.Notes ?? string.Empty,
            Date = dto.Date ?? DateTime.UtcNow,
            LeadId = dto.LeadId
        };
    }

    public static InteractionResponseDto ToResponseDto(Interaction interaction)
    {
        return new InteractionResponseDto
        {
            Id = interaction.Id,
            Type = interaction.Type,
            Notes = interaction.Notes,
            Date = interaction.Date,
            LeadId = interaction.LeadId
        };
    }
}
