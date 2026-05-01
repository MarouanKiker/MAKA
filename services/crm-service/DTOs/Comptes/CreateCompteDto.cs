using System.ComponentModel.DataAnnotations;

namespace CrmService.DTOs.Comptes;

public class CreateCompteDto
{
    [Required(ErrorMessage = "Le nom est obligatoire.")]
    [MaxLength(200)]
    public string Nom { get; set; } = string.Empty;

    [MaxLength(180)]
    [EmailAddress(ErrorMessage = "Format email invalide.")]
    public string? Email { get; set; }

    [MaxLength(20)]
    public string? Telephone { get; set; }

    [MaxLength(150)]
    public string? SecteurActivite { get; set; }

    [MaxLength(500)]
    public string? Adresse { get; set; }
}
