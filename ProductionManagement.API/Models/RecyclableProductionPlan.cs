namespace ProductionManagement.API.Models
{
    public class RecyclableProductionPlan
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        // Output raw material (what we are producing)
        public int TargetRawMaterialId { get; set; }
        public RawMaterial? TargetRawMaterial { get; set; }

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

        public ICollection<RecyclablePlanMaterial> RequiredRecyclables { get; set; } = new List<RecyclablePlanMaterial>();
    }

    public class RecyclablePlanMaterial
    {
        public int Id { get; set; }
        public int RecyclableProductionPlanId { get; set; }
        public RecyclableProductionPlan? RecyclableProductionPlan { get; set; }

        // Recyclable raw material consumed
        public int RawMaterialId { get; set; }
        public RawMaterial? RawMaterial { get; set; }

        public decimal RequiredQuantity { get; set; }
        public decimal? ActualQuantityUsed { get; set; }
    }

    public class RecyclableProductionPlanInfo
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int TargetRawMaterialId { get; set; }
        public string TargetRawMaterialName { get; set; } = string.Empty;
        public string TargetRawMaterialColor { get; set; } = string.Empty;
        public string TargetRawMaterialQuantityType { get; set; } = string.Empty;
        public decimal QuantityToProduce { get; set; }
        public ProductionPlanStatus Status { get; set; }
        public int CreatedByUserId { get; set; }
        public string? CreatedByUserName { get; set; }
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
        public List<RecyclablePlanMaterialInfo> RequiredRecyclables { get; set; } = new();
    }

    public class RecyclablePlanMaterialInfo
    {
        public int Id { get; set; }
        public int RecyclableProductionPlanId { get; set; }
        public int RawMaterialId { get; set; }
        public string MaterialName { get; set; } = string.Empty;
        public string MaterialColor { get; set; } = string.Empty;
        public string QuantityType { get; set; } = string.Empty;
        public decimal RequiredQuantity { get; set; }
        public decimal? ActualQuantityUsed { get; set; }
        public decimal AvailableQuantity { get; set; }
    }

    public class RecyclableProductionPlanPagedRequest
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? SearchTerm { get; set; }
        public ProductionPlanStatus? Status { get; set; }
        public string SortBy { get; set; } = "CreatedAt"; // name | status | createdAt
        public string SortOrder { get; set; } = "desc"; // asc | desc
    }
    public class CreateRecyclableProductionPlanRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }

        // Option 1: Use existing raw material as output
        public int? TargetRawMaterialId { get; set; }

        // Option 2: Create a new raw material as output
        public CreateRawMaterialRequest? NewRawMaterial { get; set; }

        public decimal QuantityToProduce { get; set; }
        public DateTime? PlannedStartDate { get; set; }
        public int EstimatedProductionTimeMinutes { get; set; }
        public string? Notes { get; set; }

        public List<CreateRecyclableProductionMaterialRequest> RequiredRecyclables { get; set; } = new();
    }

    public class CreateRecyclableProductionMaterialRequest
    {
        public int RawMaterialId { get; set; }
        public decimal RequiredQuantity { get; set; }
    }

    public class UpdateRecyclableProductionPlanRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal QuantityToProduce { get; set; }
        public DateTime? PlannedStartDate { get; set; }
        public int EstimatedProductionTimeMinutes { get; set; }
        public string? Notes { get; set; }
        public List<CreateRecyclableProductionMaterialRequest> RequiredRecyclables { get; set; } = new();
    }
}


