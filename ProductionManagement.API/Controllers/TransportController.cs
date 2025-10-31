using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProductionManagement.API.Authorization;
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

        public TransportController(ITransportRepository transportRepository)
        {
            _transportRepository = transportRepository;
        }

        [HttpGet]
        public async Task<ActionResult<List<TransportDto>>> GetAllTransports()
        {
            var transports = await _transportRepository.GetAllActiveAsync();
            return Ok(transports.Select(MapToDto).ToList());
        }

        [HttpGet("search")]
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
        [RequirePermission(Permissions.CreateAcquisition)]
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
                PhoneNumber = request.PhoneNumber,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            var createdTransport = await _transportRepository.AddAsync(transport);

            return CreatedAtAction(nameof(GetTransport), new { id = createdTransport.Id }, MapToDto(createdTransport));
        }

        [HttpPut("{id}")]
        [RequirePermission(Permissions.EditAcquisition)]
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
            transport.PhoneNumber = request.PhoneNumber;
            transport.UpdatedAt = DateTime.UtcNow;

            await _transportRepository.UpdateAsync(transport);

            return Ok(MapToDto(transport));
        }

        [HttpDelete("{id}")]
        [RequirePermission(Permissions.CreateAcquisition)]
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

        private TransportDto MapToDto(Transport transport)
        {
            return new TransportDto
            {
                Id = transport.Id,
                CarName = transport.CarName,
                PhoneNumber = transport.PhoneNumber,
                CreatedAt = transport.CreatedAt,
                UpdatedAt = transport.UpdatedAt
            };
        }
    }
}

