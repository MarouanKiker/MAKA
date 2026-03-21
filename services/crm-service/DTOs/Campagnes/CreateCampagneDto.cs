using System.ComponentModel.DataAnnotations;

namespace CrmService.DTOs.Campagnes;

public class CreateCampagneDto
{
    [Required]
    [MaxLength(200)]
    public string Nom { get; set; } = string.Empty;

    [Range(0, double.MaxValue)]
    public decimal Budget { get; set; }

    [Required]
    public DateTime DateDebut { get; set; }

    [Required]
    public DateTime DateFin { get; set; }
}
