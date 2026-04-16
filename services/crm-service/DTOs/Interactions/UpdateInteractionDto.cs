namespace CrmService.DTOs.Interactions;

public class UpdateInteractionDto
{
    public string? Type { get; set; }
    public string? Notes { get; set; }
    public DateTime? Date { get; set; }
    public int? LeadId { get; set; }
}
