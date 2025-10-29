using System.ComponentModel.DataAnnotations;

namespace ProductionManagement.API.Models
{
    // Request DTOs
    public class CreateOrderRequest
    {
        [Required]
        public int ClientId { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        [StringLength(1000)]
        public string? Notes { get; set; }

        public DateTime OrderDate { get; set; } = DateTime.UtcNow;

        public DateTime? ExpectedDeliveryDate { get; set; }

        public int? TransportId { get; set; }

        public DateTime? TransportDate { get; set; }

        [StringLength(500)]
        public string? TransportNotes { get; set; }

        public List<CreateOrderMaterialRequest> OrderMaterials { get; set; } = new List<CreateOrderMaterialRequest>();
    }

    public class CreateOrderMaterialRequest
    {
        [Required]
        public int RawMaterialId { get; set; }

        [Required]
        public decimal Quantity { get; set; }
    }

    public class UpdateOrderRequest
    {
        public int? ClientId { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        [StringLength(1000)]
        public string? Notes { get; set; }

        public OrderStatus? Status { get; set; }

        public DateTime? OrderDate { get; set; }

        public DateTime? ExpectedDeliveryDate { get; set; }

        public int? TransportId { get; set; }

        public DateTime? TransportDate { get; set; }

        [StringLength(500)]
        public string? TransportNotes { get; set; }

        public List<CreateOrderMaterialRequest>? OrderMaterials { get; set; }
    }

    // Response DTOs
    public class OrderInfo
    {
        public int Id { get; set; }
        public int ClientId { get; set; }
        public string ClientName { get; set; } = string.Empty;
        public string? ClientContactPerson { get; set; }
        public string? ClientEmail { get; set; }
        public string? ClientPhone { get; set; }
        public string? ClientAddress { get; set; }
        public string? ClientCity { get; set; }
        public string? ClientPostalCode { get; set; }
        public string? ClientCountry { get; set; }
        public string? Description { get; set; }
        public string? Notes { get; set; }
        public OrderStatus Status { get; set; }
        public string StatusLabel { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        public DateTime? ExpectedDeliveryDate { get; set; }
        public DateTime? DeliveryDate { get; set; }
        public int? TransportId { get; set; }
        public string? TransportCarName { get; set; }
        public string? TransportPhoneNumber { get; set; }
        public DateTime? TransportDate { get; set; }
        public string? TransportNotes { get; set; }
        public string CreatedByUserName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public List<OrderMaterialInfo> OrderMaterials { get; set; } = new List<OrderMaterialInfo>();
        public decimal TotalValue { get; set; }
    }

    public class OrderMaterialInfo
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        public int RawMaterialId { get; set; }
        public string MaterialName { get; set; } = string.Empty;
        public string MaterialColor { get; set; } = string.Empty;
        public string QuantityType { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
    }

    public class OrderStatistics
    {
        public int TotalOrders { get; set; }
        public int DraftOrders { get; set; }
        public int PendingOrders { get; set; }
        public int ProcessingOrders { get; set; }
        public int ShippedOrders { get; set; }
        public int DeliveredOrders { get; set; }
        public decimal TotalOrderValue { get; set; }
    }
}

