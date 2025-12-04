using System.ComponentModel.DataAnnotations;

namespace ProductionManagement.API.Models
{
    public class Transport
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string CarName { get; set; } = string.Empty;

        [StringLength(20)]
        public string? NumberPlate { get; set; }

        [Required]
        [StringLength(20)]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public bool IsActive { get; set; } = true;

        // Navigation properties
        public virtual ICollection<Acquisition> Acquisitions { get; set; } = new List<Acquisition>();
        public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
    }
}

