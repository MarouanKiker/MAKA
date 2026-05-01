using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmService.Models;

public class Contact
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Prenom { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Nom { get; set; } = string.Empty;

    [MaxLength(180)]
    public string? Email { get; set; }

    [MaxLength(20)]
    public string? Telephone { get; set; }

    // Type du contact : Decideur, Technique, Commercial, Autre
    [MaxLength(50)]
    public string Type { get; set; } = "Autre";

    [MaxLength(300)]
    public string? Adresse { get; set; }

    public DateTime DateCreation { get; set; } = DateTime.UtcNow;

    // Clé étrangère vers Compte (obligatoire)
    public int CompteId { get; set; }

    [ForeignKey("CompteId")]
    public virtual Compte Compte { get; set; } = null!;
}