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
