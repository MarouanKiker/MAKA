using System;

namespace Maka.CRM.DTOs.CampagneMarketing;

public class CampagneMarketingRequest
{
    public string Nom { get; set; } = string.Empty;
    public decimal Budget { get; set; }
    public DateTime DateDebut { get; set; }
    public DateTime DateFin { get; set; }
}