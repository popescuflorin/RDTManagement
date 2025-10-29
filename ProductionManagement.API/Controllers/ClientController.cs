using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProductionManagement.API.Models;
using ProductionManagement.API.Repositories;
using System.Security.Claims;

namespace ProductionManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ClientController : ControllerBase
    {
        private readonly IClientRepository _clientRepository;

        public ClientController(IClientRepository clientRepository)
        {
            _clientRepository = clientRepository;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Manager,User")]
        public async Task<ActionResult<List<ClientInfo>>> GetAllClients()
        {
            var clients = await _clientRepository.GetActiveClientsAsync();
            return Ok(clients.Select(MapToClientInfo).ToList());
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Manager,User")]
        public async Task<ActionResult<ClientInfo>> GetClient(int id)
        {
            var client = await _clientRepository.GetByIdWithOrdersAsync(id);
            if (client == null || !client.IsActive)
            {
                return NotFound();
            }

            return Ok(MapToClientInfo(client));
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<ClientInfo>> CreateClient(CreateClientRequest request)
        {
            var userName = User.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown";
            
            var client = new Client
            {
                Name = request.Name.Trim(),
                ContactPerson = string.IsNullOrWhiteSpace(request.ContactPerson) ? null : request.ContactPerson.Trim(),
                Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim(),
                Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim(),
                Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim(),
                City = string.IsNullOrWhiteSpace(request.City) ? null : request.City.Trim(),
                PostalCode = string.IsNullOrWhiteSpace(request.PostalCode) ? null : request.PostalCode.Trim(),
                Country = string.IsNullOrWhiteSpace(request.Country) ? null : request.Country.Trim(),
                Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserName = userName
            };

            var createdClient = await _clientRepository.AddAsync(client);
            var clientWithOrders = await _clientRepository.GetByIdWithOrdersAsync(createdClient.Id);

            return CreatedAtAction(nameof(GetClient), new { id = createdClient.Id }, MapToClientInfo(clientWithOrders!));
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<ClientInfo>> UpdateClient(int id, UpdateClientRequest request)
        {
            var client = await _clientRepository.GetByIdAsync(id);
            if (client == null || !client.IsActive)
            {
                return NotFound();
            }

            if (!string.IsNullOrWhiteSpace(request.Name))
            {
                client.Name = request.Name.Trim();
            }

            client.ContactPerson = string.IsNullOrWhiteSpace(request.ContactPerson) ? null : request.ContactPerson?.Trim();
            client.Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email?.Trim();
            client.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone?.Trim();
            client.Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address?.Trim();
            client.City = string.IsNullOrWhiteSpace(request.City) ? null : request.City?.Trim();
            client.PostalCode = string.IsNullOrWhiteSpace(request.PostalCode) ? null : request.PostalCode?.Trim();
            client.Country = string.IsNullOrWhiteSpace(request.Country) ? null : request.Country?.Trim();
            client.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes?.Trim();

            if (request.IsActive.HasValue)
            {
                client.IsActive = request.IsActive.Value;
            }

            client.UpdatedAt = DateTime.UtcNow;

            await _clientRepository.UpdateAsync(client);
            var updatedClient = await _clientRepository.GetByIdWithOrdersAsync(id);

            return Ok(MapToClientInfo(updatedClient!));
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteClient(int id)
        {
            var client = await _clientRepository.GetByIdWithOrdersAsync(id);
            if (client == null)
            {
                return NotFound();
            }

            if (client.Orders.Any())
            {
                return BadRequest(new { message = "Cannot delete client with existing orders. Mark as inactive instead." });
            }

            await _clientRepository.DeleteAsync(client);
            return NoContent();
        }

        [HttpGet("statistics")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<ClientStatistics>> GetStatistics()
        {
            var allClients = await _clientRepository.GetAllAsync();
            var activeClients = allClients.Where(c => c.IsActive).ToList();
            var inactiveClients = allClients.Where(c => !c.IsActive).ToList();

            var allOrders = activeClients.SelectMany(c => c.Orders).ToList();
            var totalOrderValue = allOrders.Sum(o => o.OrderMaterials.Sum(om => om.Quantity * om.UnitPrice));

            var topClientByValue = activeClients
                .Select(c => new
                {
                    Client = c,
                    TotalValue = c.Orders.Sum(o => o.OrderMaterials.Sum(om => om.Quantity * om.UnitPrice))
                })
                .OrderByDescending(x => x.TotalValue)
                .FirstOrDefault();

            var topClientByCount = activeClients
                .OrderByDescending(c => c.Orders.Count)
                .FirstOrDefault();

            var statistics = new ClientStatistics
            {
                TotalClients = allClients.Count(),
                ActiveClients = activeClients.Count,
                InactiveClients = inactiveClients.Count,
                TotalOrderValue = totalOrderValue,
                TotalOrders = allOrders.Count,
                TopClientByValue = topClientByValue != null ? MapToClientInfo(topClientByValue.Client) : null,
                TopClientByCount = topClientByCount != null ? MapToClientInfo(topClientByCount) : null
            };

            return Ok(statistics);
        }

        private ClientInfo MapToClientInfo(Client client)
        {
            var orders = client.Orders?.ToList() ?? new List<Order>();
            var totalOrderValue = orders.Sum(o => o.OrderMaterials?.Sum(om => om.Quantity * om.UnitPrice) ?? 0);
            var lastOrderDate = orders.OrderByDescending(o => o.OrderDate).FirstOrDefault()?.OrderDate;

            return new ClientInfo
            {
                Id = client.Id,
                Name = client.Name,
                ContactPerson = client.ContactPerson,
                Email = client.Email,
                Phone = client.Phone,
                Address = client.Address,
                City = client.City,
                PostalCode = client.PostalCode,
                Country = client.Country,
                Notes = client.Notes,
                IsActive = client.IsActive,
                CreatedAt = client.CreatedAt,
                UpdatedAt = client.UpdatedAt,
                CreatedByUserName = client.CreatedByUserName,
                TotalOrders = orders.Count,
                TotalOrderValue = totalOrderValue,
                LastOrderDate = lastOrderDate
            };
        }
    }
}

