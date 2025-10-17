// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || '',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      PROFILE: '/api/auth/profile',
      LOGOUT: '/api/auth/logout',
      REFRESH: '/api/auth/refresh-token'
    },
    WALLETS: {
      LIST: '/api/wallets',
      CREATE: '/api/wallets',
      GET: (id: string) => `/api/wallets/${id}`,
      UPDATE: (id: string) => `/api/wallets/${id}`,
      DELETE: (id: string) => `/api/wallets/${id}`,
      BALANCE: (id: string) => `/api/wallets/${id}/balance`,
      TRANSACTIONS: (id: string) => `/api/wallets/${id}/transactions`
    }
  }
};

// Helper function to build full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get auth headers
export const getAuthHeaders = (token?: string) => {
  const accessToken = token || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
  return {
    'Content-Type': 'application/json',
    ...(accessToken && { 'Authorization': `Bearer ${accessToken}` })
  };
};