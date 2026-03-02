using System.ComponentModel.DataAnnotations;
using Maka.CRM.Enums;

namespace Maka.CRM.Models;


public class Lead
{
    [Key]
    public int IdLead { get; set; }
    public string Source { get; set; } = string.Empty;
    public StatutLead Statut { get; set; }
    public int Score { get; set; }
    public DateTime DateCreation { get; set; } = DateTime.UtcNow;

    // Clés étrangères (issues deMLD)
    public int IdUtilisateur { get; set; }
    public int? IdCampagne { get; set; } // Nullable : un lead peut venir d'ailleurs que d'une campagne

    // Propriétés de navigation
    public CampagneMarketing? Campagne { get; set; }

    
    public Opportunite? Opportunite { get; set; }
}
}
