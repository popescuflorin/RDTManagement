using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
    public class ClientController : ControllerBase
    {
        private readonly IClientRepository _clientRepository;
        private readonly ApplicationDbContext _context;

        public ClientController(IClientRepository clientRepository, ApplicationDbContext context)
        {
            _clientRepository = clientRepository;
            _context = context;
        }

        [HttpGet]
        [RequirePermission(Permissions.ViewOrdersTab)]
        public async Task<ActionResult<List<ClientInfo>>> GetAllClients()
        {
            var clients = await _clientRepository.GetActiveClientsAsync();
            return Ok(clients.Select(MapToClientInfo).ToList());
        }

        [HttpGet("all")]
        [RequirePermission(Permissions.ViewClient)]
        public async Task<ActionResult<List<ClientInfo>>> GetAllClientsIncludingInactive()
        {
            var clients = await _clientRepository.GetAllAsync();
            return Ok(clients.Select(MapToClientInfo).ToList());
        }

        [HttpGet("paged")]
        [RequirePermission(Permissions.ViewClient)]
        public async Task<ActionResult<PagedResult<ClientInfo>>> GetClientsPaged([FromQuery] ClientPagedRequest request)
        {
            var query = _context.Clients
                .Include(c => c.Orders)
                    .ThenInclude(o => o.OrderMaterials)
                .AsQueryable();

            // Apply active/inactive filter
            if (request.IsActive.HasValue)
            {
                query = query.Where(c => c.IsActive == request.IsActive.Value);
            }

            // Apply search filter
            if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                var searchTerm = request.SearchTerm.ToLower();
                query = query.Where(c =>
                    c.Name.ToLower().Contains(searchTerm) ||
                    (c.ContactPerson != null && c.ContactPerson.ToLower().Contains(searchTerm)) ||
                    (c.Email != null && c.Email.ToLower().Contains(searchTerm)) ||
                    (c.Phone != null && c.Phone.ToLower().Contains(searchTerm)) ||
                    (c.City != null && c.City.ToLower().Contains(searchTerm)) ||
                    (c.Country != null && c.Country.ToLower().Contains(searchTerm))
                );
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Apply sorting
            query = request.SortBy.ToLower() switch
            {
                "name" => request.SortOrder.ToLower() == "asc"
                    ? query.OrderBy(c => c.Name)
                    : query.OrderByDescending(c => c.Name),
                "email" => request.SortOrder.ToLower() == "asc"
                    ? query.OrderBy(c => c.Email ?? "")
                    : query.OrderByDescending(c => c.Email ?? ""),
                "phone" => request.SortOrder.ToLower() == "asc"
                    ? query.OrderBy(c => c.Phone ?? "")
                    : query.OrderByDescending(c => c.Phone ?? ""),
                "city" => request.SortOrder.ToLower() == "asc"
                    ? query.OrderBy(c => c.City ?? "")
                    : query.OrderByDescending(c => c.City ?? ""),
                "country" => request.SortOrder.ToLower() == "asc"
                    ? query.OrderBy(c => c.Country ?? "")
                    : query.OrderByDescending(c => c.Country ?? ""),
                "isactive" => request.SortOrder.ToLower() == "asc"
                    ? query.OrderBy(c => c.IsActive)
                    : query.OrderByDescending(c => c.IsActive),
                "createdat" => request.SortOrder.ToLower() == "asc"
                    ? query.OrderBy(c => c.CreatedAt)
                    : query.OrderByDescending(c => c.CreatedAt),
                _ => request.SortOrder.ToLower() == "asc"
                    ? query.OrderBy(c => c.Name)
                    : query.OrderByDescending(c => c.Name)
            };

            // Apply pagination
            var skip = (request.Page - 1) * request.PageSize;
            var clients = await query
                .Skip(skip)
                .Take(request.PageSize)
                .ToListAsync();

            var result = new PagedResult<ClientInfo>
            {
                Items = clients.Select(MapToClientInfo).ToList(),
                TotalCount = totalCount,
                Page = request.Page,
                PageSize = request.PageSize
            };

            return Ok(result);
        }

        [HttpGet("{id}")]
        [RequirePermission(Permissions.ViewClient)]
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
        [RequirePermission(Permissions.CreateClient)]
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
        [RequirePermission(Permissions.EditClient)]
        public async Task<ActionResult<ClientInfo>> UpdateClient(int id, UpdateClientRequest request)
        {
            var client = await _clientRepository.GetByIdAsync(id);
            if (client == null)
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
        [RequirePermission(Permissions.DeleteClient)]
        public async Task<IActionResult> DeleteClient(int id)
        {
            var client = await _clientRepository.GetByIdAsync(id);
            if (client == null)
            {
                return NotFound();
            }

            // Soft delete - set as inactive
            client.IsActive = false;
            client.UpdatedAt = DateTime.UtcNow;
            await _clientRepository.UpdateAsync(client);
            
            return NoContent();
        }

        [HttpGet("statistics")]
        [RequirePermission(Permissions.ViewClient)]
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

