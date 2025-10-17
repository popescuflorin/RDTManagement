using Microsoft.EntityFrameworkCore;
using ProductionManagement.API.Data;
using ProductionManagement.API.Models;

namespace ProductionManagement.API.Repositories
{
    public class ProductionPlanRepository : IProductionPlanRepository
    {
        private readonly ApplicationDbContext _context;

        public ProductionPlanRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ProductionPlan>> GetAllAsync()
        {
            return await _context.ProductionPlans
                .Include(p => p.TargetProduct)
                .Include(p => p.CreatedByUser)
                .Include(p => p.StartedByUser)
                .Include(p => p.CompletedByUser)
                .Include(p => p.RequiredMaterials)
                    .ThenInclude(m => m.RawMaterial)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<ProductionPlan?> GetByIdAsync(int id)
        {
            return await _context.ProductionPlans
                .Include(p => p.TargetProduct)
                .Include(p => p.CreatedByUser)
                .Include(p => p.StartedByUser)
                .Include(p => p.CompletedByUser)
                .Include(p => p.RequiredMaterials)
                    .ThenInclude(m => m.RawMaterial)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<ProductionPlan> CreateAsync(ProductionPlan plan)
        {
            _context.ProductionPlans.Add(plan);
            await _context.SaveChangesAsync();
            return plan;
        }

        public async Task<ProductionPlan> UpdateAsync(ProductionPlan plan)
        {
            _context.ProductionPlans.Update(plan);
            await _context.SaveChangesAsync();
            return plan;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var plan = await _context.ProductionPlans.FindAsync(id);
            if (plan == null)
                return false;

            _context.ProductionPlans.Remove(plan);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<ProductionPlanStatistics> GetStatisticsAsync()
        {
            var plans = await _context.ProductionPlans.ToListAsync();

            return new ProductionPlanStatistics
            {
                TotalPlans = plans.Count,
                DraftPlans = plans.Count(p => p.Status == ProductionPlanStatus.Draft),
                PlannedPlans = plans.Count(p => p.Status == ProductionPlanStatus.Planned),
                InProgressPlans = plans.Count(p => p.Status == ProductionPlanStatus.InProgress),
                CompletedPlans = plans.Count(p => p.Status == ProductionPlanStatus.Completed),
                CancelledPlans = plans.Count(p => p.Status == ProductionPlanStatus.Cancelled),
                TotalProductionValue = plans.Where(p => p.Status == ProductionPlanStatus.Completed)
                    .Sum(p => p.QuantityToProduce),
                TotalProductionCost = plans.Where(p => p.Status == ProductionPlanStatus.Completed)
                    .Sum(p => p.ActualCost ?? 0),
                TotalUnitsProduced = (int)plans.Where(p => p.Status == ProductionPlanStatus.Completed)
                    .Sum(p => p.QuantityToProduce)
            };
        }
    }
}

