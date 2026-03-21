using System.ComponentModel.DataAnnotations;

namespace CrmService.DTOs.Opportunites;

public class CreateOpportuniteDto
{
    [Required]
    [MaxLength(200)]
    public string Titre { get; set; } = string.Empty;

    [Range(0, double.MaxValue)]
    public decimal Valeur { get; set; }

    [Required]
    public int LeadId { get; set; }
}
