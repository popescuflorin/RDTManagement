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
    public class ProductionController : ControllerBase
    {
        private readonly IProductRepository _productRepository;
        private readonly IRawMaterialRepository _rawMaterialRepository;
        private readonly IUserRepository _userRepository;

        // In-memory storage for finished products (could be added to DB later)
        private static List<FinishedProduct> _finishedProducts = new List<FinishedProduct>();
        private static int _nextFinishedProductId = 1;

        public ProductionController(
            IProductRepository productRepository,
            IRawMaterialRepository rawMaterialRepository,
            IUserRepository userRepository)
        {
            _productRepository = productRepository;
            _rawMaterialRepository = rawMaterialRepository;
            _userRepository = userRepository;
        }

        // Removed static constructor - using database seeding instead

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductInfo>>> GetAllProducts()
        {
            var products = await _productRepository.GetProductsWithMaterialsAsync();
            var materials = await _rawMaterialRepository.GetAllAsync();
            
            var productInfos = products.Select(p => CreateProductInfo(p, materials.ToList())).ToList();
            return Ok(productInfos);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProductInfo>> GetProduct(int id)
        {
            var product = await _productRepository.GetByIdWithMaterialsAsync(id);
            if (product == null)
            {
                return NotFound(new { message = "Product not found" });
            }

            var materials = await _rawMaterialRepository.GetAllAsync();
            var productInfo = CreateProductInfo(product, materials.ToList());
            return Ok(productInfo);
        }

        [HttpGet("finished")]
        public ActionResult<IEnumerable<FinishedProduct>> GetFinishedProducts()
        {
            return Ok(_finishedProducts.OrderByDescending(fp => fp.ProducedAt));
        }

        [HttpGet("statistics")]
        public async Task<ActionResult<ProductionStatistics>> GetProductionStatistics()
        {
            var allProducts = await _productRepository.GetAllAsync();
            var materials = await _rawMaterialRepository.GetAllAsync();
            var materialsList = materials.ToList();
            var activeProducts = allProducts.Where(p => p.IsActive).ToList();
            var canProduceCount = activeProducts.Count(p => CanProduceProduct(p, materialsList));
            
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
                TotalProducts = allProducts.Count(),
                ActiveProducts = activeProducts.Count,
                ProductsCanProduce = canProduceCount,
                TotalFinishedProducts = totalFinishedProducts,
                TotalProductionValue = totalProductionValue,
                TopProducts = topProducts
            });
        }

        [HttpPost]
        [RequirePermission(Permissions.CreateProductionPlan)]
        public async Task<ActionResult<ProductInfo>> CreateProduct([FromBody] CreateProductRequest request)
        {
            var materials = await _rawMaterialRepository.GetAllAsync();

            // Validate that all required materials exist
            foreach (var reqMaterial in request.RequiredMaterials)
            {
                var material = await _rawMaterialRepository.GetByIdAsync(reqMaterial.MaterialId);
                if (material == null)
                {
                    return BadRequest(new { message = $"Material with ID {reqMaterial.MaterialId} not found" });
                }
            }

            var newProduct = new Product
            {
                Name = request.Name,
                Description = request.Description,
                Category = request.Category,
                SellingPrice = request.SellingPrice,
                EstimatedProductionTimeMinutes = request.EstimatedProductionTimeMinutes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true,
                RequiredMaterials = request.RequiredMaterials.Select(rm =>
                {
                    var mat = materials.FirstOrDefault(m => m.Id == rm.MaterialId);
                    return new ProductMaterial
                    {
                        MaterialId = rm.MaterialId,
                        RequiredQuantity = rm.RequiredQuantity,
                        MaterialName = mat?.Name ?? "",
                        MaterialColor = mat?.Color ?? "",
                        QuantityType = mat?.QuantityType ?? ""
                    };
                }).ToList()
            };

            var createdProduct = await _productRepository.AddAsync(newProduct);

            var productInfo = CreateProductInfo(createdProduct, materials.ToList());
            return CreatedAtAction(nameof(GetProduct), new { id = createdProduct.Id }, productInfo);
        }

        [HttpPut("{id}")]
        [RequirePermission(Permissions.EditProductionPlan)]
        public async Task<ActionResult<ProductInfo>> UpdateProduct(int id, [FromBody] UpdateProductRequest request)
        {
            var product = await _productRepository.GetByIdWithMaterialsAsync(id);
            if (product == null)
            {
                return NotFound(new { message = "Product not found" });
            }

            var materials = await _rawMaterialRepository.GetAllAsync();

            // Validate that all required materials exist
            foreach (var reqMaterial in request.RequiredMaterials)
            {
                var material = await _rawMaterialRepository.GetByIdAsync(reqMaterial.MaterialId);
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
            product.RequiredMaterials = request.RequiredMaterials.Select(rm =>
            {
                var mat = materials.FirstOrDefault(m => m.Id == rm.MaterialId);
                return new ProductMaterial
                {
                    ProductId = id,
                    MaterialId = rm.MaterialId,
                    RequiredQuantity = rm.RequiredQuantity,
                    MaterialName = mat?.Name ?? "",
                    MaterialColor = mat?.Color ?? "",
                    QuantityType = mat?.QuantityType ?? ""
                };
            }).ToList();

            await _productRepository.UpdateAsync(product);

            var productInfo = CreateProductInfo(product, materials.ToList());
            return Ok(productInfo);
        }

        [HttpDelete("{id}")]
        [RequirePermission(Permissions.CancelProductionPlan)]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null)
            {
                return NotFound(new { message = "Product not found" });
            }

            await _productRepository.DeleteAsync(product);
            return Ok(new { message = "Product deleted successfully" });
        }

        [HttpPost("produce")]
        [RequirePermission(Permissions.ReceiveProduction)]
        public async Task<ActionResult<ProductionResult>> ProduceProduct([FromBody] ProduceProductRequest request)
        {
            var product = await _productRepository.GetByIdWithMaterialsAsync(request.ProductId);
            if (product == null)
            {
                return NotFound(new { message = "Product not found" });
            }

            if (!product.IsActive)
            {
                return BadRequest(new { message = "Cannot produce inactive product" });
            }

            var allMaterials = await _rawMaterialRepository.GetAllAsync();
            var materials = allMaterials.ToList();
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

                    await _rawMaterialRepository.UpdateAsync(material);

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
