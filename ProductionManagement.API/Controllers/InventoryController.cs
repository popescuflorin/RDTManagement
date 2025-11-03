using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ProductionManagement.API.Authorization;
using ProductionManagement.API.Models;
using ProductionManagement.API.Repositories;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using ProductionManagement.API.Data;

namespace ProductionManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class InventoryController : ControllerBase
    {
        private readonly IRawMaterialRepository _rawMaterialRepository;
        private readonly ApplicationDbContext _context;

        public InventoryController(
            IRawMaterialRepository rawMaterialRepository,
            ApplicationDbContext context)
        {
            _rawMaterialRepository = rawMaterialRepository;
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<RawMaterialInfo>>> GetAllMaterials()
        {
            var materials = await _rawMaterialRepository.GetActiveRawMaterialsAsync();
            var materialInfos = materials.Select(m => new RawMaterialInfo
            {
                Id = m.Id,
                Name = m.Name,
                Color = m.Color,
                Quantity = m.Quantity,
                QuantityType = m.QuantityType,
                CreatedAt = m.CreatedAt,
                UpdatedAt = m.UpdatedAt,
                MinimumStock = m.MinimumStock,
                UnitCost = m.UnitCost,
                Description = m.Description,
                IsActive = m.IsActive,
                Type = m.Type
            }).OrderBy(m => m.Name).ThenBy(m => m.Color).ToList();

            return Ok(materialInfos);
        }

        [HttpGet("all-including-inactive")]
        public async Task<ActionResult<IEnumerable<RawMaterialInfo>>> GetAllMaterialsIncludingInactive()
        {
            var materials = await _rawMaterialRepository.GetAllRawMaterialsIncludingInactiveAsync();
            
            // Calculate requested quantities from production plans and orders
            var requestedQuantities = await CalculateRequestedQuantitiesAsync();
            
            var materialInfos = materials.Select(m => new RawMaterialInfo
            {
                Id = m.Id,
                Name = m.Name,
                Color = m.Color,
                Quantity = m.Quantity,
                QuantityType = m.QuantityType,
                CreatedAt = m.CreatedAt,
                UpdatedAt = m.UpdatedAt,
                MinimumStock = m.MinimumStock,
                UnitCost = m.UnitCost,
                Description = m.Description,
                IsActive = m.IsActive,
                Type = m.Type,
                RequestedQuantity = requestedQuantities.ContainsKey(m.Id) ? requestedQuantities[m.Id] : 0
            }).OrderBy(m => m.Name).ThenBy(m => m.Color).ToList();

            return Ok(materialInfos);
        }

        [HttpGet("paged")]
        [RequirePermission(Permissions.ViewInventoryTab)]
        public async Task<ActionResult<PagedResult<RawMaterialInfo>>> GetMaterialsPaged([FromQuery] RawMaterialPagedRequest request)
        {
            // Start with base query
            var query = _context.RawMaterials.AsQueryable();

            // Apply search filter
            if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                var searchTerm = request.SearchTerm.ToLower();
                query = query.Where(m =>
                    m.Name.ToLower().Contains(searchTerm) ||
                    m.Color.ToLower().Contains(searchTerm) ||
                    m.QuantityType.ToLower().Contains(searchTerm) ||
                    (m.Description != null && m.Description.ToLower().Contains(searchTerm))
                );
            }

            // Apply material type filter
            if (request.Type.HasValue)
            {
                query = query.Where(m => m.Type == request.Type.Value);
            }

            // Apply active/inactive filter
            if (request.IsActive.HasValue)
            {
                query = query.Where(m => m.IsActive == request.IsActive.Value);
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Apply sorting
            query = request.SortBy.ToLower() switch
            {
                "quantity" => request.SortOrder.ToLower() == "asc"
                    ? query.OrderBy(m => m.Quantity)
                    : query.OrderByDescending(m => m.Quantity),
                "updated" => request.SortOrder.ToLower() == "asc"
                    ? query.OrderBy(m => m.UpdatedAt)
                    : query.OrderByDescending(m => m.UpdatedAt),
                "name" or _ => request.SortOrder.ToLower() == "asc"
                    ? query.OrderBy(m => m.Name).ThenBy(m => m.Color)
                    : query.OrderByDescending(m => m.Name).ThenByDescending(m => m.Color)
            };

            // Apply pagination
            var materials = await query
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            // Calculate requested quantities for all materials in this page
            var requestedQuantities = await CalculateRequestedQuantitiesAsync();

            var materialInfos = materials.Select(m => new RawMaterialInfo
            {
                Id = m.Id,
                Name = m.Name,
                Color = m.Color,
                Quantity = m.Quantity,
                QuantityType = m.QuantityType,
                CreatedAt = m.CreatedAt,
                UpdatedAt = m.UpdatedAt,
                MinimumStock = m.MinimumStock,
                UnitCost = m.UnitCost,
                Description = m.Description,
                IsActive = m.IsActive,
                Type = m.Type,
                RequestedQuantity = requestedQuantities.ContainsKey(m.Id) ? requestedQuantities[m.Id] : 0
            }).ToList();

            var pagedResult = new PagedResult<RawMaterialInfo>
            {
                Items = materialInfos,
                TotalCount = totalCount,
                Page = request.Page,
                PageSize = request.PageSize
            };

            return Ok(pagedResult);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<RawMaterialInfo>> GetMaterial(int id)
        {
            var material = await _rawMaterialRepository.GetByIdAsync(id);
            if (material == null)
            {
                return NotFound(new { message = "Material not found" });
            }

            var materialInfo = new RawMaterialInfo
            {
                Id = material.Id,
                Name = material.Name,
                Color = material.Color,
                Quantity = material.Quantity,
                QuantityType = material.QuantityType,
                CreatedAt = material.CreatedAt,
                UpdatedAt = material.UpdatedAt,
                MinimumStock = material.MinimumStock,
                UnitCost = material.UnitCost,
                Description = material.Description,
                IsActive = material.IsActive
            };

            return Ok(materialInfo);
        }

        [HttpGet("types")]
        public async Task<ActionResult<IEnumerable<MaterialTypeInfo>>> GetMaterialTypes()
        {
            var materials = await _rawMaterialRepository.GetActiveRawMaterialsAsync();
            var materialTypes = materials
                .GroupBy(m => new { m.Name, m.Color, m.QuantityType })
                .Select(g => new MaterialTypeInfo
                {
                    Name = g.Key.Name,
                    Color = g.Key.Color,
                    QuantityType = g.Key.QuantityType,
                    Description = g.First().Description
                })
                .OrderBy(mt => mt.Name)
                .ThenBy(mt => mt.Color)
                .ToList();

            return Ok(materialTypes);
        }

        [HttpGet("low-stock")]
        public async Task<ActionResult<IEnumerable<RawMaterialInfo>>> GetLowStockMaterials()
        {
            var lowStockMaterials = await _rawMaterialRepository.GetLowStockMaterialsAsync();
            var materialInfos = lowStockMaterials
                .Select(m => new RawMaterialInfo
                {
                    Id = m.Id,
                    Name = m.Name,
                    Color = m.Color,
                    Quantity = m.Quantity,
                    QuantityType = m.QuantityType,
                    CreatedAt = m.CreatedAt,
                    UpdatedAt = m.UpdatedAt,
                    MinimumStock = m.MinimumStock,
                    UnitCost = m.UnitCost,
                    Description = m.Description,
                    IsActive = m.IsActive
                })
                .OrderBy(m => m.Quantity / m.MinimumStock)
                .ToList();

            return Ok(lowStockMaterials);
        }

        [HttpPost]
        [RequirePermission(Permissions.AddMaterial)]
        public async Task<ActionResult<RawMaterialInfo>> CreateMaterial([FromBody] CreateRawMaterialRequest request)
        {
            // Check if material with same name, color, and quantity type already exists
            var existingMaterial = await _rawMaterialRepository.FirstOrDefaultAsync(m => 
                m.Name.ToLower() == request.Name.ToLower() &&
                m.Color.ToLower() == request.Color.ToLower() &&
                m.QuantityType.ToLower() == request.QuantityType.ToLower());

            if (existingMaterial != null)
            {
                return BadRequest(new { message = "Material with the same name, color, and quantity type already exists" });
            }

            var newMaterial = new RawMaterial
            {
                Name = request.Name,
                Color = request.Color,
                Type = request.Type,
                Quantity = request.Quantity,
                QuantityType = request.QuantityType,
                MinimumStock = request.MinimumStock,
                UnitCost = request.UnitCost,
                Description = request.Description,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true
            };

            var createdMaterial = await _rawMaterialRepository.AddAsync(newMaterial);

            var materialInfo = new RawMaterialInfo
            {
                Id = createdMaterial.Id,
                Name = createdMaterial.Name,
                Color = newMaterial.Color,
                Type = newMaterial.Type,
                Quantity = newMaterial.Quantity,
                QuantityType = newMaterial.QuantityType,
                CreatedAt = newMaterial.CreatedAt,
                UpdatedAt = newMaterial.UpdatedAt,
                MinimumStock = newMaterial.MinimumStock,
                UnitCost = newMaterial.UnitCost,
                Description = newMaterial.Description,
                IsActive = newMaterial.IsActive
            };

            return CreatedAtAction(nameof(GetMaterial), new { id = newMaterial.Id }, materialInfo);
        }

        [HttpPost("add-to-existing")]
        [RequirePermission(Permissions.AddMaterial)]
        public async Task<ActionResult<RawMaterialInfo>> AddToExistingMaterial([FromBody] AddToExistingMaterialRequest request)
        {
            var material = await _rawMaterialRepository.GetByIdAsync(request.MaterialId);
            if (material == null)
            {
                return NotFound(new { message = "Material not found" });
            }

            // Add to existing quantity
            material.Quantity += request.QuantityToAdd;
            
            // Update unit cost if provided (weighted average)
            if (request.NewUnitCost.HasValue && request.NewUnitCost.Value > 0)
            {
                var oldValue = (material.Quantity - request.QuantityToAdd) * material.UnitCost;
                var newValue = request.QuantityToAdd * request.NewUnitCost.Value;
                material.UnitCost = (oldValue + newValue) / material.Quantity;
            }

            material.UpdatedAt = DateTime.UtcNow;

            await _rawMaterialRepository.UpdateAsync(material);

            var materialInfo = new RawMaterialInfo
            {
                Id = material.Id,
                Name = material.Name,
                Color = material.Color,
                Quantity = material.Quantity,
                QuantityType = material.QuantityType,
                CreatedAt = material.CreatedAt,
                UpdatedAt = material.UpdatedAt,
                MinimumStock = material.MinimumStock,
                UnitCost = material.UnitCost,
                Description = material.Description,
                IsActive = material.IsActive
            };

            return Ok(materialInfo);
        }

        [HttpPut("{id}")]
        [RequirePermission(Permissions.EditMaterial)]
        public async Task<ActionResult<RawMaterialInfo>> UpdateMaterial(int id, [FromBody] UpdateRawMaterialRequest request)
        {
            var material = await _rawMaterialRepository.GetByIdAsync(id);
            if (material == null)
            {
                return NotFound(new { message = "Material not found" });
            }

            // Check if another material with same name, color, and quantity type already exists
            var existingMaterial = await _rawMaterialRepository.FirstOrDefaultAsync(m => 
                m.Id != id &&
                m.Name.ToLower() == request.Name.ToLower() &&
                m.Color.ToLower() == request.Color.ToLower() &&
                m.QuantityType.ToLower() == request.QuantityType.ToLower());

            if (existingMaterial != null)
            {
                return BadRequest(new { message = "Another material with the same name, color, and quantity type already exists" });
            }

            // Update material
            material.Name = request.Name;
            material.Color = request.Color;
            material.Type = request.Type;
            material.Quantity = request.Quantity;
            material.QuantityType = request.QuantityType;
            material.MinimumStock = request.MinimumStock;
            material.UnitCost = request.UnitCost;
            material.Description = request.Description;
            material.IsActive = request.IsActive;
            material.UpdatedAt = DateTime.UtcNow;

            await _rawMaterialRepository.UpdateAsync(material);

            var materialInfo = new RawMaterialInfo
            {
                Id = material.Id,
                Name = material.Name,
                Color = material.Color,
                Quantity = material.Quantity,
                QuantityType = material.QuantityType,
                CreatedAt = material.CreatedAt,
                UpdatedAt = material.UpdatedAt,
                MinimumStock = material.MinimumStock,
                UnitCost = material.UnitCost,
                Description = material.Description,
                IsActive = material.IsActive
            };

            return Ok(materialInfo);
        }

        [HttpDelete("{id}")]
        [RequirePermission(Permissions.DeactivateMaterial)]
        public async Task<IActionResult> DeleteMaterial(int id)
        {
            var material = await _rawMaterialRepository.GetByIdAsync(id);
            if (material == null)
            {
                return NotFound(new { message = "Material not found" });
            }

            await _rawMaterialRepository.DeleteAsync(material);
            return Ok(new { message = "Material deleted successfully" });
        }

        [HttpGet("statistics")]
        public async Task<ActionResult<object>> GetInventoryStatistics()
        {
            var materials = await _rawMaterialRepository.GetActiveRawMaterialsAsync();
            var totalMaterials = materials.Count();
            var lowStockMaterials = await _rawMaterialRepository.GetLowStockMaterialsAsync();
            var lowStockCount = lowStockMaterials.Count();
            var totalValue = await _rawMaterialRepository.GetTotalInventoryValueAsync();
            var mostUsedMaterials = materials
                .OrderByDescending(m => m.Quantity)
                .Take(5)
                .Select(m => new { m.Name, m.Color, m.Quantity, m.QuantityType })
                .ToList();

            // Calculate materials with insufficient stock (requested > available)
            var requestedQuantities = await CalculateRequestedQuantitiesAsync();
            var insufficientStockCount = 0;
            
            foreach (var material in materials)
            {
                var requestedQty = requestedQuantities.ContainsKey(material.Id) ? requestedQuantities[material.Id] : 0;
                var availableQty = material.Quantity - requestedQty;
                
                // Material has insufficient stock if available quantity is negative or if requested exceeds current stock
                if (availableQty < 0 || material.Quantity < requestedQty)
                {
                    insufficientStockCount++;
                }
            }

            return Ok(new
            {
                TotalMaterials = totalMaterials,
                LowStockCount = lowStockCount,
                InsufficientStockCount = insufficientStockCount,
                TotalInventoryValue = totalValue,
                MostStockedMaterials = mostUsedMaterials
            });
        }

        // Static methods removed - use IRawMaterialRepository instead

        /// <summary>
        /// Calculates the total requested quantity for each material from:
        /// - Production Plans (Draft, InProgress statuses)
        /// - Orders (Draft status)
        /// </summary>
        private async Task<Dictionary<int, decimal>> CalculateRequestedQuantitiesAsync()
        {
            var requestedQuantities = new Dictionary<int, decimal>();

            // Get materials requested from production plans (Draft + InProgress)
            // Multiply RequiredQuantity by QuantityToProduce to get total requirement
            var productionPlanMaterials = await _context.ProductionPlanMaterials
                .Include(ppm => ppm.ProductionPlan)
                .Where(ppm => ppm.ProductionPlan!.Status == ProductionPlanStatus.Draft || 
                              ppm.ProductionPlan!.Status == ProductionPlanStatus.InProgress)
                .GroupBy(ppm => ppm.RawMaterialId)
                .Select(g => new { 
                    MaterialId = g.Key, 
                    TotalQuantity = g.Sum(x => x.RequiredQuantity * x.ProductionPlan!.QuantityToProduce) 
                })
                .ToListAsync();

            foreach (var item in productionPlanMaterials)
            {
                requestedQuantities[item.MaterialId] = item.TotalQuantity;
            }

            // Get materials requested from orders (Draft status)
            var orderMaterials = await _context.OrderMaterials
                .Include(om => om.Order)
                .Where(om => om.Order!.Status == OrderStatus.Draft)
                .GroupBy(om => om.RawMaterialId)
                .Select(g => new { MaterialId = g.Key, TotalQuantity = g.Sum(x => x.Quantity) })
                .ToListAsync();

            foreach (var item in orderMaterials)
            {
                if (requestedQuantities.ContainsKey(item.MaterialId))
                {
                    requestedQuantities[item.MaterialId] += item.TotalQuantity;
                }
                else
                {
                    requestedQuantities[item.MaterialId] = item.TotalQuantity;
                }
            }

            return requestedQuantities;
        }
    }
}
