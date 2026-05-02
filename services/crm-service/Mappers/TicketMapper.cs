using CrmService.DTOs.Tickets;
using CrmService.Models;

namespace CrmService.Mappers;

public static class TicketMapper
{
    public static Ticket ToEntity(CreateTicketDto dto)
    {
        var st = string.IsNullOrWhiteSpace(dto.Status) ? "Open" : dto.Status.Trim();
        return new Ticket
        {
            Title = dto.Title,
            Description = dto.Description ?? string.Empty,
            Status = st,
            LeadId = dto.LeadId,
            CreatedAt = DateTime.UtcNow
        };
    }

    public static TicketResponseDto ToResponseDto(Ticket ticket)
    {
        return new TicketResponseDto
        {
            Id = ticket.Id,
            Title = ticket.Title,
            Description = ticket.Description,
            Status = ticket.Status,
            CreatedAt = ticket.CreatedAt,
            LeadId = ticket.LeadId
        };
    }
}
