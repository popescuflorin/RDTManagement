using Microsoft.EntityFrameworkCore;
using ProductionManagement.API.Data;
using ProductionManagement.API.Models;

namespace ProductionManagement.API.Repositories
{
    public class SupplierRepository : Repository<Supplier>, ISupplierRepository
    {
        public SupplierRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Supplier>> GetActiveSuppliersAsync()
        {
            return await _dbSet
                .Where(s => s.IsActive)
                .OrderBy(s => s.Name)
                .ToListAsync();
        }

        public async Task<Supplier?> GetByIdWithDetailsAsync(int id)
        {
            return await _dbSet
                .FirstOrDefaultAsync(s => s.Id == id && s.IsActive);
        }

        public async Task<IEnumerable<Supplier>> GetTopSuppliersAsync(int count = 5)
        {
            return await _dbSet
                .Include(s => s.Acquisitions)
                .Where(s => s.IsActive)
                .OrderByDescending(s => s.Acquisitions.Sum(a => a.TotalActualCost))
                .Take(count)
                .ToListAsync();
        }

        public async Task<decimal> GetTotalSupplierValueAsync()
        {
            return await _context.Acquisitions
                .Where(a => a.IsActive && a.Supplier != null)
                .SumAsync(a => a.TotalActualCost);
        }
    }
}

