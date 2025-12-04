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
}

