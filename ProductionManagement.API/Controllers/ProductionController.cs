using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ProductionManagement.API.Models;
using System.Security.Claims;

namespace ProductionManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProductionController : ControllerBase
    {
        // In-memory storage for demo purposes
        private static List<Product> _products = new List<Product>();
        private static List<FinishedProduct> _finishedProducts = new List<FinishedProduct>();
        private static int _nextProductId = 1;
        private static int _nextFinishedProductId = 1;
        private static int _nextProductMaterialId = 1;

        // Reference to inventory (in real app, this would be through dependency injection)
        private static List<RawMaterial> GetMaterials()
        {
            // This is a hack to access the materials from InventoryController
            // In a real application, this would be through a shared service or database
            var inventoryControllerType = typeof(InventoryController);
            var materialsField = inventoryControllerType.GetField("_materials", 
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
            return (List<RawMaterial>)materialsField?.GetValue(null) ?? new List<RawMaterial>();
        }

        static ProductionController()
        {
            // Sample products
            _products.Add(new Product
            {
                Id = _nextProductId++,
                Name = "Steel Cabinet",
                Description = "Heavy-duty steel storage cabinet with blue finish",
                Category = "Furniture",
                SellingPrice = 299.99m,
                EstimatedProductionTimeMinutes = 120,
                CreatedAt = DateTime.UtcNow.AddDays(-20),
                UpdatedAt = DateTime.UtcNow.AddDays(-5),
                RequiredMaterials = new List<ProductMaterial>
                {
                    new ProductMaterial { Id = _nextProductMaterialId++, MaterialId = 1, RequiredQuantity = 25.0m },  // Steel Sheets
                    new ProductMaterial { Id = _nextProductMaterialId++, MaterialId = 3, RequiredQuantity = 2.5m },   // Blue Paint
                    new ProductMaterial { Id = _nextProductMaterialId++, MaterialId = 5, RequiredQuantity = 1.2m }    // Screws
                }
            });

            _products.Add(new Product
            {
                Id = _nextProductId++,
                Name = "Aluminum Frame",
                Description = "Lightweight aluminum frame for windows",
                Category = "Construction",
                SellingPrice = 149.99m,
                EstimatedProductionTimeMinutes = 60,
                CreatedAt = DateTime.UtcNow.AddDays(-15),
                UpdatedAt = DateTime.UtcNow.AddDays(-2),
                RequiredMaterials = new List<ProductMaterial>
                {
                    new ProductMaterial { Id = _nextProductMaterialId++, MaterialId = 2, RequiredQuantity = 8.0m }     // Aluminum Rods
                }
            });
        }

        [HttpGet]
        public ActionResult<IEnumerable<ProductInfo>> GetAllProducts()
        {
            var materials = GetMaterials();
            
            var productInfos = _products.Select(p => CreateProductInfo(p, materials)).ToList();
            return Ok(productInfos);
        }

        [HttpGet("{id}")]
        public ActionResult<ProductInfo> GetProduct(int id)
        {
            var product = _products.FirstOrDefault(p => p.Id == id);
            if (product == null)
            {
                return NotFound(new { message = "Product not found" });
            }

            var materials = GetMaterials();
            var productInfo = CreateProductInfo(product, materials);
            return Ok(productInfo);
        }

        [HttpGet("finished")]
        public ActionResult<IEnumerable<FinishedProduct>> GetFinishedProducts()
        {
            return Ok(_finishedProducts.OrderByDescending(fp => fp.ProducedAt));
        }

        [HttpGet("statistics")]
        public ActionResult<ProductionStatistics> GetProductionStatistics()
        {
            var materials = GetMaterials();
            var activeProducts = _products.Where(p => p.IsActive).ToList();
            var canProduceCount = activeProducts.Count(p => CanProduceProduct(p, materials));
            
            var totalFinishedProducts = _finishedProducts.Sum(fp => fp.Quantity);
            var totalProductionValue = _finishedProducts.Sum(fp => fp.Quantity * fp.ProductionCost);

            var topProducts = _finishedProducts
                .GroupBy(fp => new { fp.ProductId, fp.ProductName })
                .Select(g => new TopProduct
                {
                    Name = g.Key.ProductName,
                    TotalProduced = g.Sum(fp => fp.Quantity),
                    TotalValue = g.Sum(fp => fp.Quantity * fp.ProductionCost)
                })
                .OrderByDescending(tp => tp.TotalProduced)
                .Take(5)
                .ToList();

            return Ok(new ProductionStatistics
            {
                TotalProducts = _products.Count,
                ActiveProducts = activeProducts.Count,
                ProductsCanProduce = canProduceCount,
                TotalFinishedProducts = totalFinishedProducts,
                TotalProductionValue = totalProductionValue,
                TopProducts = topProducts
            });
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public ActionResult<ProductInfo> CreateProduct([FromBody] CreateProductRequest request)
        {
            var materials = GetMaterials();

            // Validate that all required materials exist
            foreach (var reqMaterial in request.RequiredMaterials)
            {
                var material = materials.FirstOrDefault(m => m.Id == reqMaterial.MaterialId);
                if (material == null)
                {
                    return BadRequest(new { message = $"Material with ID {reqMaterial.MaterialId} not found" });
                }
            }

            var newProduct = new Product
            {
                Id = _nextProductId++,
                Name = request.Name,
                Description = request.Description,
                Category = request.Category,
                SellingPrice = request.SellingPrice,
                EstimatedProductionTimeMinutes = request.EstimatedProductionTimeMinutes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                RequiredMaterials = request.RequiredMaterials.Select(rm => new ProductMaterial
                {
                    Id = _nextProductMaterialId++,
                    ProductId = _nextProductId - 1,
                    MaterialId = rm.MaterialId,
                    RequiredQuantity = rm.RequiredQuantity
                }).ToList()
            };

            _products.Add(newProduct);

            var productInfo = CreateProductInfo(newProduct, materials);
            return CreatedAtAction(nameof(GetProduct), new { id = newProduct.Id }, productInfo);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public ActionResult<ProductInfo> UpdateProduct(int id, [FromBody] UpdateProductRequest request)
        {
            var product = _products.FirstOrDefault(p => p.Id == id);
            if (product == null)
            {
                return NotFound(new { message = "Product not found" });
            }

            var materials = GetMaterials();

            // Validate that all required materials exist
            foreach (var reqMaterial in request.RequiredMaterials)
            {
                var material = materials.FirstOrDefault(m => m.Id == reqMaterial.MaterialId);
                if (material == null)
                {
                    return BadRequest(new { message = $"Material with ID {reqMaterial.MaterialId} not found" });
                }
            }

            // Update product
            product.Name = request.Name;
            product.Description = request.Description;
            product.Category = request.Category;
            product.SellingPrice = request.SellingPrice;
            product.EstimatedProductionTimeMinutes = request.EstimatedProductionTimeMinutes;
            product.IsActive = request.IsActive;
            product.UpdatedAt = DateTime.UtcNow;

            // Update required materials
            product.RequiredMaterials = request.RequiredMaterials.Select(rm => new ProductMaterial
            {
                Id = _nextProductMaterialId++,
                ProductId = id,
                MaterialId = rm.MaterialId,
                RequiredQuantity = rm.RequiredQuantity
            }).ToList();

            var productInfo = CreateProductInfo(product, materials);
            return Ok(productInfo);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public IActionResult DeleteProduct(int id)
        {
            var product = _products.FirstOrDefault(p => p.Id == id);
            if (product == null)
            {
                return NotFound(new { message = "Product not found" });
            }

            _products.Remove(product);
            return Ok(new { message = "Product deleted successfully" });
        }

        [HttpPost("produce")]
        [Authorize(Roles = "Admin,Manager")]
        public ActionResult<ProductionResult> ProduceProduct([FromBody] ProduceProductRequest request)
        {
            var product = _products.FirstOrDefault(p => p.Id == request.ProductId);
            if (product == null)
            {
                return NotFound(new { message = "Product not found" });
            }

            if (!product.IsActive)
            {
                return BadRequest(new { message = "Cannot produce inactive product" });
            }

            var materials = GetMaterials();
            var materialsConsumed = new List<MaterialConsumption>();
            var totalCost = 0m;

            // Check if we have enough materials for the requested quantity
            foreach (var reqMaterial in product.RequiredMaterials)
            {
                var material = materials.FirstOrDefault(m => m.Id == reqMaterial.MaterialId);
                if (material == null)
                {
                    return BadRequest(new { message = $"Required material not found: {reqMaterial.MaterialName}" });
                }

                var totalRequired = reqMaterial.RequiredQuantity * request.Quantity;
                if (material.Quantity < totalRequired)
                {
                    return BadRequest(new { 
                        message = $"Insufficient material: {material.Name} ({material.Color}). Required: {totalRequired} {material.QuantityType}, Available: {material.Quantity} {material.QuantityType}" 
                    });
                }
            }

            // Consume materials
            foreach (var reqMaterial in product.RequiredMaterials)
            {
                var material = materials.FirstOrDefault(m => m.Id == reqMaterial.MaterialId);
                if (material != null)
                {
                    var totalRequired = reqMaterial.RequiredQuantity * request.Quantity;
                    var cost = totalRequired * material.UnitCost;
                    
                    material.Quantity -= totalRequired;
                    material.UpdatedAt = DateTime.UtcNow;
                    totalCost += cost;

                    materialsConsumed.Add(new MaterialConsumption
                    {
                        MaterialId = material.Id,
                        MaterialName = material.Name,
                        MaterialColor = material.Color,
                        QuantityConsumed = totalRequired,
                        QuantityType = material.QuantityType,
                        Cost = cost
                    });
                }
            }

            // Create finished product record
            var finishedProduct = new FinishedProduct
            {
                Id = _nextFinishedProductId++,
                ProductId = product.Id,
                ProductName = product.Name,
                Quantity = request.Quantity,
                ProductionCost = totalCost,
                ProducedAt = DateTime.UtcNow,
                Notes = request.Notes,
                MaterialsUsed = materialsConsumed
            };

            _finishedProducts.Add(finishedProduct);

            return Ok(new ProductionResult
            {
                Success = true,
                Message = $"Successfully produced {request.Quantity} units of {product.Name}",
                ProductsProduced = request.Quantity,
                MaterialsConsumed = materialsConsumed,
                TotalCost = totalCost,
                ProductionDate = DateTime.UtcNow
            });
        }

        private ProductInfo CreateProductInfo(Product product, List<RawMaterial> materials)
        {
            var estimatedCost = 0m;
            var canProduce = true;
            var missingMaterials = new List<string>();

            // Update material info and calculate costs
            foreach (var reqMaterial in product.RequiredMaterials)
            {
                var material = materials.FirstOrDefault(m => m.Id == reqMaterial.MaterialId);
                if (material != null)
                {
                    reqMaterial.MaterialName = material.Name;
                    reqMaterial.MaterialColor = material.Color;
                    reqMaterial.QuantityType = material.QuantityType;
                    estimatedCost += reqMaterial.RequiredQuantity * material.UnitCost;

                    if (material.Quantity < reqMaterial.RequiredQuantity)
                    {
                        canProduce = false;
                        missingMaterials.Add($"{material.Name} ({material.Color}) - Need: {reqMaterial.RequiredQuantity} {material.QuantityType}, Have: {material.Quantity} {material.QuantityType}");
                    }
                }
                else
                {
                    canProduce = false;
                    missingMaterials.Add($"Material ID {reqMaterial.MaterialId} not found");
                }
            }

            return new ProductInfo
            {
                Id = product.Id,
                Name = product.Name,
                Description = product.Description,
                Category = product.Category,
                SellingPrice = product.SellingPrice,
                EstimatedProductionTimeMinutes = product.EstimatedProductionTimeMinutes,
                CreatedAt = product.CreatedAt,
                UpdatedAt = product.UpdatedAt,
                IsActive = product.IsActive,
                RequiredMaterials = product.RequiredMaterials,
                EstimatedCost = estimatedCost,
                EstimatedProfit = product.SellingPrice - estimatedCost,
                CanProduce = canProduce && product.IsActive,
                MissingMaterials = missingMaterials
            };
        }

        private bool CanProduceProduct(Product product, List<RawMaterial> materials)
        {
            if (!product.IsActive) return false;

            foreach (var reqMaterial in product.RequiredMaterials)
            {
                var material = materials.FirstOrDefault(m => m.Id == reqMaterial.MaterialId);
                if (material == null || material.Quantity < reqMaterial.RequiredQuantity)
                {
                    return false;
                }
            }
            return true;
        }
    }
}
