using System.ComponentModel.DataAnnotations;

namespace CrmService.DTOs.Leads;

public class UpdateLeadDto
{
    [MaxLength(100)]
    public string? Source { get; set; }

    [MaxLength(200)]
    public string? Entreprise { get; set; }

    [MaxLength(200)]
    public string? NomContact { get; set; }

    [MaxLength(200)]
    public string? Email { get; set; }

    [MaxLength(50)]
    public string? Telephone { get; set; }

    public string? Statut { get; set; }

    [Range(0, 100)]
    public int? Score { get; set; }

    public int? CampagneId { get; set; }
}
