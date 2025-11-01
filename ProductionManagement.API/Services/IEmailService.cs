namespace ProductionManagement.API.Services;

public class AcquisitionItemEmailDto
{
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public decimal OrderedQuantity { get; set; }
    public decimal? ReceivedQuantity { get; set; }
    public decimal Quantity { get; set; } // Effective quantity for backward compatibility
    public string QuantityType { get; set; } = string.Empty;
}

public class ProcessedMaterialEmailDto
{
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string QuantityType { get; set; } = string.Empty;
}

public interface IEmailService
{
    Task<bool> SendEmailAsync(string toEmail, string toName, string subject, string htmlContent, string? textContent = null);
    Task<bool> SendWelcomeEmailAsync(string toEmail, string userName, string temporaryPassword);
    Task<bool> SendPasswordResetEmailAsync(string toEmail, string userName, string resetLink);
    Task<bool> SendLowStockAlertAsync(string toEmail, string materialName, int currentStock, int minimumStock);
    Task<bool> SendAcquisitionCreatedAsync(
        string toEmail, 
        string userName, 
        string acquisitionTitle, 
        string acquisitionNumber, 
        string acquisitionType, 
        string createdBy, 
        string? assignedToUser = null,
        string? description = null,
        string? supplierName = null,
        string? supplierContact = null,
        string? transportCarName = null,
        string? transportPhoneNumber = null,
        DateTime? transportDate = null,
        string? transportNotes = null,
        List<AcquisitionItemEmailDto>? items = null);
    Task<bool> SendAcquisitionUpdatedAsync(
        string toEmail, 
        string userName, 
        string acquisitionTitle, 
        string acquisitionNumber, 
        string acquisitionType, 
        string updatedBy, 
        List<string> changes,
        string? assignedToUser = null,
        string? description = null,
        string? supplierName = null,
        string? supplierContact = null,
        string? transportCarName = null,
        string? transportPhoneNumber = null,
        DateTime? transportDate = null,
        string? transportNotes = null,
        List<AcquisitionItemEmailDto>? items = null);
    Task<bool> SendAcquisitionDeletedAsync(
        string toEmail, 
        string userName, 
        string acquisitionTitle, 
        string acquisitionNumber, 
        string acquisitionType, 
        string deletedBy, 
        string? assignedToUser = null,
        string? description = null,
        string? supplierName = null,
        string? supplierContact = null,
        string? transportCarName = null,
        string? transportPhoneNumber = null,
        DateTime? transportDate = null,
        string? transportNotes = null,
        List<AcquisitionItemEmailDto>? items = null);
    Task<bool> SendAcquisitionReceivedAsync(
        string toEmail, 
        string userName, 
        string acquisitionTitle, 
        string acquisitionNumber, 
        string acquisitionType, 
        string receivedBy, 
        string? assignedToUser = null,
        string? description = null,
        string? supplierName = null,
        string? supplierContact = null,
        string? transportCarName = null,
        string? transportPhoneNumber = null,
        DateTime? transportDate = null,
        string? transportNotes = null,
        decimal? totalActualCost = null,
        List<AcquisitionItemEmailDto>? items = null);
    Task<bool> SendAcquisitionProcessedAsync(
        string toEmail, 
        string userName, 
        string acquisitionTitle, 
        string acquisitionNumber, 
        string processedBy,
        int materialsProcessed,
        decimal totalOutputQuantity,
        string? assignedToUser = null,
        string? description = null,
        List<AcquisitionItemEmailDto>? items = null,
        List<ProcessedMaterialEmailDto>? processedMaterials = null);
    Task<bool> SendProductionCompletedAsync(string toEmail, string productionPlanName, int quantityProduced);
    Task<bool> SendOrderProcessedAsync(string toEmail, string clientName, string orderNumber);
}

