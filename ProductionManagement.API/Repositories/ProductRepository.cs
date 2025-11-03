using Microsoft.EntityFrameworkCore;
using ProductionManagement.API.Data;
using ProductionManagement.API.Models;

namespace ProductionManagement.API.Repositories
{
    public class ProductRepository : Repository<Product>, IProductRepository
    {
        public ProductRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Product>> GetActiveProductsAsync()
        {
            return await _dbSet
                .Include(p => p.RequiredMaterials)
                .Where(p => p.IsActive)
                .OrderBy(p => p.Name)
                .ToListAsync();
        }

        public async Task<Product?> GetByIdWithMaterialsAsync(int id)
        {
            return await _dbSet
                .Include(p => p.RequiredMaterials)
                .FirstOrDefaultAsync(p => p.Id == id && p.IsActive);
        }

        public async Task<IEnumerable<Product>> GetProductsWithMaterialsAsync()
        {
            return await _dbSet
                .Include(p => p.RequiredMaterials)
                .Where(p => p.IsActive)
                .ToListAsync();
        }

        public Task<decimal> GetTotalInventoryValueAsync()
        {
            // This will need to be calculated differently since Product doesn't have quantity
            return Task.FromResult<decimal>(0); // Placeholder - will need to be implemented based on FinishedProduct records
        }

        public Task<int> GetTotalProductionCountAsync()
        {
            // This will need to be calculated differently since Product doesn't have quantity
            return Task.FromResult(0); // Placeholder - will need to be implemented based on FinishedProduct records
        }
    }
}

