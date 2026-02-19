using System.ComponentModel.DataAnnotations;

namespace Maka.CRM.Models;

public enum TypeInteraction { Appel, Email, Reunion, Note }

public class Interaction
{
    [Key]
    public int Id { get; set; }

    public TypeInteraction Type { get; set; }

    public DateTime Date { get; set; } = DateTime.UtcNow;

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public int ContactId { get; set; }

    // Navigation
    public Contact? Contact { get; set; }
}
