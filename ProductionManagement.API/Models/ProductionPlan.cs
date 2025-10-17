namespace ProductionManagement.API.Models
{
    public enum ProductionPlanStatus
    {
        Draft = 0,
        Planned = 1,
        InProgress = 2,
        Completed = 3,
        Cancelled = 4
    }

    public class ProductionPlan
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        
        // Target product (what we're producing - should be a FinishedProduct in inventory)
        public int TargetProductId { get; set; }
        public RawMaterial? TargetProduct { get; set; }
        
        public decimal QuantityToProduce { get; set; }
        public ProductionPlanStatus Status { get; set; } = ProductionPlanStatus.Draft;
        
        public int CreatedByUserId { get; set; }
        public User? CreatedByUser { get; set; }
        
        public int? StartedByUserId { get; set; }
        public User? StartedByUser { get; set; }
        
        public int? CompletedByUserId { get; set; }
        public User? CompletedByUser { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? PlannedStartDate { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        
        public decimal EstimatedCost { get; set; }
        public decimal? ActualCost { get; set; }
        
        public int EstimatedProductionTimeMinutes { get; set; }
        public int? ActualProductionTimeMinutes { get; set; }
        
        public string? Notes { get; set; }
        
        // Navigation properties
        public ICollection<ProductionPlanMaterial> RequiredMaterials { get; set; } = new List<ProductionPlanMaterial>();
    }

    public class ProductionPlanMaterial
    {
        public int Id { get; set; }
        public int ProductionPlanId { get; set; }
        public ProductionPlan? ProductionPlan { get; set; }
        
        public int RawMaterialId { get; set; }
        public RawMaterial? RawMaterial { get; set; }
        
        public decimal RequiredQuantity { get; set; }
        public decimal? ActualQuantityUsed { get; set; }
        
        public decimal EstimatedUnitCost { get; set; }
        public decimal? ActualUnitCost { get; set; }
    }

    // DTOs
    public class ProductionPlanInfo
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        
        public int TargetProductId { get; set; }
        public string TargetProductName { get; set; } = string.Empty;
        public string TargetProductColor { get; set; } = string.Empty;
        public string TargetProductQuantityType { get; set; } = string.Empty;
        
        public decimal QuantityToProduce { get; set; }
        public ProductionPlanStatus Status { get; set; }
        
        public int CreatedByUserId { get; set; }
        public string CreatedByUserName { get; set; } = string.Empty;
        
        public int? StartedByUserId { get; set; }
        public string? StartedByUserName { get; set; }
        
        public int? CompletedByUserId { get; set; }
        public string? CompletedByUserName { get; set; }
        
        public DateTime CreatedAt { get; set; }
        public DateTime? PlannedStartDate { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        
        public decimal EstimatedCost { get; set; }
        public decimal? ActualCost { get; set; }
        
        public int EstimatedProductionTimeMinutes { get; set; }
        public int? ActualProductionTimeMinutes { get; set; }
        
        public string? Notes { get; set; }
        
        public bool CanProduce { get; set; }
        public List<string> MissingMaterials { get; set; } = new List<string>();
        
        public List<ProductionPlanMaterialInfo> RequiredMaterials { get; set; } = new List<ProductionPlanMaterialInfo>();
    }

    public class ProductionPlanMaterialInfo
    {
        public int Id { get; set; }
        public int ProductionPlanId { get; set; }
        public int RawMaterialId { get; set; }
        public string MaterialName { get; set; } = string.Empty;
        public string MaterialColor { get; set; } = string.Empty;
        public string QuantityType { get; set; } = string.Empty;
        public decimal RequiredQuantity { get; set; }
        public decimal? ActualQuantityUsed { get; set; }
        public decimal AvailableQuantity { get; set; }
        public decimal EstimatedUnitCost { get; set; }
        public decimal? ActualUnitCost { get; set; }
        public bool IsAvailable { get; set; }
    }

    public class CreateProductionPlanRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        
        // Option 1: Use existing finished product from inventory
        public int? TargetProductId { get; set; }
        
        // Option 2: Create new finished product
        public CreateFinishedProductRequest? NewFinishedProduct { get; set; }
        
        public decimal QuantityToProduce { get; set; }
        public DateTime? PlannedStartDate { get; set; }
        public int EstimatedProductionTimeMinutes { get; set; }
        public string? Notes { get; set; }
        
        public List<CreateProductionPlanMaterialRequest> RequiredMaterials { get; set; } = new List<CreateProductionPlanMaterialRequest>();
    }

    public class CreateFinishedProductRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public string QuantityType { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal MinimumStock { get; set; } = 0;
    }

    public class CreateProductionPlanMaterialRequest
    {
        public int RawMaterialId { get; set; }
        public decimal RequiredQuantity { get; set; }
    }

    public class UpdateProductionPlanRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal QuantityToProduce { get; set; }
        public DateTime? PlannedStartDate { get; set; }
        public int EstimatedProductionTimeMinutes { get; set; }
        public string? Notes { get; set; }
        public List<CreateProductionPlanMaterialRequest> RequiredMaterials { get; set; } = new List<CreateProductionPlanMaterialRequest>();
    }

    public class ExecuteProductionPlanRequest
    {
        public decimal? ActualQuantityProduced { get; set; }
        public int? ActualProductionTimeMinutes { get; set; }
        public string? Notes { get; set; }
        public List<ActualMaterialUsage>? MaterialsUsed { get; set; }
    }

    public class ActualMaterialUsage
    {
        public int RawMaterialId { get; set; }
        public decimal QuantityUsed { get; set; }
    }

    public class ProductionPlanExecutionResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public decimal QuantityProduced { get; set; }
        public decimal TotalCost { get; set; }
        public List<MaterialConsumptionInfo> MaterialsConsumed { get; set; } = new List<MaterialConsumptionInfo>();
    }

    public class MaterialConsumptionInfo
    {
        public int MaterialId { get; set; }
        public string MaterialName { get; set; } = string.Empty;
        public string MaterialColor { get; set; } = string.Empty;
        public decimal QuantityConsumed { get; set; }
        public string QuantityType { get; set; } = string.Empty;
        public decimal Cost { get; set; }
    }

    public class ProductionPlanStatistics
    {
        public int TotalPlans { get; set; }
        public int DraftPlans { get; set; }
        public int PlannedPlans { get; set; }
        public int InProgressPlans { get; set; }
        public int CompletedPlans { get; set; }
        public int CancelledPlans { get; set; }
        public decimal TotalProductionValue { get; set; }
        public decimal TotalProductionCost { get; set; }
        public int TotalUnitsProduced { get; set; }
    }
}

