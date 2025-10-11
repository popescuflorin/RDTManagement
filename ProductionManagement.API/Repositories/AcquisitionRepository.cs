using Microsoft.EntityFrameworkCore;
using ProductionManagement.API.Data;
using ProductionManagement.API.Models;

namespace ProductionManagement.API.Repositories
{
    public class AcquisitionRepository : Repository<Acquisition>, IAcquisitionRepository
    {
        public AcquisitionRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Acquisition>> GetActiveAcquisitionsAsync()
        {
            return await _dbSet
                .Include(a => a.Items)
                    .ThenInclude(i => i.RawMaterial)
                .Include(a => a.ProcessedMaterials)
                    .ThenInclude(pm => pm.RawMaterial)
                .Include(a => a.History)
                    .ThenInclude(h => h.User)
                .Include(a => a.Supplier)
                .Include(a => a.Transport)
                .Include(a => a.CreatedBy)
                .Include(a => a.ReceivedBy)
                .Include(a => a.AssignedTo)
                .Where(a => a.IsActive)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();
        }

        public async Task<Acquisition?> GetByIdWithItemsAsync(int id)
        {
            return await _dbSet
                .Include(a => a.Items)
                    .ThenInclude(i => i.RawMaterial)
                .Include(a => a.ProcessedMaterials)
                    .ThenInclude(pm => pm.RawMaterial)
                .Include(a => a.History)
                    .ThenInclude(h => h.User)
                .Include(a => a.Supplier)
                .Include(a => a.Transport)
                .Include(a => a.CreatedBy)
                .Include(a => a.ReceivedBy)
                .Include(a => a.AssignedTo)
                .FirstOrDefaultAsync(a => a.Id == id && a.IsActive);
        }

        public async Task<IEnumerable<Acquisition>> GetAcquisitionsWithItemsAsync()
        {
            return await _dbSet
                .Include(a => a.Items)
                    .ThenInclude(i => i.RawMaterial)
                .Include(a => a.ProcessedMaterials)
                    .ThenInclude(pm => pm.RawMaterial)
                .Include(a => a.History)
                    .ThenInclude(h => h.User)
                .Include(a => a.Supplier)
                .Include(a => a.Transport)
                .Include(a => a.CreatedBy)
                .Include(a => a.ReceivedBy)
                .Include(a => a.AssignedTo)
                .Where(a => a.IsActive)
                .ToListAsync();
        }

        public async Task<IEnumerable<Acquisition>> GetByStatusAsync(AcquisitionStatus status)
        {
            return await _dbSet
                .Include(a => a.Items)
                .Where(a => a.IsActive && a.Status == status)
                .ToListAsync();
        }

        public async Task<IEnumerable<Acquisition>> GetDraftAcquisitionsAsync()
        {
            return await _dbSet
                .Include(a => a.Items)
                .Where(a => a.IsActive && a.Status == AcquisitionStatus.Draft)
                .ToListAsync();
        }

        public async Task<int> GetCountByStatusAsync(AcquisitionStatus status)
        {
            return await _dbSet
                .Where(a => a.IsActive && a.Status == status)
                .CountAsync();
        }

        public async Task<decimal> GetTotalCostByStatusAsync(AcquisitionStatus status, bool useActual = false)
        {
            if (useActual)
            {
                return await _dbSet
                    .Where(a => a.IsActive && a.Status == status)
                    .SumAsync(a => a.TotalActualCost);
            }
            
            return await _dbSet
                .Where(a => a.IsActive && a.Status == status)
                .SumAsync(a => a.TotalEstimatedCost);
        }
    }
}

