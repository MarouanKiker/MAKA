using System.ComponentModel.DataAnnotations;

namespace Maka.CRM.Models;

public enum StatutTache { ATraiter, EnCours, Terminee }

public class Tache
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string Titre { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    public DateTime? DateEcheance { get; set; }

    [MaxLength(20)]
    public string? Priorite { get; set; }

    public StatutTache Statut { get; set; } = StatutTache.ATraiter;

    public int? UtilisateurId { get; set; }

    public int? LeadId { get; set; }

    // Navigation
    public Lead? Lead { get; set; }
}
