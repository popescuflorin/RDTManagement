using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ProductionManagement.API.Authorization;
using ProductionManagement.API.Data;
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
        private readonly ApplicationDbContext _context;

        public SupplierController(ISupplierRepository supplierRepository, IUserRepository userRepository, ApplicationDbContext context)
        {
            _supplierRepository = supplierRepository;
            _userRepository = userRepository;
            _context = context;
        }

        [HttpGet]
        [RequirePermission(Permissions.ViewAcquisitionsTab)]
        public async Task<ActionResult<IEnumerable<SupplierDto>>> GetSuppliers()
        {
            var suppliers = await _supplierRepository.GetActiveSuppliersAsync();
            var supplierDtos = suppliers.Select(MapToDto).ToList();

            return Ok(supplierDtos);
        }

        [HttpGet("paged")]
        [RequirePermission(Permissions.ViewSupplier)]
        public async Task<ActionResult<PagedResult<SupplierDto>>> GetSuppliersPaged([FromQuery] SupplierPagedRequest request)
        {
            var query = _context.Suppliers
                .Include(s => s.Acquisitions)
                .AsQueryable();

            // Apply active/inactive filter
            if (request.IsActive.HasValue)
            {
                query = query.Where(s => s.IsActive == request.IsActive.Value);
            }

            // Apply search filter
            if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                var searchTerm = request.SearchTerm.ToLower();
                query = query.Where(s =>
                    s.Name.ToLower().Contains(searchTerm) ||
                    (s.Description != null && s.Description.ToLower().Contains(searchTerm)) ||
                    (s.ContactPerson != null && s.ContactPerson.ToLower().Contains(searchTerm)) ||
                    (s.Email != null && s.Email.ToLower().Contains(searchTerm)) ||
                    (s.Phone != null && s.Phone.ToLower().Contains(searchTerm)) ||
                    (s.City != null && s.City.ToLower().Contains(searchTerm)) ||
                    (s.Country != null && s.Country.ToLower().Contains(searchTerm)) ||
                    (s.TaxId != null && s.TaxId.ToLower().Contains(searchTerm)) ||
                    (s.RegistrationNumber != null && s.RegistrationNumber.ToLower().Contains(searchTerm))
                );
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Apply sorting
            query = request.SortBy.ToLower() switch
            {
                "name" => request.SortOrder.ToLower() == "asc"
                    ? query.OrderBy(s => s.Name)
                    : query.OrderByDescending(s => s.Name),
                "email" => request.SortOrder.ToLower() == "asc"
                    ? query.OrderBy(s => s.Email ?? "")
                    : query.OrderByDescending(s => s.Email ?? ""),
                "phone" => request.SortOrder.ToLower() == "asc"
                    ? query.OrderBy(s => s.Phone ?? "")
                    : query.OrderByDescending(s => s.Phone ?? ""),
                "city" => request.SortOrder.ToLower() == "asc"
                    ? query.OrderBy(s => s.City ?? "")
                    : query.OrderByDescending(s => s.City ?? ""),
                "country" => request.SortOrder.ToLower() == "asc"
                    ? query.OrderBy(s => s.Country ?? "")
                    : query.OrderByDescending(s => s.Country ?? ""),
                "isactive" => request.SortOrder.ToLower() == "asc"
                    ? query.OrderBy(s => s.IsActive)
                    : query.OrderByDescending(s => s.IsActive),
                "createdat" => request.SortOrder.ToLower() == "asc"
                    ? query.OrderBy(s => s.CreatedAt)
                    : query.OrderByDescending(s => s.CreatedAt),
                _ => request.SortOrder.ToLower() == "asc"
                    ? query.OrderBy(s => s.Name)
                    : query.OrderByDescending(s => s.Name)
            };

            // Apply pagination
            var skip = (request.Page - 1) * request.PageSize;
            var suppliers = await query
                .Skip(skip)
                .Take(request.PageSize)
                .ToListAsync();

            var result = new PagedResult<SupplierDto>
            {
                Items = suppliers.Select(MapToDto).ToList(),
                TotalCount = totalCount,
                Page = request.Page,
                PageSize = request.PageSize
            };

            return Ok(result);
        }

        [HttpGet("{id}")]
        [RequirePermission(Permissions.ViewSupplier)]
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
        [RequirePermission(Permissions.CreateSupplier)]
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
        [RequirePermission(Permissions.EditSupplier)]
        public async Task<ActionResult<SupplierDto>> UpdateSupplier(int id, [FromBody] UpdateSupplierRequest request)
        {
            var supplier = await _supplierRepository.GetByIdAsync(id);
            if (supplier == null)
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
        [RequirePermission(Permissions.DeleteSupplier)]
        public async Task<IActionResult> DeleteSupplier(int id)
        {
            var supplier = await _supplierRepository.GetByIdAsync(id);
            if (supplier == null)
            {
                return NotFound(new { message = "Supplier not found" });
            }

            // Soft delete - set as inactive
            supplier.IsActive = false;
            supplier.UpdatedAt = DateTime.UtcNow;
            await _supplierRepository.UpdateAsync(supplier);
            
            return NoContent();
        }

        [HttpGet("statistics")]
        [RequirePermission(Permissions.ViewSupplier)]
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
