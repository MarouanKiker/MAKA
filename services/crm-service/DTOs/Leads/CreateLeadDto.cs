using System.ComponentModel.DataAnnotations;

namespace CrmService.DTOs.Leads;

public class CreateLeadDto
{
    [Required]
    [MaxLength(100)]
    public string Source { get; set; } = string.Empty;

    [Range(0, 100)]
    public int Score { get; set; }

    public int? CampagneId { get; set; }

    public int? UtilisateurId { get; set; }
}
