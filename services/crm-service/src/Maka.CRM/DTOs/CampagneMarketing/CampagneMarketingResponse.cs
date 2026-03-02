using System;

namespace Maka.CRM.DTOs.CampagneMarketing;

public class CampagneMarketingResponse
{
    public int IdCampagne { get; set; }
    public string Nom { get; set; } = string.Empty;
    public decimal Budget { get; set; }
    public DateTime DateDebut { get; set; }
    public DateTime DateFin { get; set; }
}