using System;

namespace CrmService.Models
{
    public class Interaction
    {
        public int Id { get; set; }

        public string Type { get; set; } // Call, Email, Meeting

        public string Notes { get; set; }

        public DateTime Date { get; set; } = DateTime.Now;

        // Relation with Lead
        public int? LeadId { get; set; }
        public Lead? Lead { get; set; }
    }
}