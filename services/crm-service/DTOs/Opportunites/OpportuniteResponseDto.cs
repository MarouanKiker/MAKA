namespace CrmService.DTOs.Opportunites;

public class OpportuniteResponseDto
{
    public int Id { get; set; }
    public string Titre { get; set; } = string.Empty;
    public decimal Valeur { get; set; }
    public string Statut { get; set; } = string.Empty;
    public DateTime? DateCloture { get; set; }
    public int LeadId { get; set; }
    public string? LeadSource { get; set; }
}
