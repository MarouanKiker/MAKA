using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Maka.CRM.Models;

public enum StatutLead { Nouveau, Qualifie, Converti, Perdu }

public class Lead
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string Nom { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Source { get; set; }

    public StatutLead Statut { get; set; } = StatutLead.Nouveau;

    public int Score { get; set; } = 0;

    public DateTime DateCreation { get; set; } = DateTime.UtcNow;

    public int? UtilisateurId { get; set; }

    public int? CampagneId { get; set; }

    // Navigation
    public CampagneMarketing? Campagne { get; set; }
    public ICollection<Tache> Taches { get; set; } = new List<Tache>();
    public ICollection<Opportunite> Opportunites { get; set; } = new List<Opportunite>();
}
