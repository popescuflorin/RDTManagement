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
  ExecuteProductionPlanRequest,
  ProductionPlanExecutionResult,
  ProductionPlanStatistics,
  Acquisition,
  AcquisitionStatistics,
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
  OrderStatistics
} from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401 responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, refreshToken);
          const { token, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          // Retry the original request
          error.config.headers.Authorization = `Bearer ${token}`;
          return api.request(error.config);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      } else {
        // No refresh token, redirect to login
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
  getPlan: (id: number) => api.get<ProductionPlan>(`/productionplan/${id}`),
  getStatistics: () => api.get<ProductionPlanStatistics>('/productionplan/statistics'),
  getProductTemplate: (finishedProductId: number) => api.get<ProductTemplate>(`/productionplan/template/${finishedProductId}`),
  updateProductTemplate: (finishedProductId: number, templateData: UpdateProductTemplateRequest) => api.put<ProductTemplate>(`/productionplan/template/${finishedProductId}`, templateData),
  createPlan: (planData: CreateProductionPlanRequest) => api.post<ProductionPlan>('/productionplan', planData),
  updatePlan: (id: number, planData: UpdateProductionPlanRequest) => api.put<ProductionPlan>(`/productionplan/${id}`, planData),
  deletePlan: (id: number) => api.delete(`/productionplan/${id}`),
  executePlan: (id: number, executionData: ExecuteProductionPlanRequest) => api.post<ProductionPlanExecutionResult>(`/productionplan/${id}/execute`, executionData),
  startPlan: (id: number) => api.post<ProductionPlan>(`/productionplan/${id}/start`, {}),
  cancelPlan: (id: number) => api.post<ProductionPlan>(`/productionplan/${id}/cancel`, {}),
};

// Acquisition API
export const acquisitionApi = {
  getAllAcquisitions: () => api.get<Acquisition[]>('/acquisition'),
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
  getOrder: (id: number) => api.get<Order>(`/order/${id}`),
  getStatistics: () => api.get<OrderStatistics>('/order/statistics'),
  createOrder: (orderData: CreateOrderRequest) => api.post<Order>('/order', orderData),
  updateOrder: (id: number, orderData: UpdateOrderRequest) => api.put<Order>(`/order/${id}`, orderData),
  processOrder: (id: number) => api.post<Order>(`/order/${id}/process`, {}),
  cancelOrder: (id: number) => api.post<Order>(`/order/${id}/cancel`, {}),
  deleteOrder: (id: number) => api.delete(`/order/${id}`),
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
