using ProductionManagement.API.Models;

namespace ProductionManagement.API.Repositories
{
    public interface ISupplierRepository : IRepository<Supplier>
    {
        Task<IEnumerable<Supplier>> GetActiveSuppliersAsync();
        Task<Supplier?> GetByIdWithDetailsAsync(int id);
        Task<IEnumerable<Supplier>> GetTopSuppliersAsync(int count = 5);
        Task<decimal> GetTotalSupplierValueAsync();
    }
}

