namespace CrmService.DTOs.Interactions;

public class CreateInteractionDto
{
    public string Type { get; set; } = string.Empty; // Call, Email, Meeting
    public string? Notes { get; set; }
    public DateTime? Date { get; set; }
    public int? LeadId { get; set; }
}
