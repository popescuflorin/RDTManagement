using ProductionManagement.API.Models;

namespace ProductionManagement.API.Repositories
{
    public interface ITransportRepository : IRepository<Transport>
    {
        Task<Transport?> GetByCarNameAsync(string carName);
        Task<List<Transport>> GetAllActiveAsync();
        Task<List<Transport>> SearchByCarNameAsync(string searchTerm);
    }
}

