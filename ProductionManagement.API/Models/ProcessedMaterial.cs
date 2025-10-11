using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProductionManagement.API.Models
{
    public class ProcessedMaterial
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int AcquisitionId { get; set; }

        [ForeignKey("AcquisitionId")]
        public virtual Acquisition Acquisition { get; set; } = null!;

        [Required]
        public int AcquisitionItemId { get; set; }

        [ForeignKey("AcquisitionItemId")]
        public virtual AcquisitionItem AcquisitionItem { get; set; } = null!;

        [Required]
        public int RawMaterialId { get; set; }

        [ForeignKey("RawMaterialId")]
        public virtual RawMaterial RawMaterial { get; set; } = null!;

        [Required]
        [Range(0, double.MaxValue)]
        public decimal Quantity { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public bool IsActive { get; set; } = true;
    }
}

