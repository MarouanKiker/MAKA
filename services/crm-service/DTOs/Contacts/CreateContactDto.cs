using System.ComponentModel.DataAnnotations;

namespace CrmService.DTOs.Contacts;

public class CreateContactDto
{
    [Required(ErrorMessage = "Le prénom est obligatoire.")]
    [MaxLength(100)]
    public string Prenom { get; set; } = string.Empty;

    [Required(ErrorMessage = "Le nom est obligatoire.")]
    [MaxLength(100)]
    public string Nom { get; set; } = string.Empty;

    [MaxLength(180)]
    [EmailAddress(ErrorMessage = "Format email invalide.")]
    public string? Email { get; set; }

    [MaxLength(20)]
    public string? Telephone { get; set; }

    [MaxLength(50)]
    public string Type { get; set; } = "Autre";

    [MaxLength(300)]
    public string? Adresse { get; set; }

    [Required(ErrorMessage = "Le compte associé est obligatoire.")]
    public int CompteId { get; set; }
}
