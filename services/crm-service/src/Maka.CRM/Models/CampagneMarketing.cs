using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Maka.CRM.Models;

public class CampagneMarketing
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string Nom { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Budget { get; set; }

    public DateTime DateDebut { get; set; }

    public DateTime? DateFin { get; set; }

    // Navigation
    public ICollection<Lead> Leads { get; set; } = new List<Lead>();
}
