namespace CrmService.DTOs.Campagnes;

public class CampagneResponseDto
{
    public int Id { get; set; }
    public string Nom { get; set; } = string.Empty;
    public decimal Budget { get; set; }
    public DateTime DateDebut { get; set; }
    public DateTime DateFin { get; set; }
    public int NombreLeads { get; set; }
}
