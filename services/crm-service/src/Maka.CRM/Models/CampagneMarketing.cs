using System.ComponentModel.DataAnnotations;

namespace Maka.CRM.Models;

public class CampagneMarketing
{
    [Key]
    public int IdCampagne { get; set; }
    public string Nom { get; set; } 
    public decimal Budget { get; set; }
    public DateTime DateDebut { get; set; }
    public DateTime DateFin { get; set; }

   
    public ICollection<Lead> Leads { get; set; } = new List<Lead>();
}
