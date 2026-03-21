using System.ComponentModel.DataAnnotations;

namespace CrmService.DTOs.Campagnes;

public class UpdateCampagneDto
{
    [MaxLength(200)]
    public string? Nom { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? Budget { get; set; }

    public DateTime? DateDebut { get; set; }

    public DateTime? DateFin { get; set; }
}
