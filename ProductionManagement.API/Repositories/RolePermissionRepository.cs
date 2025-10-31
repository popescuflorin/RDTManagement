using Microsoft.EntityFrameworkCore;
using ProductionManagement.API.Data;
using ProductionManagement.API.Models;

namespace ProductionManagement.API.Repositories
{
    public class RolePermissionRepository : Repository<RolePermission>, IRolePermissionRepository
    {
        public RolePermissionRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<RolePermission>> GetByRoleAsync(string role)
        {
            return await _dbSet.Where(rp => rp.Role == role).ToListAsync();
        }

        public async Task<IEnumerable<string>> GetPermissionsByRoleAsync(string role)
        {
            return await _dbSet
                .Where(rp => rp.Role == role)
                .Select(rp => rp.Permission)
                .ToListAsync();
        }

        public async Task DeleteByRoleAsync(string role)
        {
            var permissions = await _dbSet.Where(rp => rp.Role == role).ToListAsync();
            _dbSet.RemoveRange(permissions);
        }
    }
}

