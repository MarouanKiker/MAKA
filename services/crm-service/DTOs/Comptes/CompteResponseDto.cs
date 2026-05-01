namespace CrmService.DTOs.Comptes;

public class CompteResponseDto
{
    public int Id { get; set; }
    public string Nom { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Telephone { get; set; }
    public string? SecteurActivite { get; set; }
    public string? Adresse { get; set; }
    public DateTime DateCreation { get; set; }
    public int NombreContacts { get; set; }
}
