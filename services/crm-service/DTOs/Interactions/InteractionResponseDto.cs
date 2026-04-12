namespace CrmService.DTOs.Interactions;

public class InteractionResponseDto
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime Date { get; set; }
    public int? LeadId { get; set; }
}
