using System.ComponentModel.DataAnnotations;

namespace ProductionManagement.API.Models
{
    // Request DTOs
    public class CreateTransportRequest
    {
        [Required]
        [StringLength(100)]
        public string CarName { get; set; } = string.Empty;

        [StringLength(20)]
        public string? NumberPlate { get; set; }

        [Required]
        [StringLength(20)]
        public string PhoneNumber { get; set; } = string.Empty;
    }

    public class UpdateTransportRequest
    {
        [Required]
        [StringLength(100)]
        public string CarName { get; set; } = string.Empty;

        [StringLength(20)]
        public string? NumberPlate { get; set; }

        [Required]
        [StringLength(20)]
        public string PhoneNumber { get; set; } = string.Empty;
    }

    // Response DTOs
    public class TransportDto
    {
        public int Id { get; set; }
        public string CarName { get; set; } = string.Empty;
        public string? NumberPlate { get; set; }
        public string PhoneNumber { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class TransportPagedRequest
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? SearchTerm { get; set; }
        public string SortBy { get; set; } = "CreatedAt";
        public string SortOrder { get; set; } = "desc";
    }

    public class TransportRecordDto
    {
        public int Id { get; set; }
        public string Type { get; set; } = string.Empty; // "Acquisition" or "Order"
        public string CarName { get; set; } = string.Empty;
        public string? NumberPlate { get; set; }
        public string? PhoneNumber { get; set; }
        public DateTime? TransportDate { get; set; }
        public string RelatedEntityName { get; set; } = string.Empty;
        public int RelatedEntityId { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class TransportRecordsPagedRequest
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? SearchTerm { get; set; }
        public string? Type { get; set; } // "Acquisition" or "Order"
        public string SortBy { get; set; } = "TransportDate";
        public string SortOrder { get; set; } = "desc";
    }
}

