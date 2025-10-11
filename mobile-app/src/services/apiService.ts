import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config/constants';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ApiService {
  private api: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-App-Platform': 'mobile',
        'X-App-Version': '1.0.0',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Avoid multiple refresh attempts
            if (!this.refreshPromise) {
              this.refreshPromise = this.refreshToken();
            }

            const newToken = await this.refreshPromise;
            this.refreshPromise = null;

            // Update the failed request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }

            return this.api(originalRequest);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            await SecureStore.deleteItemAsync('authToken');
            await SecureStore.deleteItemAsync('refreshToken');
            await SecureStore.deleteItemAsync('userData');

            // You might want to emit an event or call a global auth handler here
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshToken(): Promise<string> {
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken,
    });

    const { token, refreshToken: newRefreshToken } = response.data;

    // Store new tokens
    await SecureStore.setItemAsync('authToken', token);
    await SecureStore.setItemAsync('refreshToken', newRefreshToken);

    return token;
  }

  // GET request
  async get<T = any>(endpoint: string, params?: object): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.api.get(endpoint, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // POST request
  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.api.post(endpoint, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // PUT request
  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.api.put(endpoint, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // DELETE request
  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.api.delete(endpoint);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // PATCH request
  async patch<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.api.patch(endpoint, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // File upload
  async uploadFile<T = any>(
    endpoint: string,
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            onProgress(progress);
          }
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Download file
  async downloadFile(endpoint: string, filename: string): Promise<string> {
    try {
      const response = await this.api.get(endpoint, {
        responseType: 'blob',
      });

      // Handle file download in React Native
      // This would typically involve using expo-file-system
      // Return the local file path
      return filename; // Placeholder
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Paginated request
  async getPaginated<T = any>(
    endpoint: string,
    page: number = 1,
    limit: number = 20,
    params?: object
  ): Promise<PaginatedResponse<T>> {
    try {
      const response = await this.get<T[]>(endpoint, {
        page,
        limit,
        ...params,
      });

      // Assuming the API returns pagination info in headers or response
      return response as PaginatedResponse<T>;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handler
  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.error || error.response.data?.message || 'Server error';
      return new Error(message);
    } else if (error.request) {
      // Network error
      return new Error('Network error. Please check your connection.');
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred');
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health');
      return true;
    } catch (error) {
      return false;
    }
  }

  // Set custom headers
  setHeader(name: string, value: string) {
    this.api.defaults.headers.common[name] = value;
  }

  // Remove custom headers
  removeHeader(name: string) {
    delete this.api.defaults.headers.common[name];
  }

  // Get current token
  async getCurrentToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('authToken');
  }

  // Cancel all pending requests
  cancelAllRequests() {
    // Implementation depends on how you want to handle this
    // You could keep track of all ongoing requests and cancel them
  }
}

// Create and export singleton instance
export const apiService = new ApiService();

// API endpoints constants
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    SIGN_IN: '/customer/auth/signin',
    SIGN_UP: '/customer/auth/register',
    SIGN_OUT: '/customer/auth/signout',
    REFRESH: '/customer/auth/refresh',
    VERIFY_EMAIL: '/customer/auth/verify-email',
    FORGOT_PASSWORD: '/customer/auth/forgot-password',
    RESET_PASSWORD: '/customer/auth/reset-password',
  },

  // Customer Profile
  CUSTOMER: {
    PROFILE: '/customer/profile',
    PREFERENCES: '/customer/preferences',
    ADDRESSES: '/customer/addresses',
    DOCUMENTS: '/customer/documents',
    NOTIFICATIONS: '/customer/notifications',
  },

  // Vehicles
  VEHICLES: {
    LIST: '/customer/vehicles',
    DETAIL: (id: string) => `/customer/vehicles/${id}`,
    ADD: '/customer/vehicles',
    UPDATE: (id: string) => `/customer/vehicles/${id}`,
    DELETE: (id: string) => `/customer/vehicles/${id}`,
    HISTORY: (id: string) => `/customer/vehicles/${id}/history`,
    VALUATION: (id: string) => `/customer/vehicles/${id}/valuation`,
    OBD_DATA: (id: string) => `/customer/vehicles/${id}/obd-data`,
  },

  // Service
  SERVICE: {
    APPOINTMENTS: '/customer/service/appointments',
    APPOINTMENT: (id: string) => `/customer/service/appointments/${id}`,
    HISTORY: '/customer/service/history',
    SCHEDULE: '/customer/service/schedule',
    CANCEL: (id: string) => `/customer/service/appointments/${id}/cancel`,
    RESCHEDULE: (id: string) => `/customer/service/appointments/${id}/reschedule`,
    AVAILABLE_SLOTS: '/customer/service/available-slots',
  },

  // Documents
  DOCUMENTS: {
    LIST: '/customer/documents',
    UPLOAD: '/customer/documents/upload',
    DOWNLOAD: (id: string) => `/customer/documents/${id}/download`,
    DELETE: (id: string) => `/customer/documents/${id}`,
  },

  // Financing
  FINANCING: {
    APPLICATIONS: '/customer/financing/applications',
    APPLY: '/customer/financing/apply',
    LOAN_ACCOUNTS: '/customer/financing/loans',
    PAYMENTS: '/customer/financing/payments',
    PAYMENT_HISTORY: '/customer/financing/payment-history',
  },

  // Insurance
  INSURANCE: {
    POLICIES: '/customer/insurance/policies',
    CLAIMS: '/customer/insurance/claims',
    QUOTES: '/customer/insurance/quotes',
  },

  // Referrals
  REFERRALS: {
    PROGRAM: '/referrals/program',
    VALIDATE: '/referrals/validate',
    MY_REFERRALS: '/customer/referrals',
    STATS: '/customer/referrals/stats',
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/customer/notifications',
    MARK_READ: (id: string) => `/customer/notifications/${id}/read`,
    MARK_ALL_READ: '/customer/notifications/mark-all-read',
    SETTINGS: '/customer/notifications/settings',
  },
};

export default apiService;