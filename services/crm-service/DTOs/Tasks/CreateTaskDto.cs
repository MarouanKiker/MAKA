namespace CrmService.DTOs.Tasks;

public class CreateTaskDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime DueDate { get; set; }
    public int? LeadId { get; set; }
    public int? OpportuniteId { get; set; }
}