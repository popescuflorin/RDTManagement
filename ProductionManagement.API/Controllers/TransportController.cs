using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductionManagement.API.Authorization;
using ProductionManagement.API.Data;
using ProductionManagement.API.Models;
using ProductionManagement.API.Repositories;

namespace ProductionManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TransportController : ControllerBase
    {
        private readonly ITransportRepository _transportRepository;
        private readonly ApplicationDbContext _context;

        public TransportController(ITransportRepository transportRepository, ApplicationDbContext context)
        {
            _transportRepository = transportRepository;
            _context = context;
        }

        [HttpGet]
        [RequirePermission(Permissions.ViewTransport)]
        public async Task<ActionResult<List<TransportDto>>> GetAllTransports()
        {
            var transports = await _transportRepository.GetAllActiveAsync();
            return Ok(transports.Select(MapToDto).ToList());
        }

        [HttpGet("search")]
        [RequirePermission(Permissions.ViewTransport)]
        public async Task<ActionResult<List<TransportDto>>> SearchTransports([FromQuery] string searchTerm)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
            {
                var allTransports = await _transportRepository.GetAllActiveAsync();
                return Ok(allTransports.Select(MapToDto).ToList());
            }

            var transports = await _transportRepository.SearchByCarNameAsync(searchTerm);
            return Ok(transports.Select(MapToDto).ToList());
        }

        [HttpGet("{id}")]
        [RequirePermission(Permissions.ViewTransport)]
        public async Task<ActionResult<TransportDto>> GetTransport(int id)
        {
            var transport = await _transportRepository.GetByIdAsync(id);
            if (transport == null || !transport.IsActive)
            {
                return NotFound();
            }

            return Ok(MapToDto(transport));
        }

        [HttpGet("by-car-name/{carName}")]
        public async Task<ActionResult<TransportDto>> GetTransportByCarName(string carName)
        {
            var transport = await _transportRepository.GetByCarNameAsync(carName);
            if (transport == null)
            {
                return NotFound();
            }

            return Ok(MapToDto(transport));
        }

        [HttpPost]
        [RequirePermission(Permissions.CreateTransport)]
        public async Task<ActionResult<TransportDto>> CreateTransport(CreateTransportRequest request)
        {
            // Check if a transport with the same car name already exists
            var existingTransport = await _transportRepository.GetByCarNameAsync(request.CarName);
            if (existingTransport != null)
            {
                return Conflict(new { message = "A transport with this car name already exists." });
            }

            var transport = new Transport
            {
                CarName = request.CarName,
                NumberPlate = request.NumberPlate,
                PhoneNumber = request.PhoneNumber,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            var createdTransport = await _transportRepository.AddAsync(transport);

            return CreatedAtAction(nameof(GetTransport), new { id = createdTransport.Id }, MapToDto(createdTransport));
        }

        [HttpPut("{id}")]
        [RequirePermission(Permissions.EditTransport)]
        public async Task<ActionResult<TransportDto>> UpdateTransport(int id, UpdateTransportRequest request)
        {
            var transport = await _transportRepository.GetByIdAsync(id);
            if (transport == null || !transport.IsActive)
            {
                return NotFound();
            }

            // Check if another transport with the same car name exists
            var existingTransport = await _transportRepository.GetByCarNameAsync(request.CarName);
            if (existingTransport != null && existingTransport.Id != id)
            {
                return Conflict(new { message = "A transport with this car name already exists." });
            }

            transport.CarName = request.CarName;
            transport.NumberPlate = request.NumberPlate;
            transport.PhoneNumber = request.PhoneNumber;
            transport.UpdatedAt = DateTime.UtcNow;

            await _transportRepository.UpdateAsync(transport);

            return Ok(MapToDto(transport));
        }

        [HttpDelete("{id}")]
        [RequirePermission(Permissions.DeleteTransport)]
        public async Task<ActionResult> DeleteTransport(int id)
        {
            var transport = await _transportRepository.GetByIdAsync(id);
            if (transport == null || !transport.IsActive)
            {
                return NotFound();
            }

            transport.IsActive = false;
            transport.UpdatedAt = DateTime.UtcNow;
            await _transportRepository.UpdateAsync(transport);

            return NoContent();
        }

        [HttpGet("paged")]
        [RequirePermission(Permissions.ViewTransport)]
        public async Task<ActionResult<PagedResult<TransportDto>>> GetTransportsPaged([FromQuery] TransportPagedRequest request)
        {
            var query = _context.Transports
                .Where(t => t.IsActive)
                .AsQueryable();

            // Apply search filter
            if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                var searchTerm = request.SearchTerm.ToLower();
                query = query.Where(t =>
                    t.CarName.ToLower().Contains(searchTerm) ||
                    (t.NumberPlate != null && t.NumberPlate.ToLower().Contains(searchTerm)) ||
                    t.PhoneNumber.ToLower().Contains(searchTerm)
                );
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Apply sorting
            query = request.SortBy.ToLower() switch
            {
                "carname" => request.SortOrder.ToLower() == "asc"
                    ? query.OrderBy(t => t.CarName)
                    : query.OrderByDescending(t => t.CarName),
                "numberplate" => request.SortOrder.ToLower() == "asc"
                    ? query.OrderBy(t => t.NumberPlate ?? "")
                    : query.OrderByDescending(t => t.NumberPlate ?? ""),
                "phonenumber" => request.SortOrder.ToLower() == "asc"
                    ? query.OrderBy(t => t.PhoneNumber)
                    : query.OrderByDescending(t => t.PhoneNumber),
                "updatedat" => request.SortOrder.ToLower() == "asc"
                    ? query.OrderBy(t => t.UpdatedAt ?? t.CreatedAt)
                    : query.OrderByDescending(t => t.UpdatedAt ?? t.CreatedAt),
                _ => request.SortOrder.ToLower() == "asc"
                    ? query.OrderBy(t => t.CreatedAt)
                    : query.OrderByDescending(t => t.CreatedAt)
            };

            // Apply pagination
            var skip = (request.Page - 1) * request.PageSize;
            var transports = await query
                .Skip(skip)
                .Take(request.PageSize)
                .ToListAsync();

            var result = new PagedResult<TransportDto>
            {
                Items = transports.Select(MapToDto).ToList(),
                TotalCount = totalCount,
                Page = request.Page,
                PageSize = request.PageSize
            };

            return Ok(result);
        }

        [HttpGet("records/paged")]
        [RequirePermission(Permissions.ViewTransport)]
        public async Task<ActionResult<PagedResult<TransportRecordDto>>> GetTransportRecordsPaged([FromQuery] TransportRecordsPagedRequest request)
        {
            var records = new List<TransportRecordDto>();

            // Get acquisitions with transport
            var acquisitionQuery = _context.Acquisitions
                .Include(a => a.Transport)
                .Where(a => a.IsActive && a.Transport != null)
                .AsQueryable();

            // Apply search filter for acquisitions
            if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                var searchTerm = request.SearchTerm.ToLower();
                acquisitionQuery = acquisitionQuery.Where(a =>
                    a.Title.ToLower().Contains(searchTerm) ||
                    (a.Transport != null && a.Transport.CarName.ToLower().Contains(searchTerm)) ||
                    (a.Transport != null && a.Transport.NumberPlate != null && a.Transport.NumberPlate.ToLower().Contains(searchTerm)) ||
                    (a.Transport != null && a.Transport.PhoneNumber.ToLower().Contains(searchTerm))
                );
            }

            // Apply type filter
            if (!string.IsNullOrWhiteSpace(request.Type) && request.Type.ToLower() != "acquisition")
            {
                acquisitionQuery = acquisitionQuery.Where(a => false); // Exclude if not acquisition type
            }

            var acquisitions = await acquisitionQuery.ToListAsync();
            foreach (var acq in acquisitions)
            {
                records.Add(new TransportRecordDto
                {
                    Id = acq.Id,
                    Type = "Acquisition",
                    CarName = acq.Transport?.CarName ?? "",
                    NumberPlate = acq.Transport?.NumberPlate,
                    PhoneNumber = acq.Transport?.PhoneNumber,
                    TransportDate = acq.TransportDate,
                    RelatedEntityName = acq.Title,
                    RelatedEntityId = acq.Id,
                    Status = acq.Status.ToString(),
                    CreatedAt = acq.CreatedAt
                });
            }

            // Get orders with transport
            var orderQuery = _context.Orders
                .Include(o => o.Transport)
                .Include(o => o.Client)
                .Where(o => o.Transport != null)
                .AsQueryable();

            // Apply search filter for orders
            if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                var searchTerm = request.SearchTerm.ToLower();
                orderQuery = orderQuery.Where(o =>
                    (o.Client != null && o.Client.Name.ToLower().Contains(searchTerm)) ||
                    (o.Transport != null && o.Transport.CarName.ToLower().Contains(searchTerm)) ||
                    (o.Transport != null && o.Transport.NumberPlate != null && o.Transport.NumberPlate.ToLower().Contains(searchTerm)) ||
                    (o.Transport != null && o.Transport.PhoneNumber.ToLower().Contains(searchTerm))
                );
            }

            // Apply type filter
            if (!string.IsNullOrWhiteSpace(request.Type) && request.Type.ToLower() != "order")
            {
                orderQuery = orderQuery.Where(o => false); // Exclude if not order type
            }

            var orders = await orderQuery.ToListAsync();
            foreach (var order in orders)
            {
                records.Add(new TransportRecordDto
                {
                    Id = order.Id,
                    Type = "Order",
                    CarName = order.Transport?.CarName ?? "",
                    NumberPlate = order.Transport?.NumberPlate,
                    PhoneNumber = order.Transport?.PhoneNumber,
                    TransportDate = order.TransportDate,
                    RelatedEntityName = order.Client?.Name ?? "",
                    RelatedEntityId = order.Id,
                    Status = order.Status.ToString(),
                    CreatedAt = order.CreatedAt
                });
            }

            // Apply sorting
            var sortedRecords = request.SortBy.ToLower() switch
            {
                "type" => request.SortOrder.ToLower() == "asc"
                    ? records.OrderBy(r => r.Type).ToList()
                    : records.OrderByDescending(r => r.Type).ToList(),
                "relatedentityname" => request.SortOrder.ToLower() == "asc"
                    ? records.OrderBy(r => r.RelatedEntityName).ToList()
                    : records.OrderByDescending(r => r.RelatedEntityName).ToList(),
                "carname" => request.SortOrder.ToLower() == "asc"
                    ? records.OrderBy(r => r.CarName).ToList()
                    : records.OrderByDescending(r => r.CarName).ToList(),
                "status" => request.SortOrder.ToLower() == "asc"
                    ? records.OrderBy(r => r.Status).ToList()
                    : records.OrderByDescending(r => r.Status).ToList(),
                "createdat" => request.SortOrder.ToLower() == "asc"
                    ? records.OrderBy(r => r.CreatedAt).ToList()
                    : records.OrderByDescending(r => r.CreatedAt).ToList(),
                _ => request.SortOrder.ToLower() == "asc"
                    ? records.OrderBy(r => r.TransportDate ?? r.CreatedAt).ToList()
                    : records.OrderByDescending(r => r.TransportDate ?? r.CreatedAt).ToList()
            };

            // Get total count
            var totalCount = sortedRecords.Count;

            // Apply pagination
            var skip = (request.Page - 1) * request.PageSize;
            var pagedRecords = sortedRecords.Skip(skip).Take(request.PageSize).ToList();

            var result = new PagedResult<TransportRecordDto>
            {
                Items = pagedRecords,
                TotalCount = totalCount,
                Page = request.Page,
                PageSize = request.PageSize
            };

            return Ok(result);
        }

        private TransportDto MapToDto(Transport transport)
        {
            return new TransportDto
            {
                Id = transport.Id,
                CarName = transport.CarName,
                NumberPlate = transport.NumberPlate,
                PhoneNumber = transport.PhoneNumber,
                CreatedAt = transport.CreatedAt,
                UpdatedAt = transport.UpdatedAt
            };
        }
    }
}

