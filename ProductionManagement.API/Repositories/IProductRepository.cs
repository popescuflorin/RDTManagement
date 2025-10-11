using ProductionManagement.API.Models;

namespace ProductionManagement.API.Repositories
{
    public interface IProductRepository : IRepository<Product>
    {
        Task<IEnumerable<Product>> GetActiveProductsAsync();
        Task<Product?> GetByIdWithMaterialsAsync(int id);
        Task<IEnumerable<Product>> GetProductsWithMaterialsAsync();
        Task<decimal> GetTotalInventoryValueAsync();
        Task<int> GetTotalProductionCountAsync();
    }
}

