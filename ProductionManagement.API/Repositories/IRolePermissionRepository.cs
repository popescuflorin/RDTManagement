using ProductionManagement.API.Models;

namespace ProductionManagement.API.Repositories
{
    public interface IRolePermissionRepository : IRepository<RolePermission>
    {
        Task<IEnumerable<RolePermission>> GetByRoleAsync(string role);
        Task<IEnumerable<string>> GetPermissionsByRoleAsync(string role);
        Task DeleteByRoleAsync(string role);
    }
}

