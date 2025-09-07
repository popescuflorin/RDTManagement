export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  lastLoginAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}


export interface DashboardData {
  welcomeMessage: string;
  totalUsers: number;
  activeUsers: number;
  lastLogin: string;
  systemStatus: string;
  recentActivity: string[];
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  email: string;
}

export interface AdminRegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface AdminUpdateUserRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
}

// Inventory Management Types
export interface RawMaterial {
  id: number;
  name: string;
  color: string;
  quantity: number;
  quantityType: string;
  createdAt: string;
  updatedAt: string;
  minimumStock: number;
  unitCost: number;
  description?: string;
  isActive: boolean;
  isLowStock: boolean;
  totalValue: number;
}

export interface CreateRawMaterialRequest {
  name: string;
  color: string;
  quantity: number;
  quantityType: string;
  minimumStock: number;
  unitCost: number;
  description?: string;
}

export interface UpdateRawMaterialRequest {
  name: string;
  color: string;
  quantity: number;
  quantityType: string;
  minimumStock: number;
  unitCost: number;
  description?: string;
  isActive: boolean;
}

export interface AddToExistingMaterialRequest {
  materialId: number;
  quantityToAdd: number;
  newUnitCost?: number;
}

export interface MaterialType {
  name: string;
  color: string;
  quantityType: string;
  description?: string;
}

export interface InventoryStatistics {
  totalMaterials: number;
  lowStockCount: number;
  totalInventoryValue: number;
  mostStockedMaterials: Array<{
    name: string;
    color: string;
    quantity: number;
    quantityType: string;
  }>;
}

// Production Management Types
export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  sellingPrice: number;
  estimatedProductionTimeMinutes: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  requiredMaterials: ProductMaterial[];
  estimatedCost: number;
  estimatedProfit: number;
  canProduce: boolean;
  missingMaterials: string[];
}

export interface ProductMaterial {
  id: number;
  productId: number;
  materialId: number;
  requiredQuantity: number;
  materialName: string;
  materialColor: string;
  quantityType: string;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  category: string;
  sellingPrice: number;
  estimatedProductionTimeMinutes: number;
  requiredMaterials: CreateProductMaterialRequest[];
}

export interface CreateProductMaterialRequest {
  materialId: number;
  requiredQuantity: number;
}

export interface UpdateProductRequest {
  name: string;
  description: string;
  category: string;
  sellingPrice: number;
  estimatedProductionTimeMinutes: number;
  isActive: boolean;
  requiredMaterials: CreateProductMaterialRequest[];
}

export interface ProduceProductRequest {
  productId: number;
  quantity: number;
  notes?: string;
}

export interface ProductionResult {
  success: boolean;
  message: string;
  productsProduced: number;
  materialsConsumed: MaterialConsumption[];
  totalCost: number;
  productionDate: string;
}

export interface MaterialConsumption {
  materialId: number;
  materialName: string;
  materialColor: string;
  quantityConsumed: number;
  quantityType: string;
  cost: number;
}

export interface FinishedProduct {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  productionCost: number;
  producedAt: string;
  notes?: string;
  materialsUsed: MaterialConsumption[];
}

export interface ProductionStatistics {
  totalProducts: number;
  activeProducts: number;
  productsCanProduce: number;
  totalFinishedProducts: number;
  totalProductionValue: number;
  topProducts: TopProduct[];
}

export interface TopProduct {
  name: string;
  totalProduced: number;
  totalValue: number;
}
