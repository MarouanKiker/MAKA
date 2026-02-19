namespace Maka.CRM.DTOs;

public class CreateOpportuniteDto
{
    public string Titre { get; set; } = string.Empty;
    public decimal Valeur { get; set; }
    public string Priorite { get; set; } = "Moyenne";
    public int LeadId { get; set; }
    public DateTime? DateCloture { get; set; }
}

public class OpportuniteResponseDto
{
    public int Id { get; set; }
    public string Titre { get; set; } = string.Empty;
    public decimal Valeur { get; set; }
    public string Priorite { get; set; } = string.Empty;
    public string Statut { get; set; } = string.Empty;
    public int LeadId { get; set; }
    public DateTime? DateCloture { get; set; }
}
