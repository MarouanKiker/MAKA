using System.ComponentModel.DataAnnotations;

namespace Maka.CRM.Models;

public enum PrioriteOpportunite { Basse, Moyenne, Haute, Critique }
public enum StatutOpportunite { Prospect, EnCours, Gagne, Perdu }

public class Opportunite
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string Titre { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Valeur { get; set; }

    public PrioriteOpportunite Priorite { get; set; } = PrioriteOpportunite.Moyenne;

    public StatutOpportunite Statut { get; set; } = StatutOpportunite.Prospect;

    public DateTime? DateCloture { get; set; }

    public int LeadId { get; set; }

    // Navigation
    public Lead? Lead { get; set; }
}
