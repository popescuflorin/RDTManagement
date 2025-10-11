using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ProductionManagement.API.Models;
using ProductionManagement.API.Repositories;
using System.Security.Claims;

namespace ProductionManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class InventoryController : ControllerBase
    {
        private readonly IRawMaterialRepository _rawMaterialRepository;

        public InventoryController(IRawMaterialRepository rawMaterialRepository)
        {
            _rawMaterialRepository = rawMaterialRepository;
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
        [Authorize(Roles = "Admin,Manager")]
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
        [Authorize(Roles = "Admin,Manager")]
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
        [Authorize(Roles = "Admin,Manager")]
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
        [Authorize(Roles = "Admin")]
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

            return Ok(new
            {
                TotalMaterials = totalMaterials,
                LowStockCount = lowStockCount,
                TotalInventoryValue = totalValue,
                MostStockedMaterials = mostUsedMaterials
            });
        }

        // Static methods removed - use IRawMaterialRepository instead
    }
}
