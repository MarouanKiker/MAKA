using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmService.Models;

public class Compte
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Nom { get; set; } = string.Empty;

    [MaxLength(180)]
    public string? Email { get; set; }

    [MaxLength(20)]
    public string? Telephone { get; set; }

    [MaxLength(150)]
    public string? SecteurActivite { get; set; }

    [MaxLength(500)]
    public string? Adresse { get; set; }

    public DateTime DateCreation { get; set; } = DateTime.UtcNow;

    // Navigation : un compte peut avoir plusieurs contacts
    public virtual ICollection<Contact> Contacts { get; set; } = new List<Contact>();
}
