using Microsoft.EntityFrameworkCore;
using ProductionManagement.API.Data;
using ProductionManagement.API.Models;

namespace ProductionManagement.API.Repositories
{
    public class RawMaterialRepository : Repository<RawMaterial>, IRawMaterialRepository
    {
        public RawMaterialRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<RawMaterial>> GetActiveRawMaterialsAsync()
        {
            return await _dbSet
                .Where(m => m.IsActive)
                .OrderBy(m => m.Name)
                .ToListAsync();
        }

        public async Task<IEnumerable<RawMaterial>> GetAllRawMaterialsIncludingInactiveAsync()
        {
            return await _dbSet
                .OrderBy(m => m.Name)
                .ToListAsync();
        }

        public async Task<IEnumerable<RawMaterial>> GetLowStockMaterialsAsync()
        {
            return await _dbSet
                .Where(m => m.IsActive && m.Quantity < m.MinimumStock)
                .OrderBy(m => m.Quantity)
                .ToListAsync();
        }

        public async Task<RawMaterial?> GetByIdWithDetailsAsync(int id)
        {
            return await _dbSet
                .FirstOrDefaultAsync(m => m.Id == id && m.IsActive);
        }

        public async Task<decimal> GetTotalInventoryValueAsync()
        {
            return await _dbSet
                .Where(m => m.IsActive)
                .SumAsync(m => m.Quantity * m.UnitCost);
        }

        public async Task<IEnumerable<RawMaterial>> GetMostStockedMaterialsAsync(int count = 5)
        {
            return await _dbSet
                .Where(m => m.IsActive)
                .OrderByDescending(m => m.Quantity * m.UnitCost)
                .Take(count)
                .ToListAsync();
        }
    }
}

