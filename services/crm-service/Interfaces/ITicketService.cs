using CrmService.DTOs.Tickets;

namespace CrmService.Interfaces;

public interface ITicketService
{
    Task<List<TicketResponseDto>> GetAllAsync();
    Task<TicketResponseDto?> GetByIdAsync(int id);
    Task<TicketResponseDto> CreateAsync(CreateTicketDto dto);
    Task<TicketResponseDto?> UpdateAsync(int id, UpdateTicketDto dto);
    Task<bool> DeleteAsync(int id);
}
