using System.ComponentModel.DataAnnotations;

namespace Maka.CRM.Models;

public enum StatutTicket { Ouvert, EnCours, Resolu, Ferme }

public class Ticket
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(300)]
    public string Sujet { get; set; } = string.Empty;

    public StatutTicket Statut { get; set; } = StatutTicket.Ouvert;

    [MaxLength(20)]
    public string? Priorite { get; set; }

    public DateTime DateCreation { get; set; } = DateTime.UtcNow;

    public int CompteId { get; set; }

    public int? UtilisateurId { get; set; }

    // Navigation
    public Compte? Compte { get; set; }
}
