using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ProductionManagement.API.Models;
using System.Security.Claims;

namespace ProductionManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class InventoryController : ControllerBase
    {
        // In-memory storage for demo purposes
        private static List<RawMaterial> _materials = new List<RawMaterial>
        {
            new RawMaterial
            {
                Id = 1,
                Name = "Steel Sheets",
                Color = "Silver",
                Quantity = 150.5m,
                QuantityType = "kg",
                MinimumStock = 50,
                UnitCost = 2.50m,
                Description = "High-grade steel sheets for manufacturing",
                CreatedAt = DateTime.UtcNow.AddDays(-30),
                UpdatedAt = DateTime.UtcNow.AddDays(-5)
            },
            new RawMaterial
            {
                Id = 2,
                Name = "Aluminum Rods",
                Color = "Silver",
                Quantity = 75,
                QuantityType = "pieces",
                MinimumStock = 20,
                UnitCost = 15.00m,
                Description = "6mm aluminum rods",
                CreatedAt = DateTime.UtcNow.AddDays(-25),
                UpdatedAt = DateTime.UtcNow.AddDays(-3)
            },
            new RawMaterial
            {
                Id = 3,
                Name = "Paint",
                Color = "Blue",
                Quantity = 25.8m,
                QuantityType = "liters",
                MinimumStock = 10,
                UnitCost = 12.00m,
                Description = "Premium blue paint for finishing",
                CreatedAt = DateTime.UtcNow.AddDays(-20),
                UpdatedAt = DateTime.UtcNow.AddDays(-2)
            },
            new RawMaterial
            {
                Id = 4,
                Name = "Paint",
                Color = "Red",
                Quantity = 8.2m,
                QuantityType = "liters",
                MinimumStock = 10,
                UnitCost = 12.00m,
                Description = "Premium red paint for finishing",
                CreatedAt = DateTime.UtcNow.AddDays(-18),
                UpdatedAt = DateTime.UtcNow.AddDays(-1)
            },
            new RawMaterial
            {
                Id = 5,
                Name = "Screws",
                Color = "Silver",
                Quantity = 5,
                QuantityType = "kg",
                MinimumStock = 15,
                UnitCost = 3.50m,
                Description = "M6 stainless steel screws",
                CreatedAt = DateTime.UtcNow.AddDays(-15),
                UpdatedAt = DateTime.UtcNow
            }
        };

        private static int _nextId = 6;

        [HttpGet]
        public ActionResult<IEnumerable<RawMaterialInfo>> GetAllMaterials()
        {
            var materials = _materials.Select(m => new RawMaterialInfo
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
            }).OrderBy(m => m.Name).ThenBy(m => m.Color).ToList();

            return Ok(materials);
        }

        [HttpGet("{id}")]
        public ActionResult<RawMaterialInfo> GetMaterial(int id)
        {
            var material = _materials.FirstOrDefault(m => m.Id == id);
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
        public ActionResult<IEnumerable<MaterialType>> GetMaterialTypes()
        {
            var materialTypes = _materials
                .GroupBy(m => new { m.Name, m.Color, m.QuantityType })
                .Select(g => new MaterialType
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
        public ActionResult<IEnumerable<RawMaterialInfo>> GetLowStockMaterials()
        {
            var lowStockMaterials = _materials
                .Where(m => m.Quantity <= m.MinimumStock && m.IsActive)
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
        public ActionResult<RawMaterialInfo> CreateMaterial([FromBody] CreateRawMaterialRequest request)
        {
            // Check if material with same name, color, and quantity type already exists
            var existingMaterial = _materials.FirstOrDefault(m => 
                m.Name.Equals(request.Name, StringComparison.OrdinalIgnoreCase) &&
                m.Color.Equals(request.Color, StringComparison.OrdinalIgnoreCase) &&
                m.QuantityType.Equals(request.QuantityType, StringComparison.OrdinalIgnoreCase));

            if (existingMaterial != null)
            {
                return BadRequest(new { message = "Material with the same name, color, and quantity type already exists" });
            }

            var newMaterial = new RawMaterial
            {
                Id = _nextId++,
                Name = request.Name,
                Color = request.Color,
                Quantity = request.Quantity,
                QuantityType = request.QuantityType,
                MinimumStock = request.MinimumStock,
                UnitCost = request.UnitCost,
                Description = request.Description,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _materials.Add(newMaterial);

            var materialInfo = new RawMaterialInfo
            {
                Id = newMaterial.Id,
                Name = newMaterial.Name,
                Color = newMaterial.Color,
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
        public ActionResult<RawMaterialInfo> AddToExistingMaterial([FromBody] AddToExistingMaterialRequest request)
        {
            var material = _materials.FirstOrDefault(m => m.Id == request.MaterialId);
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
        public ActionResult<RawMaterialInfo> UpdateMaterial(int id, [FromBody] UpdateRawMaterialRequest request)
        {
            var material = _materials.FirstOrDefault(m => m.Id == id);
            if (material == null)
            {
                return NotFound(new { message = "Material not found" });
            }

            // Check if another material with same name, color, and quantity type already exists
            var existingMaterial = _materials.FirstOrDefault(m => 
                m.Id != id &&
                m.Name.Equals(request.Name, StringComparison.OrdinalIgnoreCase) &&
                m.Color.Equals(request.Color, StringComparison.OrdinalIgnoreCase) &&
                m.QuantityType.Equals(request.QuantityType, StringComparison.OrdinalIgnoreCase));

            if (existingMaterial != null)
            {
                return BadRequest(new { message = "Another material with the same name, color, and quantity type already exists" });
            }

            // Update material
            material.Name = request.Name;
            material.Color = request.Color;
            material.Quantity = request.Quantity;
            material.QuantityType = request.QuantityType;
            material.MinimumStock = request.MinimumStock;
            material.UnitCost = request.UnitCost;
            material.Description = request.Description;
            material.IsActive = request.IsActive;
            material.UpdatedAt = DateTime.UtcNow;

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
        public IActionResult DeleteMaterial(int id)
        {
            var material = _materials.FirstOrDefault(m => m.Id == id);
            if (material == null)
            {
                return NotFound(new { message = "Material not found" });
            }

            _materials.Remove(material);
            return Ok(new { message = "Material deleted successfully" });
        }

        [HttpGet("statistics")]
        public ActionResult<object> GetInventoryStatistics()
        {
            var totalMaterials = _materials.Count(m => m.IsActive);
            var lowStockCount = _materials.Count(m => m.Quantity <= m.MinimumStock && m.IsActive);
            var totalValue = _materials.Where(m => m.IsActive).Sum(m => m.Quantity * m.UnitCost);
            var mostUsedMaterials = _materials
                .Where(m => m.IsActive)
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

        public static RawMaterial? GetRawMaterialById(int id)
        {
            return _materials.FirstOrDefault(m => m.Id == id && m.IsActive);
        }

        public static int GetNextRawMaterialId()
        {
            return _nextId++;
        }

        public static void AddRawMaterial(RawMaterial material)
        {
            _materials.Add(material);
        }
    }
}
