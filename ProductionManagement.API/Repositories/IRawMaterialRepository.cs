using ProductionManagement.API.Models;

namespace ProductionManagement.API.Repositories
{
    public interface IRawMaterialRepository : IRepository<RawMaterial>
    {
        Task<IEnumerable<RawMaterial>> GetActiveRawMaterialsAsync();
        Task<IEnumerable<RawMaterial>> GetLowStockMaterialsAsync();
        Task<RawMaterial?> GetByIdWithDetailsAsync(int id);
        Task<decimal> GetTotalInventoryValueAsync();
        Task<IEnumerable<RawMaterial>> GetMostStockedMaterialsAsync(int count = 5);
    }
}

