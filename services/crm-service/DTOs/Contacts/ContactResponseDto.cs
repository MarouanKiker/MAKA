namespace CrmService.DTOs.Contacts;

public class ContactResponseDto
{
    public int Id { get; set; }
    public string Prenom { get; set; } = string.Empty;
    public string Nom { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Telephone { get; set; }
    public string Type { get; set; } = string.Empty;
    public string? Adresse { get; set; }
    public DateTime DateCreation { get; set; }
    public int CompteId { get; set; }
    public string CompteNom { get; set; } = string.Empty;
}
