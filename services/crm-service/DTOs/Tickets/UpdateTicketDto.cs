namespace CrmService.DTOs.Tickets;

public class UpdateTicketDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? Status { get; set; }
    public int? LeadId { get; set; }
}
