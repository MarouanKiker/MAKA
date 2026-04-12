using CrmService.DTOs.Tickets;
using CrmService.Interfaces;
using CrmService.Mappers;

namespace CrmService.Services;

public class TicketService : ITicketService
{
    private readonly ITicketRepository _repo;

    public TicketService(ITicketRepository repo)
    {
        _repo = repo;
    }

    public async Task<List<TicketResponseDto>> GetAllAsync()
    {
        var tickets = await _repo.GetAllAsync();
        return tickets.Select(TicketMapper.ToResponseDto).ToList();
    }

    public async Task<TicketResponseDto?> GetByIdAsync(int id)
    {
        var ticket = await _repo.GetByIdAsync(id);
        return ticket == null ? null : TicketMapper.ToResponseDto(ticket);
    }

    public async Task<TicketResponseDto> CreateAsync(CreateTicketDto dto)
    {
        var ticket = TicketMapper.ToEntity(dto);
        var created = await _repo.CreateAsync(ticket);
        var result = await _repo.GetByIdAsync(created.Id);
        return TicketMapper.ToResponseDto(result!);
    }

    public async Task<TicketResponseDto?> UpdateAsync(int id, UpdateTicketDto dto)
    {
        var ticket = await _repo.GetByIdAsync(id);
        if (ticket == null) return null;

        if (dto.Title != null)
            ticket.Title = dto.Title;

        if (dto.Description != null)
            ticket.Description = dto.Description;

        if (dto.Status != null)
            ticket.Status = dto.Status;

        if (dto.LeadId.HasValue)
            ticket.LeadId = dto.LeadId;

        var updated = await _repo.UpdateAsync(ticket);
        return TicketMapper.ToResponseDto(updated);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        return await _repo.DeleteAsync(id);
    }
}
