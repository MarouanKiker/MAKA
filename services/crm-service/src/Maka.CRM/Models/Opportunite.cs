using System.ComponentModel.DataAnnotations;
using Maka.CRM.Enums;

namespace Maka.CRM.Models
{
    public class Opportunite
    {
        [Key]
        public int IdOpportunite { get; set; }
        public string Titre { get; set; }
        public decimal Valeur { get; set; }
        public StatutOpportunite Statut { get; set; }

        // Règle métier : Obligatoire seulement si GAGNEE ou PERDUE
        public DateTime? DateCloture { get; set; }

        // Clé étrangère 
        public int IdLead { get; set; }

        // Propriété de navigation
        public Lead Lead { get; set; } = null!;
    }
}