namespace ProductionManagement.API.Models
{
    public class Product
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public decimal SellingPrice { get; set; }
        public int EstimatedProductionTimeMinutes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsActive { get; set; } = true;
        public List<ProductMaterial> RequiredMaterials { get; set; } = new List<ProductMaterial>();
    }

    public class ProductMaterial
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public int MaterialId { get; set; }
        public decimal RequiredQuantity { get; set; }
        public string MaterialName { get; set; } = string.Empty;
        public string MaterialColor { get; set; } = string.Empty;
        public string QuantityType { get; set; } = string.Empty;
    }

    public class ProductInfo
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public decimal SellingPrice { get; set; }
        public int EstimatedProductionTimeMinutes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool IsActive { get; set; }
        public List<ProductMaterial> RequiredMaterials { get; set; } = new List<ProductMaterial>();
        public decimal EstimatedCost { get; set; }
        public decimal EstimatedProfit { get; set; }
        public bool CanProduce { get; set; }
        public List<string> MissingMaterials { get; set; } = new List<string>();
    }

    public class CreateProductRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public decimal SellingPrice { get; set; }
        public int EstimatedProductionTimeMinutes { get; set; }
        public List<CreateProductMaterialRequest> RequiredMaterials { get; set; } = new List<CreateProductMaterialRequest>();
    }

    public class CreateProductMaterialRequest
    {
        public int MaterialId { get; set; }
        public decimal RequiredQuantity { get; set; }
    }

    public class UpdateProductRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public decimal SellingPrice { get; set; }
        public int EstimatedProductionTimeMinutes { get; set; }
        public bool IsActive { get; set; } = true;
        public List<CreateProductMaterialRequest> RequiredMaterials { get; set; } = new List<CreateProductMaterialRequest>();
    }

    public class ProduceProductRequest
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; } = 1;
        public string? Notes { get; set; }
    }

    public class ProductionResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int ProductsProduced { get; set; }
        public List<MaterialConsumption> MaterialsConsumed { get; set; } = new List<MaterialConsumption>();
        public decimal TotalCost { get; set; }
        public DateTime ProductionDate { get; set; } = DateTime.UtcNow;
    }

    public class MaterialConsumption
    {
        public int MaterialId { get; set; }
        public string MaterialName { get; set; } = string.Empty;
        public string MaterialColor { get; set; } = string.Empty;
        public decimal QuantityConsumed { get; set; }
        public string QuantityType { get; set; } = string.Empty;
        public decimal Cost { get; set; }
    }

    public class FinishedProduct
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal ProductionCost { get; set; }
        public DateTime ProducedAt { get; set; } = DateTime.UtcNow;
        public string? Notes { get; set; }
        public List<MaterialConsumption> MaterialsUsed { get; set; } = new List<MaterialConsumption>();
    }

    public class ProductionStatistics
    {
        public int TotalProducts { get; set; }
        public int ActiveProducts { get; set; }
        public int ProductsCanProduce { get; set; }
        public int TotalFinishedProducts { get; set; }
        public decimal TotalProductionValue { get; set; }
        public List<TopProduct> TopProducts { get; set; } = new List<TopProduct>();
    }

    public class TopProduct
    {
        public string Name { get; set; } = string.Empty;
        public int TotalProduced { get; set; }
        public decimal TotalValue { get; set; }
    }
}
