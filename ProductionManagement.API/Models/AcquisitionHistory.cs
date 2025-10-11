using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProductionManagement.API.Models
{
    public class AcquisitionHistory
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int AcquisitionId { get; set; }

        [ForeignKey("AcquisitionId")]
        public virtual Acquisition Acquisition { get; set; } = null!;

        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;

        [Required]
        [StringLength(50)]
        public string Action { get; set; } = string.Empty; // Created, Updated, Received, Processed, Cancelled

        [Required]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public string? Changes { get; set; } // JSON string with changes

        [StringLength(500)]
        public string? Notes { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public enum AcquisitionAction
    {
        Created,
        Updated,
        StatusChanged,
        Received,
        Processed,
        Cancelled
    }
}

