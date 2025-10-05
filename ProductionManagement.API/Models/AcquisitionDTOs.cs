using System.ComponentModel.DataAnnotations;

namespace ProductionManagement.API.Models
{
    // Request DTOs
    public class CreateAcquisitionRequest
    {
        [Required]
        [StringLength(100)]
        public string Title { get; set; } = string.Empty;

        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        [Required]
        public AcquisitionType Type { get; set; } = AcquisitionType.RawMaterials;

        public int? SupplierId { get; set; }

        [StringLength(100)]
        public string? SupplierContact { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        public DateTime? DueDate { get; set; }

        // Transport details
        public string? TransportCarName { get; set; }
        public string? TransportPhoneNumber { get; set; }
        public DateTime? TransportDate { get; set; }
        public string? TransportNotes { get; set; }

        public List<CreateAcquisitionItemRequest> Items { get; set; } = new();
    }

    public class CreateAcquisitionItemRequest
    {
        [Required]
        public int RawMaterialId { get; set; }

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

        [StringLength(500)]
        public string? Description { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }
    }

    public class UpdateAcquisitionRequest
    {
        [Required]
        [StringLength(100)]
        public string Title { get; set; } = string.Empty;

        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        public int? SupplierId { get; set; }

        [StringLength(100)]
        public string? SupplierContact { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        public DateTime? DueDate { get; set; }

        // Transport details
        public string? TransportCarName { get; set; }
        public string? TransportPhoneNumber { get; set; }
        public DateTime? TransportDate { get; set; }
        public string? TransportNotes { get; set; }

        public List<UpdateAcquisitionItemRequest> Items { get; set; } = new();
    }

    public class UpdateAcquisitionItemRequest
    {
        public int? Id { get; set; } // null for new items

        [Required]
        public int RawMaterialId { get; set; }

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

        [StringLength(500)]
        public string? Description { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }
    }

    public class ReceiveAcquisitionRequest
    {
        public List<ReceiveAcquisitionItemRequest> Items { get; set; } = new();
    }

    public class ReceiveAcquisitionItemRequest
    {
        [Required]
        public int AcquisitionItemId { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? ActualUnitCost { get; set; }
    }

    // Response DTOs
    public class AcquisitionDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public AcquisitionType Type { get; set; }
        public AcquisitionStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? ReceivedAt { get; set; }
        public int CreatedByUserId { get; set; }
        public string CreatedByUserName { get; set; } = string.Empty;
        public int? ReceivedByUserId { get; set; }
        public string? ReceivedByUserName { get; set; }
        public int? SupplierId { get; set; }
        public string? SupplierName { get; set; }
        public string? SupplierContact { get; set; }
        public string? Notes { get; set; }
        public DateTime? DueDate { get; set; }

        // Transport details
        public string? TransportCarName { get; set; }
        public string? TransportPhoneNumber { get; set; }
        public DateTime? TransportDate { get; set; }
        public string? TransportNotes { get; set; }

        public decimal TotalEstimatedCost { get; set; }
        public decimal TotalActualCost { get; set; }
        public int TotalItems { get; set; }
        public int TotalQuantity { get; set; }
        public bool CanEdit { get; set; }
        public bool CanDelete { get; set; }
        public bool CanReceive { get; set; }
        public List<AcquisitionItemDto> Items { get; set; } = new();
    }

    public class AcquisitionItemDto
    {
        public int Id { get; set; }
        public int AcquisitionId { get; set; }
        public int RawMaterialId { get; set; }
        public string RawMaterialName { get; set; } = string.Empty;
        public string RawMaterialColor { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public string QuantityType { get; set; } = string.Empty;
        public decimal? ActualUnitCost { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public decimal EstimatedTotalCost { get; set; }
        public decimal ActualTotalCost { get; set; }
    }

    public class AcquisitionStatistics
    {
        public int TotalAcquisitions { get; set; }
        public int DraftAcquisitions { get; set; }
        public int ReceivedAcquisitions { get; set; }
        public int CancelledAcquisitions { get; set; }
        public decimal TotalEstimatedCost { get; set; }
        public decimal TotalActualCost { get; set; }
        public int TotalItems { get; set; }
        public int TotalQuantity { get; set; }
    }
}
