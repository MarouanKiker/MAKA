using System.ComponentModel.DataAnnotations;

namespace CrmService.DTOs.Leads;

public class UpdateLeadDto
{
    [MaxLength(100)]
    public string? Source { get; set; }

    public string? Statut { get; set; }

    [Range(0, 100)]
    public int? Score { get; set; }

    public int? CampagneId { get; set; }
}
