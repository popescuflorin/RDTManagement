import axios from 'axios';
import type { 
  LoginRequest, 
  LoginResponse, 
  User, 
  DashboardData, 
  UpdateProfileRequest, 
  AdminRegisterRequest, 
  AdminUpdateUserRequest,
  RawMaterial,
  CreateRawMaterialRequest,
  UpdateRawMaterialRequest,
  AddToExistingMaterialRequest,
  InventoryStatistics,
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ProduceProductRequest,
  ProductionResult,
  FinishedProduct,
  ProductionStatistics,
  ProductionPlan,
  CreateProductionPlanRequest,
  UpdateProductionPlanRequest,
  CreateRecyclableProductionPlanRequest,
  ExecuteProductionPlanRequest,
  ProductionPlanExecutionResult,
  ProductionPlanStatistics,
  RecyclableProductionPlan,
  RecyclableProductionPlanPagedRequest,
  UpdateRecyclableProductionPlanRequest,
  Acquisition,
  AcquisitionStatistics,
  AcquisitionPagedRequest,
  PagedResult,
  CreateAcquisitionRequest,
  UpdateAcquisitionRequest,
  ReceiveAcquisitionRequest,
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  SupplierStatistics,
  Transport,
  CreateTransportRequest,
  UpdateTransportRequest,
  ProductTemplate,
  UpdateProductTemplateRequest,
  Order,
  CreateOrderRequest,
  UpdateOrderRequest,
  OrderStatistics,
  Client,
  CreateClientRequest,
  UpdateClientRequest,
  ClientStatistics,
  RolePermissions,
  UpdateRolePermissionsRequest,
  PermissionInfo,
  RoleDto,
  CreateRoleRequest
} from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Utility function to clear all authentication data
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

// Utility function to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return token !== null && user !== null;
};

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle authentication errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        try {
          // Try to refresh the token
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { 
            refreshToken 
          }, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          const { token, refreshToken: newRefreshToken, user } = response.data;
          
          // Store new tokens and user data
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', newRefreshToken);
          if (user) {
            localStorage.setItem('user', JSON.stringify(user));
          }
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api.request(originalRequest);
        } catch (refreshError) {
          // Refresh token failed or expired
          console.error('Token refresh failed:', refreshError);
          clearAuthData();
          
          // Redirect to login page
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available
        clearAuthData();
        
        // Redirect to login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }

    // Handle other 401 errors (after retry failed)
    if (error.response?.status === 401) {
      clearAuthData();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (credentials: LoginRequest) => api.post<LoginResponse>('/auth/login', credentials),
  adminRegister: (userData: AdminRegisterRequest) => api.post<User>('/auth/admin/register', userData),
  logout: (refreshToken: string) => api.post('/auth/logout', refreshToken),
  refresh: (refreshToken: string) => api.post<LoginResponse>('/auth/refresh', refreshToken),
  debugClaims: () => api.get('/auth/debug/claims'),
};

// User API
export const userApi = {
  getProfile: () => api.get<User>('/user/profile'),
  updateProfile: (userData: UpdateProfileRequest) => api.put<User>('/user/profile', userData),
  getDashboard: () => api.get<DashboardData>('/user/dashboard'),
  getAllUsers: () => api.get<User[]>('/user/all'),
  updateUser: (id: number, userData: AdminUpdateUserRequest) => api.put<User>(`/user/${id}`, userData),
  deleteUser: (id: number) => api.delete(`/user/${id}`),
};

// Inventory API
export const inventoryApi = {
  getAllMaterials: () => api.get<RawMaterial[]>('/inventory'),
  getAllMaterialsIncludingInactive: () => api.get<RawMaterial[]>('/inventory/all-including-inactive'),
  getMaterialsPaged: (params: import('../types').RawMaterialPagedRequest) => 
    api.get<PagedResult<RawMaterial>>('/inventory/paged', { params }),
  getMaterial: (id: number) => api.get<RawMaterial>(`/inventory/${id}`),
  getMaterialTypes: () => api.get<import('../types').MaterialTypeInfo[]>('/inventory/types'),
  getLowStockMaterials: () => api.get<RawMaterial[]>('/inventory/low-stock'),
  getStatistics: () => api.get<InventoryStatistics>('/inventory/statistics'),
  createMaterial: (materialData: CreateRawMaterialRequest) => api.post<RawMaterial>('/inventory', materialData),
  addToExisting: (addData: AddToExistingMaterialRequest) => api.post<RawMaterial>('/inventory/add-to-existing', addData),
  updateMaterial: (id: number, materialData: UpdateRawMaterialRequest) => api.put<RawMaterial>(`/inventory/${id}`, materialData),
  deleteMaterial: (id: number) => api.delete(`/inventory/${id}`),
};

// Production API
export const productionApi = {
  getAllProducts: () => api.get<Product[]>('/production'),
  getProduct: (id: number) => api.get<Product>(`/production/${id}`),
  getFinishedProducts: () => api.get<FinishedProduct[]>('/production/finished'),
  getStatistics: () => api.get<ProductionStatistics>('/production/statistics'),
  createProduct: (productData: CreateProductRequest) => api.post<Product>('/production', productData),
  updateProduct: (id: number, productData: UpdateProductRequest) => api.put<Product>(`/production/${id}`, productData),
  deleteProduct: (id: number) => api.delete(`/production/${id}`),
  produceProduct: (productionData: ProduceProductRequest) => api.post<ProductionResult>('/production/produce', productionData),
};

// Production Plan API
export const productionPlanApi = {
  getAllPlans: () => api.get<ProductionPlan[]>('/productionplan'),
  getPlansPaged: (params: import('../types').ProductionPlanPagedRequest) => 
    api.get<PagedResult<ProductionPlan>>('/productionplan/paged', { params }),
  getRecyclablePlansPaged: (params: RecyclableProductionPlanPagedRequest) =>
    api.get<PagedResult<RecyclableProductionPlan>>('/productionplan/recyclable/paged', { params }),
  updateRecyclablePlan: (id: number, data: UpdateRecyclableProductionPlanRequest) =>
    api.put<RecyclableProductionPlan>(`/productionplan/recyclable/${id}`, data),
  cancelRecyclablePlan: (id: number) =>
    api.post<RecyclableProductionPlan>(`/productionplan/recyclable/${id}/cancel`, {}),
  executeRecyclablePlan: (id: number) =>
    api.post(`/productionplan/recyclable/${id}/execute`, {}),
  getPlan: (id: number) => api.get<ProductionPlan>(`/productionplan/${id}`),
  getStatistics: () => api.get<ProductionPlanStatistics>('/productionplan/statistics'),
  getProductTemplate: (finishedProductId: number) => api.get<ProductTemplate>(`/productionplan/template/${finishedProductId}`),
  updateProductTemplate: (finishedProductId: number, templateData: UpdateProductTemplateRequest) => api.put<ProductTemplate>(`/productionplan/template/${finishedProductId}`, templateData),
  createPlan: (planData: CreateProductionPlanRequest) => api.post<ProductionPlan>('/productionplan', planData),
  createRecyclablePlan: (planData: CreateRecyclableProductionPlanRequest) => api.post<ProductionPlan>('/productionplan/recyclable', planData),
  updatePlan: (id: number, planData: UpdateProductionPlanRequest) => api.put<ProductionPlan>(`/productionplan/${id}`, planData),
  deletePlan: (id: number) => api.delete(`/productionplan/${id}`),
  executePlan: (id: number, executionData: ExecuteProductionPlanRequest) => api.post<ProductionPlanExecutionResult>(`/productionplan/${id}/execute`, executionData),
  startPlan: (id: number) => api.post<ProductionPlan>(`/productionplan/${id}/start`, {}),
  cancelPlan: (id: number) => api.post<ProductionPlan>(`/productionplan/${id}/cancel`, {}),
};

// Acquisition API
export const acquisitionApi = {
  getAllAcquisitions: () => api.get<Acquisition[]>('/acquisition'),
  getAcquisitionsPaged: (params: AcquisitionPagedRequest) => api.get<PagedResult<Acquisition>>('/acquisition/paged', { params }),
  getAcquisition: (id: number) => api.get<Acquisition>(`/acquisition/${id}`),
  getStatistics: () => api.get<AcquisitionStatistics>('/acquisition/statistics'),
  createAcquisition: (acquisitionData: CreateAcquisitionRequest) => api.post<Acquisition>('/acquisition', acquisitionData),
  updateAcquisition: (id: number, acquisitionData: UpdateAcquisitionRequest) => api.put<Acquisition>(`/acquisition/${id}`, acquisitionData),
  deleteAcquisition: (id: number) => api.delete(`/acquisition/${id}`),
  cancelAcquisition: (id: number) => api.post<Acquisition>(`/acquisition/${id}/cancel`),
  receiveAcquisition: (id: number, receiveData: ReceiveAcquisitionRequest) => api.post<Acquisition>(`/acquisition/${id}/receive`, receiveData),
  processAcquisition: (id: number, processData: any) => api.post<Acquisition>(`/acquisition/${id}/process`, processData),
};

// Supplier API
export const supplierApi = {
  getAllSuppliers: () => api.get<Supplier[]>('/supplier'),
  getSupplier: (id: number) => api.get<Supplier>(`/supplier/${id}`),
  getStatistics: () => api.get<SupplierStatistics>('/supplier/statistics'),
  createSupplier: (supplierData: CreateSupplierRequest) => api.post<Supplier>('/supplier', supplierData),
  updateSupplier: (id: number, supplierData: UpdateSupplierRequest) => api.put<Supplier>(`/supplier/${id}`, supplierData),
  deleteSupplier: (id: number) => api.delete(`/supplier/${id}`),
};

// Transport API
export const transportApi = {
  getAllTransports: () => api.get<Transport[]>('/transport'),
  getTransport: (id: number) => api.get<Transport>(`/transport/${id}`),
  getTransportByCarName: (carName: string) => api.get<Transport>(`/transport/by-car-name/${encodeURIComponent(carName)}`),
  searchTransports: (searchTerm: string) => api.get<Transport[]>(`/transport/search?searchTerm=${encodeURIComponent(searchTerm)}`),
  createTransport: (transportData: CreateTransportRequest) => api.post<Transport>('/transport', transportData),
  updateTransport: (id: number, transportData: UpdateTransportRequest) => api.put<Transport>(`/transport/${id}`, transportData),
  deleteTransport: (id: number) => api.delete(`/transport/${id}`),
};

// Order API
export const orderApi = {
  getAllOrders: () => api.get<Order[]>('/order'),
  getOrdersPaged: (params: import('../types').OrderPagedRequest) => 
    api.get<PagedResult<Order>>('/order/paged', { params }),
  getOrder: (id: number) => api.get<Order>(`/order/${id}`),
  getStatistics: () => api.get<OrderStatistics>('/order/statistics'),
  createOrder: (orderData: CreateOrderRequest) => api.post<Order>('/order', orderData),
  updateOrder: (id: number, orderData: UpdateOrderRequest) => api.put<Order>(`/order/${id}`, orderData),
  processOrder: (id: number) => api.post<Order>(`/order/${id}/process`, {}),
  cancelOrder: (id: number) => api.post<Order>(`/order/${id}/cancel`, {}),
  deleteOrder: (id: number) => api.delete(`/order/${id}`),
};

export const rolePermissionApi = {
  getAllPermissions: () => api.get<Record<string, PermissionInfo[]>>('/rolepermission/permissions'),
  getAllRoles: () => api.get<RoleDto[]>('/rolepermission/roles'),
  getRolePermissions: (role: string) => api.get<RolePermissions>(`/rolepermission/${role}`),
  updateRolePermissions: (role: string, data: UpdateRolePermissionsRequest) => api.put<RolePermissions>(`/rolepermission/${role}`, data),
  createRole: (data: CreateRoleRequest) => api.post<RoleDto>('/rolepermission/roles', data),
  deleteRole: (roleId: number) => api.delete(`/rolepermission/roles/${roleId}`),
  seedDefaultPermissions: () => api.post('/rolepermission/seed', {}),
};

// Client API
export const clientApi = {
  getAllClients: () => api.get<Client[]>('/client'),
  getClient: (id: number) => api.get<Client>(`/client/${id}`),
  getStatistics: () => api.get<ClientStatistics>('/client/statistics'),
  createClient: (clientData: CreateClientRequest) => api.post<Client>('/client', clientData),
  updateClient: (id: number, clientData: UpdateClientRequest) => api.put<Client>(`/client/${id}`, clientData),
  deleteClient: (id: number) => api.delete(`/client/${id}`),
};

export default api;
