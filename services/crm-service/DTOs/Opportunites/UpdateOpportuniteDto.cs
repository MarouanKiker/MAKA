using System.ComponentModel.DataAnnotations;

namespace CrmService.DTOs.Opportunites;

public class UpdateOpportuniteDto
{
    [MaxLength(200)]
    public string? Titre { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? Valeur { get; set; }

    public string? Statut { get; set; }

    public DateTime? DateCloture { get; set; }
}
