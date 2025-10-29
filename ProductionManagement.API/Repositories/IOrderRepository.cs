using ProductionManagement.API.Models;

namespace ProductionManagement.API.Repositories
{
    public interface IOrderRepository : IRepository<Order>
    {
        Task<IEnumerable<Order>> GetActiveOrdersAsync();
        Task<Order?> GetByIdWithMaterialsAsync(int id);
        Task<IEnumerable<Order>> GetOrdersWithMaterialsAsync();
    }
}

