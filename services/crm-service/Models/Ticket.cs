using System;

namespace CrmService.Models
{
    public class Ticket
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string Status { get; set; } = "Open"; // Open, Closed, Pending

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // Relation with Lead
        public int? LeadId { get; set; }
        public Lead? Lead { get; set; }
    }
}