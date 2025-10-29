using Microsoft.EntityFrameworkCore;
using ProductionManagement.API.Data;
using ProductionManagement.API.Models;

namespace ProductionManagement.API.Repositories
{
    public interface IClientRepository : IRepository<Client>
    {
        Task<IEnumerable<Client>> GetActiveClientsAsync();
        Task<Client?> GetByIdWithOrdersAsync(int id);
    }

    public class ClientRepository : Repository<Client>, IClientRepository
    {
        public ClientRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Client>> GetActiveClientsAsync()
        {
            return await _dbSet
                .Where(c => c.IsActive)
                .OrderBy(c => c.Name)
                .ToListAsync();
        }

        public async Task<Client?> GetByIdWithOrdersAsync(int id)
        {
            return await _dbSet
                .Include(c => c.Orders)
                    .ThenInclude(o => o.OrderMaterials)
                .Include(c => c.Orders)
                    .ThenInclude(o => o.Transport)
                .FirstOrDefaultAsync(c => c.Id == id);
        }
    }
}

