namespace ProductionManagement.API.Models
{
    public enum MaterialType
    {
        RawMaterial = 0,
        RecyclableMaterial = 1,
        FinishedProduct = 2
    }

    public class RawMaterial
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public MaterialType Type { get; set; } = MaterialType.RawMaterial;
        public decimal Quantity { get; set; }
        public string QuantityType { get; set; } = string.Empty; // kg, liters, pieces, etc.
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public decimal MinimumStock { get; set; } = 0;
        public decimal UnitCost { get; set; } = 0;
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class RawMaterialInfo
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public MaterialType Type { get; set; }
        public decimal Quantity { get; set; }
        public string QuantityType { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public decimal MinimumStock { get; set; }
        public decimal UnitCost { get; set; }
        public string? Description { get; set; }
        public bool IsActive { get; set; }
        public bool IsLowStock => Quantity <= MinimumStock;
        public decimal TotalValue => Quantity * UnitCost;
    }

    public class CreateRawMaterialRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public MaterialType Type { get; set; } = MaterialType.RawMaterial;
        public decimal Quantity { get; set; }
        public string QuantityType { get; set; } = string.Empty;
        public decimal MinimumStock { get; set; } = 0;
        public decimal UnitCost { get; set; } = 0;
        public string? Description { get; set; }
    }

    public class UpdateRawMaterialRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public MaterialType Type { get; set; }
        public decimal Quantity { get; set; }
        public string QuantityType { get; set; } = string.Empty;
        public decimal MinimumStock { get; set; } = 0;
        public decimal UnitCost { get; set; } = 0;
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class AddToExistingMaterialRequest
    {
        public int MaterialId { get; set; }
        public decimal QuantityToAdd { get; set; }
        public decimal? NewUnitCost { get; set; }
    }

    public class MaterialTypeInfo
    {
        public string Name { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public string QuantityType { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}
