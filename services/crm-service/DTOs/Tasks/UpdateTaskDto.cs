namespace CrmService.DTOs.Tasks;

public class UpdateTaskDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public DateTime? DueDate { get; set; }
    public bool? IsCompleted { get; set; }
    public int? LeadId { get; set; }
    public int? OpportuniteId { get; set; }
}
