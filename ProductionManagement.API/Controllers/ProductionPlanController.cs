using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductionManagement.API.Data;
using ProductionManagement.API.Models;
using ProductionManagement.API.Repositories;
using System.Security.Claims;

namespace ProductionManagement.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ProductionPlanController : ControllerBase
    {
        private readonly IProductionPlanRepository _repository;
        private readonly ApplicationDbContext _context;

        public ProductionPlanController(IProductionPlanRepository repository, ApplicationDbContext context)
        {
            _repository = repository;
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductionPlanInfo>>> GetAll()
        {
            var plans = await _repository.GetAllAsync();
            var planInfos = new List<ProductionPlanInfo>();

            foreach (var plan in plans)
            {
                var planInfo = await MapToProductionPlanInfo(plan);
                planInfos.Add(planInfo);
            }

            return Ok(planInfos);
        }

        [HttpGet("template/{finishedProductId}")]
        public async Task<ActionResult<ProductTemplateInfo>> GetProductTemplate(int finishedProductId)
        {
            var template = await _context.ProductTemplates
                .Include(t => t.RequiredMaterials)
                    .ThenInclude(m => m.RawMaterial)
                .Include(t => t.FinishedProduct)
                .FirstOrDefaultAsync(t => t.FinishedProductId == finishedProductId);

            if (template == null)
                return NotFound(new { message = "No template found for this product" });

            var templateInfo = new ProductTemplateInfo
            {
                Id = template.Id,
                FinishedProductId = template.FinishedProductId,
                FinishedProductName = template.FinishedProduct?.Name ?? "",
                FinishedProductColor = template.FinishedProduct?.Color ?? "",
                EstimatedProductionTimeMinutes = template.EstimatedProductionTimeMinutes,
                RequiredMaterials = template.RequiredMaterials.Select(m => new ProductTemplateMaterialInfo
                {
                    Id = m.Id,
                    RawMaterialId = m.RawMaterialId,
                    MaterialName = m.RawMaterial?.Name ?? "",
                    MaterialColor = m.RawMaterial?.Color ?? "",
                    QuantityType = m.RawMaterial?.QuantityType ?? "",
                    RequiredQuantity = m.RequiredQuantity,
                    AvailableQuantity = m.RawMaterial?.Quantity ?? 0,
                    UnitCost = m.RawMaterial?.UnitCost ?? 0
                }).ToList()
            };

            return Ok(templateInfo);
        }

        [HttpPut("template/{finishedProductId}")]
        public async Task<ActionResult<ProductTemplateInfo>> UpdateProductTemplate(int finishedProductId, [FromBody] UpdateProductTemplateRequest request)
        {
            var template = await _context.ProductTemplates
                .Include(t => t.RequiredMaterials)
                .FirstOrDefaultAsync(t => t.FinishedProductId == finishedProductId);

            if (template == null)
                return NotFound(new { message = "No template found for this product" });

            // Update template properties
            template.EstimatedProductionTimeMinutes = request.EstimatedProductionTimeMinutes;
            template.UpdatedAt = DateTime.UtcNow;

            // Remove existing materials
            _context.ProductTemplateMaterials.RemoveRange(template.RequiredMaterials);

            // Add new materials
            template.RequiredMaterials = request.RequiredMaterials.Select(m => new ProductTemplateMaterial
            {
                ProductTemplateId = template.Id,
                RawMaterialId = m.RawMaterialId,
                RequiredQuantity = m.RequiredQuantity
            }).ToList();

            await _context.SaveChangesAsync();

            // Return updated template
            var updatedTemplate = await _context.ProductTemplates
                .Include(t => t.RequiredMaterials)
                    .ThenInclude(m => m.RawMaterial)
                .Include(t => t.FinishedProduct)
                .FirstOrDefaultAsync(t => t.FinishedProductId == finishedProductId);

            var templateInfo = new ProductTemplateInfo
            {
                Id = updatedTemplate!.Id,
                FinishedProductId = updatedTemplate.FinishedProductId,
                FinishedProductName = updatedTemplate.FinishedProduct?.Name ?? "",
                FinishedProductColor = updatedTemplate.FinishedProduct?.Color ?? "",
                EstimatedProductionTimeMinutes = updatedTemplate.EstimatedProductionTimeMinutes,
                RequiredMaterials = updatedTemplate.RequiredMaterials.Select(m => new ProductTemplateMaterialInfo
                {
                    Id = m.Id,
                    RawMaterialId = m.RawMaterialId,
                    MaterialName = m.RawMaterial?.Name ?? "",
                    MaterialColor = m.RawMaterial?.Color ?? "",
                    QuantityType = m.RawMaterial?.QuantityType ?? "",
                    RequiredQuantity = m.RequiredQuantity,
                    AvailableQuantity = m.RawMaterial?.Quantity ?? 0,
                    UnitCost = m.RawMaterial?.UnitCost ?? 0
                }).ToList()
            };

            return Ok(templateInfo);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProductionPlanInfo>> GetById(int id)
        {
            var plan = await _repository.GetByIdAsync(id);
            if (plan == null)
                return NotFound(new { message = "Production plan not found" });

            var planInfo = await MapToProductionPlanInfo(plan);
            return Ok(planInfo);
        }

        [HttpPost]
        public async Task<ActionResult<ProductionPlanInfo>> Create([FromBody] CreateProductionPlanRequest request)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            // Determine target product ID
            int targetProductId;
            bool isNewProduct = false;

            if (request.TargetProductId.HasValue)
            {
                // Use existing product
                targetProductId = request.TargetProductId.Value;
                var existingProduct = await _context.RawMaterials.FindAsync(targetProductId);
                if (existingProduct == null || existingProduct.Type != MaterialType.FinishedProduct)
                    return BadRequest(new { message = "Invalid target product. Must be a Finished Product from inventory." });
                
                // Load template if exists and use it if no materials specified
                if (request.RequiredMaterials == null || request.RequiredMaterials.Count == 0)
                {
                    var template = await _context.ProductTemplates
                        .Include(t => t.RequiredMaterials)
                        .FirstOrDefaultAsync(t => t.FinishedProductId == targetProductId);
                    
                    if (template != null)
                    {
                        request.RequiredMaterials = template.RequiredMaterials
                            .Select(m => new CreateProductionPlanMaterialRequest
                            {
                                RawMaterialId = m.RawMaterialId,
                                RequiredQuantity = m.RequiredQuantity
                            }).ToList();
                        
                        if (request.EstimatedProductionTimeMinutes == 0)
                            request.EstimatedProductionTimeMinutes = template.EstimatedProductionTimeMinutes;
                    }
                }
            }
            else if (request.NewFinishedProduct != null)
            {
                // Create new finished product
                var newProduct = new RawMaterial
                {
                    Name = request.NewFinishedProduct.Name,
                    Color = request.NewFinishedProduct.Color,
                    Type = MaterialType.FinishedProduct,
                    Quantity = 0, // Start with 0, will be added when production completes
                    QuantityType = request.NewFinishedProduct.QuantityType,
                    MinimumStock = request.NewFinishedProduct.MinimumStock,
                    UnitCost = 0, // Will be calculated based on production cost
                    Description = request.NewFinishedProduct.Description,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.RawMaterials.Add(newProduct);
                await _context.SaveChangesAsync();
                targetProductId = newProduct.Id;
                isNewProduct = true;
            }
            else
            {
                return BadRequest(new { message = "Either TargetProductId or NewFinishedProduct must be provided." });
            }

            // Calculate estimated cost
            decimal estimatedCost = 0;
            if (request.RequiredMaterials != null)
            {
                foreach (var materialReq in request.RequiredMaterials)
                {
                    var material = await _context.RawMaterials.FindAsync(materialReq.RawMaterialId);
                    if (material != null)
                    {
                        estimatedCost += material.UnitCost * materialReq.RequiredQuantity * request.QuantityToProduce;
                    }
                }
            }

            // Create production plan
            var plan = new ProductionPlan
            {
                Name = request.Name,
                Description = request.Description,
                TargetProductId = targetProductId,
                QuantityToProduce = request.QuantityToProduce,
                Status = ProductionPlanStatus.Draft,
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow,
                PlannedStartDate = request.PlannedStartDate,
                EstimatedProductionTimeMinutes = request.EstimatedProductionTimeMinutes,
                EstimatedCost = estimatedCost,
                Notes = request.Notes
            };

            plan = await _repository.CreateAsync(plan);

            // Add required materials
            if (request.RequiredMaterials != null)
            {
                foreach (var materialReq in request.RequiredMaterials)
                {
                    var material = await _context.RawMaterials.FindAsync(materialReq.RawMaterialId);
                    if (material == null)
                        continue;

                    var planMaterial = new ProductionPlanMaterial
                    {
                        ProductionPlanId = plan.Id,
                        RawMaterialId = materialReq.RawMaterialId,
                        RequiredQuantity = materialReq.RequiredQuantity,
                        EstimatedUnitCost = material.UnitCost
                    };

                    _context.ProductionPlanMaterials.Add(planMaterial);
                }
            }

            await _context.SaveChangesAsync();

            // Save template if creating new product
            if (isNewProduct && request.RequiredMaterials != null && request.RequiredMaterials.Count > 0)
            {
                var template = new ProductTemplate
                {
                    FinishedProductId = targetProductId,
                    EstimatedProductionTimeMinutes = request.EstimatedProductionTimeMinutes,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    RequiredMaterials = request.RequiredMaterials.Select(m => new ProductTemplateMaterial
                    {
                        RawMaterialId = m.RawMaterialId,
                        RequiredQuantity = m.RequiredQuantity
                    }).ToList()
                };

                _context.ProductTemplates.Add(template);
                await _context.SaveChangesAsync();
            }

            // Reload with relationships
            plan = await _repository.GetByIdAsync(plan.Id);
            var planInfo = await MapToProductionPlanInfo(plan!);

            return CreatedAtAction(nameof(GetById), new { id = plan!.Id }, planInfo);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ProductionPlanInfo>> Update(int id, [FromBody] UpdateProductionPlanRequest request)
        {
            var plan = await _repository.GetByIdAsync(id);
            if (plan == null)
                return NotFound(new { message = "Production plan not found" });

            if (plan.Status != ProductionPlanStatus.Draft)
                return BadRequest(new { message = "Can only update draft production plans" });

            // Update basic info
            plan.Name = request.Name;
            plan.Description = request.Description;
            plan.QuantityToProduce = request.QuantityToProduce;
            plan.PlannedStartDate = request.PlannedStartDate;
            plan.EstimatedProductionTimeMinutes = request.EstimatedProductionTimeMinutes;
            plan.Notes = request.Notes;

            // Remove existing materials
            var existingMaterials = await _context.ProductionPlanMaterials
                .Where(m => m.ProductionPlanId == id)
                .ToListAsync();
            _context.ProductionPlanMaterials.RemoveRange(existingMaterials);

            // Calculate new estimated cost and add materials
            decimal estimatedCost = 0;
            foreach (var materialReq in request.RequiredMaterials)
            {
                var material = await _context.RawMaterials.FindAsync(materialReq.RawMaterialId);
                if (material == null)
                    continue;

                estimatedCost += material.UnitCost * materialReq.RequiredQuantity * request.QuantityToProduce;

                var planMaterial = new ProductionPlanMaterial
                {
                    ProductionPlanId = plan.Id,
                    RawMaterialId = materialReq.RawMaterialId,
                    RequiredQuantity = materialReq.RequiredQuantity,
                    EstimatedUnitCost = material.UnitCost
                };

                _context.ProductionPlanMaterials.Add(planMaterial);
            }

            plan.EstimatedCost = estimatedCost;
            await _context.SaveChangesAsync();

            // Reload with relationships
            plan = await _repository.GetByIdAsync(id);
            var planInfo = await MapToProductionPlanInfo(plan!);

            return Ok(planInfo);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            var plan = await _repository.GetByIdAsync(id);
            if (plan == null)
                return NotFound(new { message = "Production plan not found" });

            if (plan.Status == ProductionPlanStatus.Completed)
                return BadRequest(new { message = "Cannot delete completed production plans" });

            await _repository.DeleteAsync(id);
            return NoContent();
        }

        [HttpPost("{id}/execute")]
        public async Task<ActionResult<ProductionPlanExecutionResult>> Execute(int id, [FromBody] ExecuteProductionPlanRequest request)
        {
            var plan = await _repository.GetByIdAsync(id);
            if (plan == null)
                return NotFound(new { message = "Production plan not found" });

            if (plan.Status == ProductionPlanStatus.Completed)
                return BadRequest(new { message = "Production plan already completed" });

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            // Check material availability
            var materialsConsumed = new List<MaterialConsumptionInfo>();
            decimal totalCost = 0;

            foreach (var planMaterial in plan.RequiredMaterials)
            {
                var material = await _context.RawMaterials.FindAsync(planMaterial.RawMaterialId);
                if (material == null)
                    return BadRequest(new { message = $"Material {planMaterial.RawMaterialId} not found" });

                var requiredQty = planMaterial.RequiredQuantity * plan.QuantityToProduce;
                
                if (material.Quantity < requiredQty)
                {
                    return BadRequest(new 
                    { 
                        message = $"Insufficient {material.Name} ({material.Color}). Required: {requiredQty} {material.QuantityType}, Available: {material.Quantity} {material.QuantityType}" 
                    });
                }

                // Deduct from inventory
                material.Quantity -= requiredQty;
                material.UpdatedAt = DateTime.UtcNow;

                var cost = material.UnitCost * requiredQty;
                totalCost += cost;

                materialsConsumed.Add(new MaterialConsumptionInfo
                {
                    MaterialId = material.Id,
                    MaterialName = material.Name,
                    MaterialColor = material.Color,
                    QuantityConsumed = requiredQty,
                    QuantityType = material.QuantityType,
                    Cost = cost
                });

                // Update plan material with actual usage
                planMaterial.ActualQuantityUsed = requiredQty;
                planMaterial.ActualUnitCost = material.UnitCost;
            }

            // Add produced quantity to target product inventory
            var targetProduct = await _context.RawMaterials.FindAsync(plan.TargetProductId);
            if (targetProduct != null)
            {
                targetProduct.Quantity += plan.QuantityToProduce;
                targetProduct.UnitCost = totalCost / plan.QuantityToProduce; // Average cost per unit
                targetProduct.UpdatedAt = DateTime.UtcNow;
            }

            // Update plan status
            plan.Status = ProductionPlanStatus.Completed;
            plan.CompletedByUserId = userId;
            plan.CompletedAt = DateTime.UtcNow;
            plan.StartedAt = plan.StartedAt ?? DateTime.UtcNow;
            plan.ActualCost = totalCost;
            plan.ActualProductionTimeMinutes = request.ActualProductionTimeMinutes ?? plan.EstimatedProductionTimeMinutes;

            await _context.SaveChangesAsync();

            return Ok(new ProductionPlanExecutionResult
            {
                Success = true,
                Message = "Production completed successfully",
                QuantityProduced = plan.QuantityToProduce,
                TotalCost = totalCost,
                MaterialsConsumed = materialsConsumed
            });
        }

        [HttpPost("{id}/start")]
        public async Task<ActionResult<ProductionPlanInfo>> Start(int id)
        {
            var plan = await _repository.GetByIdAsync(id);
            if (plan == null)
                return NotFound(new { message = "Production plan not found" });

            if (plan.Status != ProductionPlanStatus.Draft && plan.Status != ProductionPlanStatus.Planned)
                return BadRequest(new { message = "Can only start draft or planned production plans" });

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            plan.Status = ProductionPlanStatus.InProgress;
            plan.StartedByUserId = userId;
            plan.StartedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var planInfo = await MapToProductionPlanInfo(plan);
            return Ok(planInfo);
        }

        [HttpPost("{id}/cancel")]
        public async Task<ActionResult<ProductionPlanInfo>> Cancel(int id)
        {
            var plan = await _repository.GetByIdAsync(id);
            if (plan == null)
                return NotFound(new { message = "Production plan not found" });

            if (plan.Status == ProductionPlanStatus.Completed)
                return BadRequest(new { message = "Cannot cancel completed production plan" });

            plan.Status = ProductionPlanStatus.Cancelled;
            await _context.SaveChangesAsync();

            var planInfo = await MapToProductionPlanInfo(plan);
            return Ok(planInfo);
        }

        [HttpGet("statistics")]
        public async Task<ActionResult<ProductionPlanStatistics>> GetStatistics()
        {
            var stats = await _repository.GetStatisticsAsync();
            return Ok(stats);
        }

        private async Task<ProductionPlanInfo> MapToProductionPlanInfo(ProductionPlan plan)
        {
            var materials = new List<ProductionPlanMaterialInfo>();
            var missingMaterials = new List<string>();
            bool canProduce = true;

            foreach (var planMaterial in plan.RequiredMaterials)
            {
                var material = planMaterial.RawMaterial;
                if (material == null)
                    material = await _context.RawMaterials.FindAsync(planMaterial.RawMaterialId);

                if (material != null)
                {
                    var requiredQty = planMaterial.RequiredQuantity * plan.QuantityToProduce;
                    var isAvailable = material.Quantity >= requiredQty;

                    if (!isAvailable)
                    {
                        canProduce = false;
                        missingMaterials.Add($"{material.Name} ({material.Color}): need {requiredQty - material.Quantity} more {material.QuantityType}");
                    }

                    materials.Add(new ProductionPlanMaterialInfo
                    {
                        Id = planMaterial.Id,
                        ProductionPlanId = plan.Id,
                        RawMaterialId = planMaterial.RawMaterialId,
                        MaterialName = material.Name,
                        MaterialColor = material.Color,
                        QuantityType = material.QuantityType,
                        RequiredQuantity = planMaterial.RequiredQuantity,
                        ActualQuantityUsed = planMaterial.ActualQuantityUsed,
                        AvailableQuantity = material.Quantity,
                        EstimatedUnitCost = planMaterial.EstimatedUnitCost,
                        ActualUnitCost = planMaterial.ActualUnitCost,
                        IsAvailable = isAvailable
                    });
                }
            }

            return new ProductionPlanInfo
            {
                Id = plan.Id,
                Name = plan.Name,
                Description = plan.Description,
                TargetProductId = plan.TargetProductId,
                TargetProductName = plan.TargetProduct?.Name ?? "",
                TargetProductColor = plan.TargetProduct?.Color ?? "",
                TargetProductQuantityType = plan.TargetProduct?.QuantityType ?? "",
                QuantityToProduce = plan.QuantityToProduce,
                Status = plan.Status,
                CreatedByUserId = plan.CreatedByUserId,
                CreatedByUserName = plan.CreatedByUser?.Username ?? "",
                StartedByUserId = plan.StartedByUserId,
                StartedByUserName = plan.StartedByUser?.Username,
                CompletedByUserId = plan.CompletedByUserId,
                CompletedByUserName = plan.CompletedByUser?.Username,
                CreatedAt = plan.CreatedAt,
                PlannedStartDate = plan.PlannedStartDate,
                StartedAt = plan.StartedAt,
                CompletedAt = plan.CompletedAt,
                EstimatedCost = plan.EstimatedCost,
                ActualCost = plan.ActualCost,
                EstimatedProductionTimeMinutes = plan.EstimatedProductionTimeMinutes,
                ActualProductionTimeMinutes = plan.ActualProductionTimeMinutes,
                Notes = plan.Notes,
                CanProduce = canProduce && plan.Status != ProductionPlanStatus.Completed && plan.Status != ProductionPlanStatus.Cancelled,
                MissingMaterials = missingMaterials,
                RequiredMaterials = materials
            };
        }
    }
}

