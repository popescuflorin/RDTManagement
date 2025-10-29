using System.ComponentModel.DataAnnotations;

namespace ProductionManagement.API.Models
{
    public enum OrderStatus
    {
        Draft = 0,
        Pending = 1,
        Processing = 2,
        Shipped = 3,
        Delivered = 4,
        Cancelled = 5
    }

    public class Order
    {
        public int Id { get; set; }

        [Required]
        public int ClientId { get; set; }
        public Client? Client { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        [StringLength(1000)]
        public string? Notes { get; set; }

        public OrderStatus Status { get; set; } = OrderStatus.Draft;

        public DateTime OrderDate { get; set; } = DateTime.UtcNow;

        public DateTime? ExpectedDeliveryDate { get; set; }

        public DateTime? DeliveryDate { get; set; }

        public int? TransportId { get; set; }
        public Transport? Transport { get; set; }

        public DateTime? TransportDate { get; set; }

        [StringLength(500)]
        public string? TransportNotes { get; set; }

        public string CreatedByUserName { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation property
        public virtual ICollection<OrderMaterial> OrderMaterials { get; set; } = new List<OrderMaterial>();
    }

    public class OrderMaterial
    {
        public int Id { get; set; }

        public int OrderId { get; set; }
        public Order? Order { get; set; }

        public int RawMaterialId { get; set; }
        public RawMaterial? RawMaterial { get; set; }

        [Required]
        public decimal Quantity { get; set; }

        // Store material details at time of order (in case material is updated/deleted later)
        [StringLength(200)]
        public string MaterialName { get; set; } = string.Empty;

        [StringLength(100)]
        public string MaterialColor { get; set; } = string.Empty;

        [StringLength(50)]
        public string QuantityType { get; set; } = string.Empty;

        public decimal UnitPrice { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}

