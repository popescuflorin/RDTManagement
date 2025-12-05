using Microsoft.EntityFrameworkCore;
using ProductionManagement.API.Data;
using ProductionManagement.API.Models;

namespace ProductionManagement.API.Repositories
{
    public class OrderRepository : Repository<Order>, IOrderRepository
    {
        public OrderRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Order>> GetActiveOrdersAsync()
        {
            return await _dbSet
                .Include(o => o.Client)
                .Include(o => o.OrderMaterials)
                    .ThenInclude(om => om.RawMaterial)
                .Include(o => o.Transport)
                .Include(o => o.AssignedTo)
                .Where(o => o.Status != OrderStatus.Cancelled)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();
        }

        public async Task<Order?> GetByIdWithMaterialsAsync(int id)
        {
            return await _dbSet
                .Include(o => o.Client)
                .Include(o => o.OrderMaterials)
                    .ThenInclude(om => om.RawMaterial)
                .Include(o => o.Transport)
                .Include(o => o.AssignedTo)
                .FirstOrDefaultAsync(o => o.Id == id);
        }

        public async Task<IEnumerable<Order>> GetOrdersWithMaterialsAsync()
        {
            return await _dbSet
                .Include(o => o.Client)
                .Include(o => o.OrderMaterials)
                    .ThenInclude(om => om.RawMaterial)
                .Include(o => o.Transport)
                .Include(o => o.AssignedTo)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();
        }
    }
}

