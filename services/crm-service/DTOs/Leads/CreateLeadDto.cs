using System.ComponentModel.DataAnnotations;

namespace CrmService.DTOs.Leads;

public class CreateLeadDto
{
    [Required]
    [MaxLength(100)]
    public string Source { get; set; } = string.Empty;

    [MaxLength(200)]
    public string Entreprise { get; set; } = string.Empty;

    [MaxLength(200)]
    public string NomContact { get; set; } = string.Empty;

    [MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Telephone { get; set; } = string.Empty;

    [Range(0, 100)]
    public int Score { get; set; }

    public int? CampagneId { get; set; }
    public int? UtilisateurId { get; set; }
}
