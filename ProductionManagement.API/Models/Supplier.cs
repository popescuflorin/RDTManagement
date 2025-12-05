using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProductionManagement.API.Models
{
    public class Supplier
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(200)]
        public string? Description { get; set; }

        [StringLength(100)]
        public string? ContactPerson { get; set; }

        [StringLength(20)]
        public string? Phone { get; set; }

        [StringLength(100)]
        public string? Email { get; set; }

        [StringLength(200)]
        public string? Address { get; set; }

        [StringLength(50)]
        public string? City { get; set; }

        [StringLength(20)]
        public string? PostalCode { get; set; }

        [StringLength(50)]
        public string? Country { get; set; }

        [StringLength(50)]
        public string? TaxId { get; set; }

        [StringLength(50)]
        public string? RegistrationNumber { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public int CreatedByUserId { get; set; }

        public string CreatedByUserName { get; set; } = string.Empty;

        // Navigation properties
        public virtual ICollection<Acquisition> Acquisitions { get; set; } = new List<Acquisition>();

        // Computed properties
        [NotMapped]
        public int TotalAcquisitions => Acquisitions?.Count ?? 0;

        [NotMapped]
        public decimal TotalAcquisitionValue => Acquisitions?.Sum(a => a.TotalActualCost) ?? 0;

        [NotMapped]
        public DateTime? LastAcquisitionDate => Acquisitions?.OrderByDescending(a => a.CreatedAt).FirstOrDefault()?.CreatedAt;
    }

    public class SupplierDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ContactPerson { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? PostalCode { get; set; }
        public string? Country { get; set; }
        public string? TaxId { get; set; }
        public string? RegistrationNumber { get; set; }
        public string? Notes { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string CreatedByUserName { get; set; } = string.Empty;
        public int TotalAcquisitions { get; set; }
        public decimal TotalAcquisitionValue { get; set; }
        public DateTime? LastAcquisitionDate { get; set; }
    }

    public class CreateSupplierRequest
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(200)]
        public string? Description { get; set; }

        [StringLength(100)]
        public string? ContactPerson { get; set; }

        [StringLength(20)]
        public string? Phone { get; set; }

        [StringLength(100)]
        public string? Email { get; set; }

        [StringLength(200)]
        public string? Address { get; set; }

        [StringLength(50)]
        public string? City { get; set; }

        [StringLength(20)]
        public string? PostalCode { get; set; }

        [StringLength(50)]
        public string? Country { get; set; }

        [StringLength(50)]
        public string? TaxId { get; set; }

        [StringLength(50)]
        public string? RegistrationNumber { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }
    }

    public class UpdateSupplierRequest
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(200)]
        public string? Description { get; set; }

        [StringLength(100)]
        public string? ContactPerson { get; set; }

        [StringLength(20)]
        public string? Phone { get; set; }

        [StringLength(100)]
        public string? Email { get; set; }

        [StringLength(200)]
        public string? Address { get; set; }

        [StringLength(50)]
        public string? City { get; set; }

        [StringLength(20)]
        public string? PostalCode { get; set; }

        [StringLength(50)]
        public string? Country { get; set; }

        [StringLength(50)]
        public string? TaxId { get; set; }

        [StringLength(50)]
        public string? RegistrationNumber { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public class SupplierStatistics
    {
        public int TotalSuppliers { get; set; }
        public int ActiveSuppliers { get; set; }
        public int InactiveSuppliers { get; set; }
        public decimal TotalAcquisitionValue { get; set; }
        public int TotalAcquisitions { get; set; }
        public Supplier? TopSupplierByValue { get; set; }
        public Supplier? TopSupplierByCount { get; set; }
    }

    public class SupplierPagedRequest
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? SearchTerm { get; set; }
        public bool? IsActive { get; set; }
        public string SortBy { get; set; } = "Name";
        public string SortOrder { get; set; } = "asc";
    }
}
