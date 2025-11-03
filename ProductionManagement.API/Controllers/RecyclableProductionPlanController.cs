using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductionManagement.API.Authorization;
using ProductionManagement.API.Data;
using ProductionManagement.API.Models;

namespace ProductionManagement.API.Controllers
{
    [ApiController]
    [Route("api/productionplan")]
    public class RecyclableProductionPlanController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RecyclableProductionPlanController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost("recyclable")]
        [RequirePermission(Permissions.CreateProductionPlan)]
        public async Task<ActionResult<RecyclableProductionPlan>> CreateRecyclablePlan([FromBody] CreateRecyclableProductionPlanRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { message = "Invalid request" });
            }

            if (request.RequiredRecyclables == null || !request.RequiredRecyclables.Any())
            {
                return BadRequest(new { message = "At least one recyclable material is required" });
            }

            // Determine output raw material
            RawMaterial? outputRaw = null;

            if (request.TargetRawMaterialId.HasValue)
            {
                outputRaw = await _context.RawMaterials.FirstOrDefaultAsync(r => r.Id == request.TargetRawMaterialId.Value);
                if (outputRaw == null)
                {
                    return NotFound(new { message = "Target raw material not found" });
                }
            }
            else if (request.NewRawMaterial != null)
            {
                var newRaw = new RawMaterial
                {
                    Name = request.NewRawMaterial.Name,
                    Color = request.NewRawMaterial.Color,
                    Type = MaterialType.RawMaterial,
                    Quantity = 0,
                    QuantityType = request.NewRawMaterial.QuantityType,
                    MinimumStock = request.NewRawMaterial.MinimumStock,
                    UnitCost = request.NewRawMaterial.UnitCost,
                    Description = request.NewRawMaterial.Description,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsActive = true
                };
                _context.RawMaterials.Add(newRaw);
                await _context.SaveChangesAsync();
                outputRaw = newRaw;
            }
            else
            {
                return BadRequest(new { message = "Specify targetRawMaterialId or newRawMaterial" });
            }

            // Validate recyclables
            var recyclableIds = request.RequiredRecyclables.Select(m => m.RawMaterialId).ToList();
            var recyclableMaterials = await _context.RawMaterials
                .Where(r => recyclableIds.Contains(r.Id))
                .ToListAsync();

            if (recyclableMaterials.Count != recyclableIds.Count)
            {
                return BadRequest(new { message = "One or more recyclable materials not found" });
            }

            // Create plan
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type.EndsWith("nameidentifier", StringComparison.OrdinalIgnoreCase))?.Value;
            int createdById = 0;
            int.TryParse(userIdClaim, out createdById);

            var plan = new RecyclableProductionPlan
            {
                Name = request.Name,
                Description = request.Description ?? string.Empty,
                TargetRawMaterialId = outputRaw!.Id,
                QuantityToProduce = request.QuantityToProduce,
                PlannedStartDate = request.PlannedStartDate,
                EstimatedProductionTimeMinutes = request.EstimatedProductionTimeMinutes,
                Notes = request.Notes,
                CreatedByUserId = createdById,
                CreatedAt = DateTime.UtcNow,
                EstimatedCost = 0 // cost calculation can be implemented later
            };

            _context.RecyclableProductionPlans.Add(plan);
            await _context.SaveChangesAsync();

            var materials = request.RequiredRecyclables.Select(m => new RecyclablePlanMaterial
            {
                RecyclableProductionPlanId = plan.Id,
                RawMaterialId = m.RawMaterialId,
                RequiredQuantity = m.RequiredQuantity
            }).ToList();

            _context.RecyclablePlanMaterials.AddRange(materials);
            await _context.SaveChangesAsync();

            // Load only what's needed for response
            await _context.Entry(plan).Reference(p => p.TargetRawMaterial).LoadAsync();

            var response = new
            {
                id = plan.Id,
                name = plan.Name,
                description = plan.Description,
                targetRawMaterial = plan.TargetRawMaterial == null ? null : new
                {
                    id = plan.TargetRawMaterial.Id,
                    name = plan.TargetRawMaterial.Name
                },
                targetRawMaterialId = plan.TargetRawMaterialId,
                quantityToProduce = plan.QuantityToProduce,
                status = plan.Status,
                plannedStartDate = plan.PlannedStartDate,
                estimatedProductionTimeMinutes = plan.EstimatedProductionTimeMinutes,
                notes = plan.Notes,
                createdByUserId = plan.CreatedByUserId,
                createdAt = plan.CreatedAt,
                requiredRecyclables = materials.Select(m => new
                {
                    rawMaterialId = m.RawMaterialId,
                    requiredQuantity = m.RequiredQuantity
                })
            };

            return Ok(response);
        }

        [HttpPut("recyclable/{id}")]
        [RequirePermission(Permissions.EditProductionPlan)]
        public async Task<ActionResult<RecyclableProductionPlanInfo>> UpdateRecyclablePlan(int id, [FromBody] UpdateRecyclableProductionPlanRequest request)
        {
            var plan = await _context.RecyclableProductionPlans
                .Include(p => p.RequiredRecyclables)
                .Include(p => p.TargetRawMaterial)
                .Include(p => p.CreatedByUser)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (plan == null)
                return NotFound(new { message = "Recyclable production plan not found" });

            if (plan.Status != ProductionPlanStatus.Draft)
                return BadRequest(new { message = "Can only update draft recyclable production plans" });

            // Update basic fields
            plan.Name = request.Name;
            plan.Description = request.Description ?? string.Empty;
            plan.QuantityToProduce = request.QuantityToProduce;
            plan.PlannedStartDate = request.PlannedStartDate;
            plan.EstimatedProductionTimeMinutes = request.EstimatedProductionTimeMinutes;
            plan.Notes = request.Notes;

            // Replace materials
            _context.RecyclablePlanMaterials.RemoveRange(plan.RequiredRecyclables);
            plan.RequiredRecyclables = new List<RecyclablePlanMaterial>();

            if (request.RequiredRecyclables != null)
            {
                foreach (var m in request.RequiredRecyclables)
                {
                    // Ensure referenced raw material exists and is recyclable
                    var raw = await _context.RawMaterials.FirstOrDefaultAsync(r => r.Id == m.RawMaterialId && r.Type == MaterialType.RecyclableMaterial);
                    if (raw == null)
                        return BadRequest(new { message = $"Recyclable material {m.RawMaterialId} not found or not recyclable" });

                    plan.RequiredRecyclables.Add(new RecyclablePlanMaterial
                    {
                        RecyclableProductionPlanId = plan.Id,
                        RawMaterialId = m.RawMaterialId,
                        RequiredQuantity = m.RequiredQuantity
                    });
                }
            }

            await _context.SaveChangesAsync();

            // Build response DTO
            var result = new RecyclableProductionPlanInfo
            {
                Id = plan.Id,
                Name = plan.Name,
                Description = plan.Description,
                TargetRawMaterialId = plan.TargetRawMaterialId,
                TargetRawMaterialName = plan.TargetRawMaterial?.Name ?? string.Empty,
                TargetRawMaterialColor = plan.TargetRawMaterial?.Color ?? string.Empty,
                TargetRawMaterialQuantityType = plan.TargetRawMaterial?.QuantityType ?? string.Empty,
                QuantityToProduce = plan.QuantityToProduce,
                Status = plan.Status,
                CreatedByUserId = plan.CreatedByUserId,
                CreatedByUserName = plan.CreatedByUser?.Username,
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
                RequiredRecyclables = plan.RequiredRecyclables.Select(m => new RecyclablePlanMaterialInfo
                {
                    Id = m.Id,
                    RecyclableProductionPlanId = m.RecyclableProductionPlanId,
                    RawMaterialId = m.RawMaterialId,
                    MaterialName = m.RawMaterial?.Name ?? string.Empty,
                    MaterialColor = m.RawMaterial?.Color ?? string.Empty,
                    QuantityType = m.RawMaterial?.QuantityType ?? string.Empty,
                    RequiredQuantity = m.RequiredQuantity,
                    ActualQuantityUsed = m.ActualQuantityUsed,
                    AvailableQuantity = m.RawMaterial?.Quantity ?? 0
                }).ToList()
            };

            return Ok(result);
        }

        [HttpPost("recyclable/{id}/cancel")]
        [RequirePermission(Permissions.CancelProductionPlan)]
        public async Task<ActionResult<RecyclableProductionPlanInfo>> CancelRecyclablePlan(int id)
        {
            var plan = await _context.RecyclableProductionPlans
                .Include(p => p.RequiredRecyclables)
                    .ThenInclude(rm => rm.RawMaterial)
                .Include(p => p.TargetRawMaterial)
                .Include(p => p.CreatedByUser)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (plan == null)
                return NotFound(new { message = "Recyclable production plan not found" });

            if (plan.Status == ProductionPlanStatus.Completed)
                return BadRequest(new { message = "Cannot cancel completed production plan" });

            plan.Status = ProductionPlanStatus.Cancelled;
            await _context.SaveChangesAsync();

            var result = new RecyclableProductionPlanInfo
            {
                Id = plan.Id,
                Name = plan.Name,
                Description = plan.Description,
                TargetRawMaterialId = plan.TargetRawMaterialId,
                TargetRawMaterialName = plan.TargetRawMaterial?.Name ?? string.Empty,
                TargetRawMaterialColor = plan.TargetRawMaterial?.Color ?? string.Empty,
                TargetRawMaterialQuantityType = plan.TargetRawMaterial?.QuantityType ?? string.Empty,
                QuantityToProduce = plan.QuantityToProduce,
                Status = plan.Status,
                CreatedByUserId = plan.CreatedByUserId,
                CreatedByUserName = plan.CreatedByUser?.Username,
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
                RequiredRecyclables = plan.RequiredRecyclables.Select(m => new RecyclablePlanMaterialInfo
                {
                    Id = m.Id,
                    RecyclableProductionPlanId = m.RecyclableProductionPlanId,
                    RawMaterialId = m.RawMaterialId,
                    MaterialName = m.RawMaterial?.Name ?? string.Empty,
                    MaterialColor = m.RawMaterial?.Color ?? string.Empty,
                    QuantityType = m.RawMaterial?.QuantityType ?? string.Empty,
                    RequiredQuantity = m.RequiredQuantity,
                    ActualQuantityUsed = m.ActualQuantityUsed,
                    AvailableQuantity = m.RawMaterial?.Quantity ?? 0
                }).ToList()
            };

            return Ok(result);
        }

        [HttpPost("recyclable/{id}/execute")]
        [RequirePermission(Permissions.ExecuteProduction)]
        public async Task<ActionResult<object>> ExecuteRecyclablePlan(int id)
        {
            var plan = await _context.RecyclableProductionPlans
                .Include(p => p.RequiredRecyclables)
                .Include(p => p.TargetRawMaterial)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (plan == null)
                return NotFound(new { message = "Recyclable production plan not found" });

            if (plan.Status == ProductionPlanStatus.Completed)
                return BadRequest(new { message = "Plan already completed" });

            if (plan.Status == ProductionPlanStatus.Cancelled)
                return BadRequest(new { message = "Cannot execute a cancelled plan" });

            // Check availability
            foreach (var m in plan.RequiredRecyclables)
            {
                var mat = await _context.RawMaterials.FindAsync(m.RawMaterialId);
                if (mat == null)
                    return BadRequest(new { message = $"Material {m.RawMaterialId} not found" });
                var requiredQty = m.RequiredQuantity * plan.QuantityToProduce;
                if (mat.Quantity < requiredQty)
                    return BadRequest(new { message = $"Insufficient {mat.Name} ({mat.Color}). Required: {requiredQty} {mat.QuantityType}, Available: {mat.Quantity} {mat.QuantityType}" });
            }

            // Consume recyclables
            foreach (var m in plan.RequiredRecyclables)
            {
                var mat = await _context.RawMaterials.FindAsync(m.RawMaterialId);
                if (mat == null) continue;
                var requiredQty = m.RequiredQuantity * plan.QuantityToProduce;
                mat.Quantity -= requiredQty;
                mat.UpdatedAt = DateTime.UtcNow;
                m.ActualQuantityUsed = requiredQty;
            }

            // Produce output raw material
            var target = await _context.RawMaterials.FindAsync(plan.TargetRawMaterialId);
            if (target != null)
            {
                target.Quantity += plan.QuantityToProduce;
                target.UpdatedAt = DateTime.UtcNow;
            }

            // Update plan status
            plan.Status = ProductionPlanStatus.Completed;
            plan.StartedAt = plan.StartedAt ?? DateTime.UtcNow;
            plan.CompletedAt = DateTime.UtcNow;
            plan.ActualProductionTimeMinutes = plan.EstimatedProductionTimeMinutes;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Recyclable plan processed and inventory updated",
                quantityProduced = plan.QuantityToProduce,
                targetRawMaterialId = plan.TargetRawMaterialId
            });
        }

        [HttpGet("recyclable/paged")]
        [RequirePermission(Permissions.ViewProductionTab)]
        public async Task<ActionResult<PagedResult<RecyclableProductionPlanInfo>>> GetRecyclablePlansPaged([FromQuery] RecyclableProductionPlanPagedRequest request)
        {
            var query = _context.RecyclableProductionPlans
                .Include(p => p.TargetRawMaterial)
                .Include(p => p.CreatedByUser)
                .Include(p => p.RequiredRecyclables)
                    .ThenInclude(m => m.RawMaterial)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                var term = request.SearchTerm.ToLower();
                query = query.Where(p =>
                    p.Name.ToLower().Contains(term) ||
                    (p.Description != null && p.Description.ToLower().Contains(term)) ||
                    (p.TargetRawMaterial != null && p.TargetRawMaterial.Name.ToLower().Contains(term))
                );
            }

            if (request.Status.HasValue)
            {
                query = query.Where(p => p.Status == request.Status.Value);
            }

            var totalCount = await query.CountAsync();

            query = request.SortBy.ToLower() switch
            {
                "name" => request.SortOrder.ToLower() == "asc" ? query.OrderBy(p => p.Name) : query.OrderByDescending(p => p.Name),
                "status" => request.SortOrder.ToLower() == "asc" ? query.OrderBy(p => p.Status) : query.OrderByDescending(p => p.Status),
                "createdat" or _ => request.SortOrder.ToLower() == "asc" ? query.OrderBy(p => p.CreatedAt) : query.OrderByDescending(p => p.CreatedAt)
            };

            var plans = await query
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            var items = plans.Select(plan => new RecyclableProductionPlanInfo
            {
                Id = plan.Id,
                Name = plan.Name,
                Description = plan.Description,
                TargetRawMaterialId = plan.TargetRawMaterialId,
                TargetRawMaterialName = plan.TargetRawMaterial?.Name ?? string.Empty,
                TargetRawMaterialColor = plan.TargetRawMaterial?.Color ?? string.Empty,
                TargetRawMaterialQuantityType = plan.TargetRawMaterial?.QuantityType ?? string.Empty,
                QuantityToProduce = plan.QuantityToProduce,
                Status = plan.Status,
                CreatedByUserId = plan.CreatedByUserId,
                CreatedByUserName = plan.CreatedByUser?.Username,
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
                RequiredRecyclables = plan.RequiredRecyclables.Select(m => new RecyclablePlanMaterialInfo
                {
                    Id = m.Id,
                    RecyclableProductionPlanId = m.RecyclableProductionPlanId,
                    RawMaterialId = m.RawMaterialId,
                    MaterialName = m.RawMaterial?.Name ?? string.Empty,
                    MaterialColor = m.RawMaterial?.Color ?? string.Empty,
                    QuantityType = m.RawMaterial?.QuantityType ?? string.Empty,
                    RequiredQuantity = m.RequiredQuantity,
                    ActualQuantityUsed = m.ActualQuantityUsed,
                    AvailableQuantity = m.RawMaterial?.Quantity ?? 0
                }).ToList()
            }).ToList();

            var result = new PagedResult<RecyclableProductionPlanInfo>
            {
                Items = items,
                TotalCount = totalCount,
                Page = request.Page,
                PageSize = request.PageSize
            };

            return Ok(result);
        }
    }
}


