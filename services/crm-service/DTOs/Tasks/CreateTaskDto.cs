using System.ComponentModel.DataAnnotations;

namespace CrmService.DTOs.Tasks;

public class CreateTaskDto
{
    [Required(ErrorMessage = "Le titre est obligatoire")]
    [MinLength(1, ErrorMessage = "Le titre est obligatoire")]
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime DueDate { get; set; }
    public int? LeadId { get; set; }
}