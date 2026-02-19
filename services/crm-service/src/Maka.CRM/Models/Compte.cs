using System.ComponentModel.DataAnnotations;

namespace Maka.CRM.Models;

public class Compte
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string Nom { get; set; } = string.Empty;

    [MaxLength(180)]
    public string? Email { get; set; }

    [MaxLength(20)]
    public string? Telephone { get; set; }

    [MaxLength(100)]
    public string? Fonction { get; set; }

    public int? UtilisateurId { get; set; }

    // Navigation
    public ICollection<Contact> Contacts { get; set; } = new List<Contact>();
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
