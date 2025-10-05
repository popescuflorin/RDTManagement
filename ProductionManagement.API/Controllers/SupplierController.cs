using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ProductionManagement.API.Models;
using System.Security.Claims;

namespace ProductionManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SupplierController : ControllerBase
    {
        // In-memory storage for demo purposes
        private static List<Supplier> _suppliers = new List<Supplier>
        {
            new Supplier
            {
                Id = 1,
                Name = "Green Materials Co.",
                Description = "Specialized in eco-friendly raw materials",
                ContactPerson = "John Smith",
                Phone = "+1-555-0123",
                Email = "john@greenmaterials.com",
                Address = "123 Eco Street",
                City = "Greenville",
                PostalCode = "12345",
                Country = "USA",
                TaxId = "TAX123456789",
                RegistrationNumber = "REG987654321",
                Notes = "Reliable supplier for sustainable materials",
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-30),
                CreatedByUserId = 1,
                CreatedByUserName = "admin"
            },
            new Supplier
            {
                Id = 2,
                Name = "Recycle Pro Ltd.",
                Description = "Leading provider of recyclable materials",
                ContactPerson = "Sarah Johnson",
                Phone = "+1-555-0456",
                Email = "sarah@recyclepro.com",
                Address = "456 Recycle Road",
                City = "Eco City",
                PostalCode = "67890",
                Country = "USA",
                TaxId = "TAX987654321",
                RegistrationNumber = "REG123456789",
                Notes = "Fast delivery and competitive prices",
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-20),
                CreatedByUserId = 1,
                CreatedByUserName = "admin"
            }
        };

        private static int _nextSupplierId = 3;

        [HttpGet]
        [Authorize(Roles = "Admin,Manager,User")]
        public async Task<ActionResult<IEnumerable<SupplierDto>>> GetSuppliers()
        {
            var supplierDtos = _suppliers
                .Where(s => s.IsActive)
                .Select(MapToDto)
                .OrderBy(s => s.Name)
                .ToList();

            return Ok(supplierDtos);
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Manager,User")]
        public async Task<ActionResult<SupplierDto>> GetSupplier(int id)
        {
            var supplier = _suppliers.FirstOrDefault(s => s.Id == id && s.IsActive);
            if (supplier == null)
            {
                return NotFound(new { message = "Supplier not found" });
            }

            return Ok(MapToDto(supplier));
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<SupplierDto>> CreateSupplier([FromBody] CreateSupplierRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var user = UserController.GetUserById(userId);
            if (user == null)
            {
                return Unauthorized();
            }

            // Check if supplier with same name already exists
            if (_suppliers.Any(s => s.Name.Equals(request.Name, StringComparison.OrdinalIgnoreCase)))
            {
                return BadRequest(new { message = "Supplier with this name already exists" });
            }

            var supplier = new Supplier
            {
                Id = _nextSupplierId++,
                Name = request.Name,
                Description = request.Description,
                ContactPerson = request.ContactPerson,
                Phone = request.Phone,
                Email = request.Email,
                Address = request.Address,
                City = request.City,
                PostalCode = request.PostalCode,
                Country = request.Country,
                TaxId = request.TaxId,
                RegistrationNumber = request.RegistrationNumber,
                Notes = request.Notes,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = userId,
                CreatedByUserName = user.FirstName + " " + user.LastName
            };

            _suppliers.Add(supplier);

            return CreatedAtAction(nameof(GetSupplier), new { id = supplier.Id }, MapToDto(supplier));
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<SupplierDto>> UpdateSupplier(int id, [FromBody] UpdateSupplierRequest request)
        {
            var supplier = _suppliers.FirstOrDefault(s => s.Id == id && s.IsActive);
            if (supplier == null)
            {
                return NotFound(new { message = "Supplier not found" });
            }

            // Check if supplier with same name already exists (excluding current supplier)
            if (_suppliers.Any(s => s.Name.Equals(request.Name, StringComparison.OrdinalIgnoreCase) && s.Id != id))
            {
                return BadRequest(new { message = "Supplier with this name already exists" });
            }

            // Update supplier information
            supplier.Name = request.Name;
            supplier.Description = request.Description;
            supplier.ContactPerson = request.ContactPerson;
            supplier.Phone = request.Phone;
            supplier.Email = request.Email;
            supplier.Address = request.Address;
            supplier.City = request.City;
            supplier.PostalCode = request.PostalCode;
            supplier.Country = request.Country;
            supplier.TaxId = request.TaxId;
            supplier.RegistrationNumber = request.RegistrationNumber;
            supplier.Notes = request.Notes;
            supplier.IsActive = request.IsActive;
            supplier.UpdatedAt = DateTime.UtcNow;

            return Ok(MapToDto(supplier));
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteSupplier(int id)
        {
            var supplier = _suppliers.FirstOrDefault(s => s.Id == id);
            if (supplier == null)
            {
                return NotFound(new { message = "Supplier not found" });
            }

            // Check if supplier has any acquisitions
            var hasAcquisitions = _suppliers.Any(s => s.Id == id && s.Acquisitions.Any());
            if (hasAcquisitions)
            {
                return BadRequest(new { message = "Cannot delete supplier with existing acquisitions" });
            }

            _suppliers.Remove(supplier);
            return Ok(new { message = "Supplier deleted successfully" });
        }

        [HttpGet("statistics")]
        [Authorize(Roles = "Admin,Manager,User")]
        public async Task<ActionResult<SupplierStatistics>> GetStatistics()
        {
            var activeSuppliers = _suppliers.Where(s => s.IsActive).ToList();
            
            var statistics = new SupplierStatistics
            {
                TotalSuppliers = _suppliers.Count,
                ActiveSuppliers = activeSuppliers.Count,
                InactiveSuppliers = _suppliers.Count - activeSuppliers.Count,
                TotalAcquisitionValue = activeSuppliers.Sum(s => s.TotalAcquisitionValue),
                TotalAcquisitions = activeSuppliers.Sum(s => s.TotalAcquisitions),
                TopSupplierByValue = activeSuppliers.OrderByDescending(s => s.TotalAcquisitionValue).FirstOrDefault(),
                TopSupplierByCount = activeSuppliers.OrderByDescending(s => s.TotalAcquisitions).FirstOrDefault()
            };

            return Ok(statistics);
        }

        private static SupplierDto MapToDto(Supplier supplier)
        {
            return new SupplierDto
            {
                Id = supplier.Id,
                Name = supplier.Name,
                Description = supplier.Description,
                ContactPerson = supplier.ContactPerson,
                Phone = supplier.Phone,
                Email = supplier.Email,
                Address = supplier.Address,
                City = supplier.City,
                PostalCode = supplier.PostalCode,
                Country = supplier.Country,
                TaxId = supplier.TaxId,
                RegistrationNumber = supplier.RegistrationNumber,
                Notes = supplier.Notes,
                IsActive = supplier.IsActive,
                CreatedAt = supplier.CreatedAt,
                UpdatedAt = supplier.UpdatedAt,
                CreatedByUserName = supplier.CreatedByUserName,
                TotalAcquisitions = supplier.TotalAcquisitions,
                TotalAcquisitionValue = supplier.TotalAcquisitionValue,
                LastAcquisitionDate = supplier.LastAcquisitionDate
            };
        }

        public static Supplier? GetSupplierById(int id)
        {
            return _suppliers.FirstOrDefault(s => s.Id == id && s.IsActive);
        }
    }
}
