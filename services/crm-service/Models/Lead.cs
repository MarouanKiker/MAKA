using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using CrmService.Enums;

namespace CrmService.Models;

public class Lead
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Source { get; set; } = string.Empty;

    [Required]
    public LeadStatut Statut { get; set; } = LeadStatut.NOUVEAU;

    [Range(0, 100)]
    public int Score { get; set; }

    public DateTime DateCreation { get; set; } = DateTime.UtcNow;

    // FK nullable vers Utilisateur (géré par un autre service)
    public int? UtilisateurId { get; set; }

    // FK nullable vers CampagneMarketing
    public int? CampagneId { get; set; }

    [ForeignKey("CampagneId")]
    public CampagneMarketing? Campagne { get; set; }

    // Navigation : un lead peut avoir 0 ou 1 opportunité
    public Opportunite? Opportunite { get; set; }
}
