using System;

namespace CrmService.Models
{
    public class TaskItem
    {
        public int Id { get; set; }

        public string Title { get; set; }

        public string Description { get; set; }

        public DateTime DueDate { get; set; }

        public bool IsCompleted { get; set; }

        // Relations
        public int? LeadId { get; set; }
        public Lead? Lead { get; set; }

        public int? OpportuniteId { get; set; }
        public Opportunite? Opportunite { get; set; }
    }
}