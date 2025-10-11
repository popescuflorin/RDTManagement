using ProductionManagement.API.Models;

namespace ProductionManagement.API.Repositories
{
    public interface IAcquisitionRepository : IRepository<Acquisition>
    {
        Task<IEnumerable<Acquisition>> GetActiveAcquisitionsAsync();
        Task<Acquisition?> GetByIdWithItemsAsync(int id);
        Task<IEnumerable<Acquisition>> GetAcquisitionsWithItemsAsync();
        Task<IEnumerable<Acquisition>> GetByStatusAsync(AcquisitionStatus status);
        Task<IEnumerable<Acquisition>> GetDraftAcquisitionsAsync();
        Task<int> GetCountByStatusAsync(AcquisitionStatus status);
        Task<decimal> GetTotalCostByStatusAsync(AcquisitionStatus status, bool useActual = false);
    }
}

