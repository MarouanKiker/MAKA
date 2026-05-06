using System.ComponentModel.DataAnnotations;

namespace CrmService.DTOs.Comptes;

public class CompteResponseDto
{
    public int Id { get; set; }
    public string Nom { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Telephone { get; set; } = string.Empty;
    public string Responsable { get; set; } = string.Empty;
    public int? UtilisateurId { get; set; }
}

public class CreateCompteDto
{
    [Required]
    [MaxLength(200)]
    public string Nom { get; set; } = string.Empty;

    [MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Telephone { get; set; } = string.Empty;

    [MaxLength(200)]
    public string Responsable { get; set; } = string.Empty;
}
