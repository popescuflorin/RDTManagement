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

// Acquisition Types
export const AcquisitionType = {
  RawMaterials: 0,
  RecyclableMaterials: 1
} as const;

export type AcquisitionType = typeof AcquisitionType[keyof typeof AcquisitionType];

export const AcquisitionStatus = {
  Draft: 0,
  Received: 1,
  Cancelled: 2
} as const;

export type AcquisitionStatus = typeof AcquisitionStatus[keyof typeof AcquisitionStatus];

export interface Acquisition {
  id: number;
  title: string;
  description: string;
  type: AcquisitionType;
  status: AcquisitionStatus;
  createdAt: string;
  updatedAt?: string;
  receivedAt?: string;
  createdByUserId: number;
  createdByUserName: string;
  receivedByUserId?: number;
  receivedByUserName?: string;
  supplierId?: number;
  supplierName?: string;
  supplierContact?: string;
  notes?: string;
  dueDate?: string;
  // Transport details
  transportCarName?: string;
  transportPhoneNumber?: string;
  transportDate?: string;
  transportNotes?: string;
  totalEstimatedCost: number;
  totalActualCost: number;
  totalItems: number;
  totalQuantity: number;
  canEdit: boolean;
  canDelete: boolean;
  canReceive: boolean;
  items: AcquisitionItem[];
}

export interface AcquisitionItem {
  id: number;
  acquisitionId: number;
  rawMaterialId: number;
  rawMaterialName: string;
  rawMaterialColor: string;
  quantity: number;
  quantityType: string;
  actualUnitCost?: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  estimatedTotalCost: number;
  actualTotalCost: number;
}

export interface CreateAcquisitionRequest {
  title: string;
  description: string;
  type: AcquisitionType;
  supplierId?: number;
  supplierContact?: string;
  notes?: string;
  dueDate?: string;
  // Transport details
  transportCarName?: string;
  transportPhoneNumber?: string;
  transportDate?: string;
  transportNotes?: string;
  items: CreateAcquisitionItemRequest[];
}

export interface CreateAcquisitionItemRequest {
  rawMaterialId: number;
  name: string;
  color: string;
  quantity: number;
  quantityType: string;
  description?: string;
  notes?: string;
}

export interface UpdateAcquisitionRequest {
  title: string;
  description: string;
  supplierId?: number;
  supplierContact?: string;
  notes?: string;
  dueDate?: string;
  // Transport details
  transportCarName?: string;
  transportPhoneNumber?: string;
  transportDate?: string;
  transportNotes?: string;
  items: UpdateAcquisitionItemRequest[];
}

export interface UpdateAcquisitionItemRequest {
  id?: number; // null for new items
  rawMaterialId: number;
  name: string;
  color: string;
  quantity: number;
  quantityType: string;
  description?: string;
  notes?: string;
}

export interface ReceiveAcquisitionRequest {
  items: ReceiveAcquisitionItemRequest[];
}

export interface ReceiveAcquisitionItemRequest {
  acquisitionItemId: number;
  actualUnitCost?: number;
}

export interface AcquisitionStatistics {
  totalAcquisitions: number;
  draftAcquisitions: number;
  receivedAcquisitions: number;
  cancelledAcquisitions: number;
  totalEstimatedCost: number;
  totalActualCost: number;
  totalItems: number;
  totalQuantity: number;
}

// Supplier Types
export interface Supplier {
  id: number;
  name: string;
  description?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  taxId?: string;
  registrationNumber?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  createdByUserName: string;
  totalAcquisitions: number;
  totalAcquisitionValue: number;
  lastAcquisitionDate?: string;
}

export interface CreateSupplierRequest {
  name: string;
  description?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  taxId?: string;
  registrationNumber?: string;
  notes?: string;
}

export interface UpdateSupplierRequest {
  name: string;
  description?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  taxId?: string;
  registrationNumber?: string;
  notes?: string;
  isActive: boolean;
}

export interface SupplierStatistics {
  totalSuppliers: number;
  activeSuppliers: number;
  inactiveSuppliers: number;
  totalAcquisitionValue: number;
  totalAcquisitions: number;
  topSupplierByValue?: Supplier;
  topSupplierByCount?: Supplier;
}
