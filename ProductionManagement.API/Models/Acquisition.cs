using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProductionManagement.API.Models
{
    public class Acquisition
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Title { get; set; } = string.Empty;

        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        [Required]
        public AcquisitionType Type { get; set; } = AcquisitionType.RawMaterials;

        [Required]
        public AcquisitionStatus Status { get; set; } = AcquisitionStatus.Draft;

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public DateTime? ReceivedAt { get; set; }

        [Required]
        public int CreatedByUserId { get; set; }

        [ForeignKey("CreatedByUserId")]
        public virtual User CreatedBy { get; set; } = null!;

        public int? ReceivedByUserId { get; set; }

        [ForeignKey("ReceivedByUserId")]
        public virtual User? ReceivedBy { get; set; }

        public int? AssignedToUserId { get; set; }

        [ForeignKey("AssignedToUserId")]
        public virtual User? AssignedTo { get; set; }

        public int? SupplierId { get; set; }

        [StringLength(100)]
        public string? SupplierName { get; set; }

        [StringLength(100)]
        public string? SupplierContact { get; set; }

        // Navigation property
        [ForeignKey("SupplierId")]
        public virtual Supplier? Supplier { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        public DateTime? DueDate { get; set; }

        // Transport relationship
        public int? TransportId { get; set; }

        [ForeignKey("TransportId")]
        public virtual Transport? Transport { get; set; }

        // Transport specific details for this acquisition
        public DateTime? TransportDate { get; set; }

        [StringLength(500)]
        public string? TransportNotes { get; set; }

        public decimal TotalEstimatedCost { get; set; } = 0;

        public decimal TotalActualCost { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        // Navigation properties
        public virtual ICollection<AcquisitionItem> Items { get; set; } = new List<AcquisitionItem>();
        public virtual ICollection<ProcessedMaterial> ProcessedMaterials { get; set; } = new List<ProcessedMaterial>();

        // Calculated properties
        [NotMapped]
        public int TotalItems => Items.Count;

        [NotMapped]
        public int TotalQuantity => (int)Items.Sum(i => i.Quantity);

        [NotMapped]
        public bool CanEdit => Status == AcquisitionStatus.Draft;

        [NotMapped]
        public bool CanDelete => Status == AcquisitionStatus.Draft;

        [NotMapped]
        public bool CanReceive => Status == AcquisitionStatus.Draft;
    }

    public class AcquisitionItem
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int AcquisitionId { get; set; }

        [ForeignKey("AcquisitionId")]
        public virtual Acquisition Acquisition { get; set; } = null!;

        [Required]
        public int RawMaterialId { get; set; }

        [ForeignKey("RawMaterialId")]
        public virtual RawMaterial RawMaterial { get; set; } = null!;

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Color { get; set; } = string.Empty;

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Quantity must be greater than 0")]
        public decimal Quantity { get; set; }

        [Required]
        [StringLength(50)]
        public string QuantityType { get; set; } = string.Empty;

        [Range(0, double.MaxValue)]
        public decimal? ActualUnitCost { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public bool IsActive { get; set; } = true;

        // Calculated properties
        [NotMapped]
        public decimal EstimatedTotalCost => 0; // No estimated cost for materials

        [NotMapped]
        public decimal ActualTotalCost => (ActualUnitCost ?? 0) * Quantity;
    }

    public enum AcquisitionType
    {
        RawMaterials = 0,
        RecyclableMaterials = 1
    }

    public enum AcquisitionStatus
    {
        Draft = 0,
        Received = 1,
        Cancelled = 2,
        ReadyForProcessing = 3
    }
}
