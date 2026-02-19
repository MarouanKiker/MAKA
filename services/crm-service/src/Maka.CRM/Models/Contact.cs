using System.ComponentModel.DataAnnotations;

namespace Maka.CRM.Models;

public class Contact
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string Nom { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Type { get; set; }

    [MaxLength(180)]
    public string? Email { get; set; }

    [MaxLength(300)]
    public string? Adresse { get; set; }

    public int CompteId { get; set; }

    // Navigation
    public Compte? Compte { get; set; }
    public ICollection<Interaction> Interactions { get; set; } = new List<Interaction>();
}
