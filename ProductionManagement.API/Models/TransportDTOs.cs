using System.ComponentModel.DataAnnotations;

namespace ProductionManagement.API.Models
{
    // Request DTOs
    public class CreateTransportRequest
    {
        [Required]
        [StringLength(100)]
        public string CarName { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string PhoneNumber { get; set; } = string.Empty;
    }

    public class UpdateTransportRequest
    {
        [Required]
        [StringLength(100)]
        public string CarName { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string PhoneNumber { get; set; } = string.Empty;
    }

    // Response DTOs
    public class TransportDto
    {
        public int Id { get; set; }
        public string CarName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}

