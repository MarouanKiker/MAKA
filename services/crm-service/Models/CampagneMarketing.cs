using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmService.Models;

public class CampagneMarketing
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Nom { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Budget { get; set; }

    public DateTime DateDebut { get; set; }

    public DateTime DateFin { get; set; }

    // Navigation : une campagne peut générer plusieurs leads
    public List<Lead> Leads { get; set; } = new();
}
