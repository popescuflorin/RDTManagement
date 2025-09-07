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
  MaterialType,
  InventoryStatistics,
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ProduceProductRequest,
  ProductionResult,
  FinishedProduct,
  ProductionStatistics
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
  getMaterial: (id: number) => api.get<RawMaterial>(`/inventory/${id}`),
  getMaterialTypes: () => api.get<MaterialType[]>('/inventory/types'),
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

export default api;
