export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  lastLoginAt: string;
  isActive: boolean;
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
export const MaterialType = {
  RawMaterial: 0,
  RecyclableMaterial: 1,
  FinishedProduct: 2
} as const;

export type MaterialType = typeof MaterialType[keyof typeof MaterialType];

export interface RawMaterial {
  id: number;
  name: string;
  color: string;
  type: MaterialType;
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
  type: MaterialType;
  quantity: number;
  quantityType: string;
  minimumStock: number;
  unitCost: number;
  description?: string;
}

export interface UpdateRawMaterialRequest {
  name: string;
  color: string;
  type: MaterialType;
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

export interface MaterialTypeInfo {
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
  Cancelled: 2,
  ReadyForProcessing: 3
} as const;

export type AcquisitionStatus = typeof AcquisitionStatus[keyof typeof AcquisitionStatus];

// Transport Types
export interface Transport {
  id: number;
  carName: string;
  phoneNumber: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTransportRequest {
  carName: string;
  phoneNumber: string;
}

export interface UpdateTransportRequest {
  carName: string;
  phoneNumber: string;
}

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
  assignedToUserId?: number;
  assignedToUserName?: string;
  supplierId?: number;
  supplierName?: string;
  supplierContact?: string;
  notes?: string;
  dueDate?: string;
  // Transport details
  transportId?: number;
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
  processedMaterials: ProcessedMaterial[];
  history: AcquisitionHistory[];
}

export interface AcquisitionHistory {
  id: number;
  acquisitionId: number;
  userId: number;
  userName: string;
  action: string;
  timestamp: string;
  changes?: string;
  notes?: string;
}

export interface ProcessedMaterial {
  id: number;
  acquisitionId: number;
  acquisitionItemId: number;
  rawMaterialId: number;
  rawMaterialName: string;
  rawMaterialColor: string;
  rawMaterialQuantityType: string;
  quantity: number;
  createdAt: string;
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
  assignedToUserId?: number;
  supplierId?: number;
  supplierContact?: string;
  notes?: string;
  dueDate?: string;
  // Transport details
  transportId?: number;
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
  assignedToUserId?: number;
  supplierId?: number;
  supplierContact?: string;
  notes?: string;
  dueDate?: string;
  // Transport details
  transportId?: number;
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
  receivedQuantity: number;
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

// Production Plan Types
export const ProductionPlanStatus = {
  Draft: 0,
  Planned: 1,
  InProgress: 2,
  Completed: 3,
  Cancelled: 4
} as const;

export type ProductionPlanStatus = typeof ProductionPlanStatus[keyof typeof ProductionPlanStatus];

export interface ProductionPlan {
  id: number;
  name: string;
  description: string;
  targetProductId: number;
  targetProductName: string;
  targetProductColor: string;
  targetProductQuantityType: string;
  quantityToProduce: number;
  status: ProductionPlanStatus;
  createdByUserId: number;
  createdByUserName: string;
  startedByUserId?: number;
  startedByUserName?: string;
  completedByUserId?: number;
  completedByUserName?: string;
  createdAt: string;
  plannedStartDate?: string;
  startedAt?: string;
  completedAt?: string;
  estimatedCost: number;
  actualCost?: number;
  estimatedProductionTimeMinutes: number;
  actualProductionTimeMinutes?: number;
  notes?: string;
  canProduce: boolean;
  missingMaterials: string[];
  requiredMaterials: ProductionPlanMaterial[];
}

export interface ProductionPlanMaterial {
  id: number;
  productionPlanId: number;
  rawMaterialId: number;
  materialName: string;
  materialColor: string;
  quantityType: string;
  requiredQuantity: number;
  actualQuantityUsed?: number;
  availableQuantity: number;
  estimatedUnitCost: number;
  actualUnitCost?: number;
  isAvailable: boolean;
}

export interface CreateProductionPlanRequest {
  name: string;
  description: string;
  targetProductId?: number;
  newFinishedProduct?: CreateFinishedProductRequest;
  quantityToProduce: number;
  plannedStartDate?: string;
  estimatedProductionTimeMinutes: number;
  notes?: string;
  requiredMaterials: CreateProductionPlanMaterialRequest[];
}

export interface CreateFinishedProductRequest {
  name: string;
  color: string;
  quantityType: string;
  description?: string;
  minimumStock: number;
}

export interface CreateProductionPlanMaterialRequest {
  rawMaterialId: number;
  requiredQuantity: number;
}

export interface UpdateProductionPlanRequest {
  name: string;
  description: string;
  quantityToProduce: number;
  plannedStartDate?: string;
  estimatedProductionTimeMinutes: number;
  notes?: string;
  requiredMaterials: CreateProductionPlanMaterialRequest[];
}

export interface ExecuteProductionPlanRequest {
  actualQuantityProduced?: number;
  actualProductionTimeMinutes?: number;
  notes?: string;
  materialsUsed?: ActualMaterialUsage[];
}

export interface ActualMaterialUsage {
  rawMaterialId: number;
  quantityUsed: number;
}

export interface ProductionPlanExecutionResult {
  success: boolean;
  message: string;
  quantityProduced: number;
  totalCost: number;
  materialsConsumed: MaterialConsumptionResult[];
}

export interface MaterialConsumptionResult {
  materialId: number;
  materialName: string;
  materialColor: string;
  quantityConsumed: number;
  quantityType: string;
  cost: number;
}

export interface ProductionPlanStatistics {
  totalPlans: number;
  draftPlans: number;
  plannedPlans: number;
  inProgressPlans: number;
  completedPlans: number;
  cancelledPlans: number;
  totalProductionValue: number;
  totalProductionCost: number;
  totalUnitsProduced: number;
}

// Product Template Types
export interface ProductTemplate {
  id: number;
  finishedProductId: number;
  finishedProductName: string;
  finishedProductColor: string;
  estimatedProductionTimeMinutes: number;
  requiredMaterials: ProductTemplateMaterial[];
}

export interface ProductTemplateMaterial {
  id: number;
  rawMaterialId: number;
  materialName: string;
  materialColor: string;
  quantityType: string;
  requiredQuantity: number;
  availableQuantity: number;
  unitCost: number;
}

export interface UpdateProductTemplateRequest {
  estimatedProductionTimeMinutes: number;
  requiredMaterials: CreateProductTemplateMaterialRequest[];
}

export interface CreateProductTemplateMaterialRequest {
  rawMaterialId: number;
  requiredQuantity: number;
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

// Order Types
export const OrderStatus = {
  Draft: 0,
  Pending: 1,
  Processing: 2,
  Shipped: 3,
  Delivered: 4,
  Cancelled: 5
} as const;

export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];

export interface Order {
  id: number;
  clientId: number;
  clientName: string;
  clientContactPerson?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  clientCity?: string;
  clientPostalCode?: string;
  clientCountry?: string;
  description?: string;
  notes?: string;
  status: OrderStatus;
  statusLabel: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  deliveryDate?: string;
  transportId?: number;
  transportCarName?: string;
  transportPhoneNumber?: string;
  transportDate?: string;
  transportNotes?: string;
  createdByUserName: string;
  createdAt: string;
  updatedAt?: string;
  orderMaterials: OrderMaterial[];
  totalValue: number;
}

export interface OrderMaterial {
  id: number;
  orderId: number;
  rawMaterialId: number;
  materialName: string;
  materialColor: string;
  quantityType: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CreateOrderRequest {
  clientId: number;
  description?: string;
  notes?: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  transportId?: number;
  transportDate?: string;
  transportNotes?: string;
  orderMaterials: CreateOrderMaterialRequest[];
}

export interface CreateOrderMaterialRequest {
  rawMaterialId: number;
  quantity: number;
}

export interface UpdateOrderRequest {
  clientId?: number;
  description?: string;
  notes?: string;
  status?: OrderStatus;
  orderDate?: string;
  expectedDeliveryDate?: string;
  transportId?: number;
  transportDate?: string;
  transportNotes?: string;
  orderMaterials?: CreateOrderMaterialRequest[];
}

export interface OrderStatistics {
  totalOrders: number;
  draftOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  totalOrderValue: number;
}

// Client Types
export interface Client {
  id: number;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  createdByUserName: string;
  totalOrders: number;
  totalOrderValue: number;
  lastOrderDate?: string;
}

export interface CreateClientRequest {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
}

export interface UpdateClientRequest {
  name?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
  isActive?: boolean;
}

export interface ClientStatistics {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  totalOrderValue: number;
  totalOrders: number;
  topClientByValue?: Client;
  topClientByCount?: Client;
}
