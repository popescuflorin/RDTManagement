namespace ProductionManagement.API.Services;

public interface IEmailService
{
    Task<bool> SendEmailAsync(string toEmail, string toName, string subject, string htmlContent, string? textContent = null);
    Task<bool> SendWelcomeEmailAsync(string toEmail, string userName, string temporaryPassword);
    Task<bool> SendPasswordResetEmailAsync(string toEmail, string userName, string resetLink);
    Task<bool> SendLowStockAlertAsync(string toEmail, string materialName, int currentStock, int minimumStock);
    Task<bool> SendAcquisitionReceivedAsync(string toEmail, string acquisitionNumber, string supplierName);
    Task<bool> SendProductionCompletedAsync(string toEmail, string productionPlanName, int quantityProduced);
    Task<bool> SendOrderProcessedAsync(string toEmail, string clientName, string orderNumber);
}

