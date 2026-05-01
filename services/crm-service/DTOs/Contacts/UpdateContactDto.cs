using System.ComponentModel.DataAnnotations;

namespace CrmService.DTOs.Contacts;

public class UpdateContactDto
{
    [MaxLength(100)]
    public string? Prenom { get; set; }

    [MaxLength(100)]
    public string? Nom { get; set; }

    [MaxLength(180)]
    [EmailAddress(ErrorMessage = "Format email invalide.")]
    public string? Email { get; set; }

    [MaxLength(20)]
    public string? Telephone { get; set; }

    [MaxLength(50)]
    public string? Type { get; set; }

    [MaxLength(300)]
    public string? Adresse { get; set; }

    public int? CompteId { get; set; }
}
