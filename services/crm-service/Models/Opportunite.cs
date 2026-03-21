using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using CrmService.Enums;

namespace CrmService.Models;

public class Opportunite
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Titre { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Valeur { get; set; }

    [Required]
    public OpportuniteStatut Statut { get; set; } = OpportuniteStatut.NOUVELLE;

    // Obligatoire si Statut == GAGNEE ou PERDUE
    public DateTime? DateCloture { get; set; }

    // FK vers Lead (1 lead → max 1 opportunité, index unique)
    [Required]
    public int LeadId { get; set; }

    [ForeignKey("LeadId")]
    public Lead Lead { get; set; } = null!;
}
