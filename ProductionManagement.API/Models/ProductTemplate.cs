namespace ProductionManagement.API.Models
{
    // Template for production - stores the "recipe" for each finished product
    public class ProductTemplate
    {
        public int Id { get; set; }
        public int FinishedProductId { get; set; } // Links to RawMaterial with Type = FinishedProduct
        public RawMaterial? FinishedProduct { get; set; }
        public int EstimatedProductionTimeMinutes { get; set; } = 60;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public ICollection<ProductTemplateMaterial> RequiredMaterials { get; set; } = new List<ProductTemplateMaterial>();
    }

    public class ProductTemplateMaterial
    {
        public int Id { get; set; }
        public int ProductTemplateId { get; set; }
        public ProductTemplate? ProductTemplate { get; set; }
        public int RawMaterialId { get; set; }
        public RawMaterial? RawMaterial { get; set; }
        public decimal RequiredQuantity { get; set; }
    }

    // DTOs
    public class ProductTemplateInfo
    {
        public int Id { get; set; }
        public int FinishedProductId { get; set; }
        public string FinishedProductName { get; set; } = string.Empty;
        public string FinishedProductColor { get; set; } = string.Empty;
        public int EstimatedProductionTimeMinutes { get; set; }
        public List<ProductTemplateMaterialInfo> RequiredMaterials { get; set; } = new List<ProductTemplateMaterialInfo>();
    }

    public class ProductTemplateMaterialInfo
    {
        public int Id { get; set; }
        public int RawMaterialId { get; set; }
        public string MaterialName { get; set; } = string.Empty;
        public string MaterialColor { get; set; } = string.Empty;
        public string QuantityType { get; set; } = string.Empty;
        public decimal RequiredQuantity { get; set; }
        public decimal AvailableQuantity { get; set; }
        public decimal UnitCost { get; set; }
    }

    public class UpdateProductTemplateRequest
    {
        public int EstimatedProductionTimeMinutes { get; set; }
        public List<CreateProductTemplateMaterialRequest> RequiredMaterials { get; set; } = new List<CreateProductTemplateMaterialRequest>();
    }

    public class CreateProductTemplateMaterialRequest
    {
        public int RawMaterialId { get; set; }
        public decimal RequiredQuantity { get; set; }
    }
}

