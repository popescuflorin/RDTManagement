using ProductionManagement.API.Models;

namespace ProductionManagement.API.Repositories
{
    public interface IProductionPlanRepository
    {
        Task<IEnumerable<ProductionPlan>> GetAllAsync();
        Task<ProductionPlan?> GetByIdAsync(int id);
        Task<ProductionPlan> CreateAsync(ProductionPlan plan);
        Task<ProductionPlan> UpdateAsync(ProductionPlan plan);
        Task<bool> DeleteAsync(int id);
        Task<ProductionPlanStatistics> GetStatisticsAsync();
    }
}

