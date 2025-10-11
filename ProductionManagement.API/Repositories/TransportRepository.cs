using Microsoft.EntityFrameworkCore;
using ProductionManagement.API.Data;
using ProductionManagement.API.Models;

namespace ProductionManagement.API.Repositories
{
    public class TransportRepository : Repository<Transport>, ITransportRepository
    {
        public TransportRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<Transport?> GetByCarNameAsync(string carName)
        {
            return await _context.Set<Transport>()
                .FirstOrDefaultAsync(t => t.CarName.ToLower() == carName.ToLower() && t.IsActive);
        }

        public async Task<List<Transport>> GetAllActiveAsync()
        {
            return await _context.Set<Transport>()
                .Where(t => t.IsActive)
                .OrderBy(t => t.CarName)
                .ToListAsync();
        }

        public async Task<List<Transport>> SearchByCarNameAsync(string searchTerm)
        {
            var lowerSearchTerm = searchTerm.ToLower();
            return await _context.Set<Transport>()
                .Where(t => t.IsActive && t.CarName.ToLower().Contains(lowerSearchTerm))
                .OrderBy(t => t.CarName)
                .ToListAsync();
        }
    }
}

