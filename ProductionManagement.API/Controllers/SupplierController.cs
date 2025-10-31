using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ProductionManagement.API.Authorization;
using ProductionManagement.API.Models;
using ProductionManagement.API.Repositories;
using System.Security.Claims;

namespace ProductionManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SupplierController : ControllerBase
    {
        private readonly ISupplierRepository _supplierRepository;
        private readonly IUserRepository _userRepository;

        public SupplierController(ISupplierRepository supplierRepository, IUserRepository userRepository)
        {
            _supplierRepository = supplierRepository;
            _userRepository = userRepository;
        }

        [HttpGet]
        [RequirePermission(Permissions.ViewAcquisitionsTab)]
        public async Task<ActionResult<IEnumerable<SupplierDto>>> GetSuppliers()
        {
            var suppliers = await _supplierRepository.GetActiveSuppliersAsync();
            var supplierDtos = suppliers.Select(MapToDto).ToList();

            return Ok(supplierDtos);
        }

        [HttpGet("{id}")]
        [RequirePermission(Permissions.ViewAcquisitionsTab)]
        public async Task<ActionResult<SupplierDto>> GetSupplier(int id)
        {
            var supplier = await _supplierRepository.GetByIdWithDetailsAsync(id);
            if (supplier == null)
            {
                return NotFound(new { message = "Supplier not found" });
            }

            return Ok(MapToDto(supplier));
        }

        [HttpPost]
        [RequirePermission(Permissions.CreateAcquisition)]
        public async Task<ActionResult<SupplierDto>> CreateSupplier([FromBody] CreateSupplierRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return Unauthorized();
            }

            // Check if supplier with same name already exists
            var existingSupplier = await _supplierRepository.FirstOrDefaultAsync(s => s.Name.ToLower() == request.Name.ToLower());
            if (existingSupplier != null)
            {
                return BadRequest(new { message = "Supplier with this name already exists" });
            }

            var supplier = new Supplier
            {
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

            var createdSupplier = await _supplierRepository.AddAsync(supplier);

            return CreatedAtAction(nameof(GetSupplier), new { id = createdSupplier.Id }, MapToDto(createdSupplier));
        }

        [HttpPut("{id}")]
        [RequirePermission(Permissions.EditAcquisition)]
        public async Task<ActionResult<SupplierDto>> UpdateSupplier(int id, [FromBody] UpdateSupplierRequest request)
        {
            var supplier = await _supplierRepository.GetByIdAsync(id);
            if (supplier == null || !supplier.IsActive)
            {
                return NotFound(new { message = "Supplier not found" });
            }

            // Check if supplier with same name already exists (excluding current supplier)
            var nameExists = await _supplierRepository.FirstOrDefaultAsync(s => s.Name.ToLower() == request.Name.ToLower() && s.Id != id);
            if (nameExists != null)
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

            await _supplierRepository.UpdateAsync(supplier);

            return Ok(MapToDto(supplier));
        }

        [HttpDelete("{id}")]
        [RequirePermission(Permissions.CreateAcquisition)]
        public async Task<IActionResult> DeleteSupplier(int id)
        {
            var supplier = await _supplierRepository.GetByIdWithDetailsAsync(id);
            if (supplier == null)
            {
                return NotFound(new { message = "Supplier not found" });
            }

            // Check if supplier has any acquisitions
            if (supplier.Acquisitions.Any())
            {
                return BadRequest(new { message = "Cannot delete supplier with existing acquisitions" });
            }

            await _supplierRepository.DeleteAsync(supplier);
            return Ok(new { message = "Supplier deleted successfully" });
        }

        [HttpGet("statistics")]
        [RequirePermission(Permissions.ViewAcquisitionsTab)]
        public async Task<ActionResult<SupplierStatistics>> GetStatistics()
        {
            var allSuppliers = await _supplierRepository.GetAllAsync();
            var activeSuppliers = allSuppliers.Where(s => s.IsActive).ToList();
            
            var statistics = new SupplierStatistics
            {
                TotalSuppliers = allSuppliers.Count(),
                ActiveSuppliers = activeSuppliers.Count,
                InactiveSuppliers = allSuppliers.Count() - activeSuppliers.Count,
                TotalAcquisitionValue = activeSuppliers.Sum(s => s.TotalAcquisitionValue),
                TotalAcquisitions = activeSuppliers.Sum(s => s.TotalAcquisitions),
                TopSupplierByValue = activeSuppliers.OrderByDescending(s => s.TotalAcquisitionValue).FirstOrDefault(),
                TopSupplierByCount = activeSuppliers.OrderByDescending(s => s.TotalAcquisitions).FirstOrDefault()
            };

            return Ok(statistics);
        }

        private SupplierDto MapToDto(Supplier supplier)
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

        // Static method removed - use ISupplierRepository.GetByIdAsync instead
    }
}
