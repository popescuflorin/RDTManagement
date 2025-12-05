using System.ComponentModel.DataAnnotations;

namespace ProductionManagement.API.Models
{
    // Request DTOs
    public class CreateClientRequest
    {
        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;

        [StringLength(100)]
        public string? ContactPerson { get; set; }

        [StringLength(100)]
        public string? Email { get; set; }

        [StringLength(20)]
        public string? Phone { get; set; }

        [StringLength(200)]
        public string? Address { get; set; }

        [StringLength(100)]
        public string? City { get; set; }

        [StringLength(50)]
        public string? PostalCode { get; set; }

        [StringLength(100)]
        public string? Country { get; set; }

        [StringLength(1000)]
        public string? Notes { get; set; }
    }

    public class UpdateClientRequest
    {
        [StringLength(200)]
        public string? Name { get; set; }

        [StringLength(100)]
        public string? ContactPerson { get; set; }

        [StringLength(100)]
        public string? Email { get; set; }

        [StringLength(20)]
        public string? Phone { get; set; }

        [StringLength(200)]
        public string? Address { get; set; }

        [StringLength(100)]
        public string? City { get; set; }

        [StringLength(50)]
        public string? PostalCode { get; set; }

        [StringLength(100)]
        public string? Country { get; set; }

        [StringLength(1000)]
        public string? Notes { get; set; }

        public bool? IsActive { get; set; }
    }

    // Response DTOs
    public class ClientInfo
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? ContactPerson { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? PostalCode { get; set; }
        public string? Country { get; set; }
        public string? Notes { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string CreatedByUserName { get; set; } = string.Empty;
        public int TotalOrders { get; set; }
        public decimal TotalOrderValue { get; set; }
        public DateTime? LastOrderDate { get; set; }
    }

    public class ClientStatistics
    {
        public int TotalClients { get; set; }
        public int ActiveClients { get; set; }
        public int InactiveClients { get; set; }
        public decimal TotalOrderValue { get; set; }
        public int TotalOrders { get; set; }
        public ClientInfo? TopClientByValue { get; set; }
        public ClientInfo? TopClientByCount { get; set; }
    }

    public class ClientPagedRequest
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? SearchTerm { get; set; }
        public bool? IsActive { get; set; }
        public string SortBy { get; set; } = "Name";
        public string SortOrder { get; set; } = "asc";
    }
}

