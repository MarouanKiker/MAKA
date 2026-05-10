namespace CrmService.DTOs.Leads;

public class LeadResponseDto
{
    public int Id { get; set; }
    public string Source { get; set; } = string.Empty;
    public string Entreprise { get; set; } = string.Empty;
    public string NomContact { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Telephone { get; set; } = string.Empty;
    public string Statut { get; set; } = string.Empty;
    public int Score { get; set; }
    public DateTime DateCreation { get; set; }
    public int? UtilisateurId { get; set; }
    public int? CampagneId { get; set; }
    public string? CampagneNom { get; set; }
}
