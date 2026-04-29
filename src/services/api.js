import axios from 'axios';
import { toast } from 'sonner';

const REMOTE_API_URL = 'https://kemazon-v1-2016-kmz-v1-backend.qiaz7f.easypanel.host/api';
const LOCAL_API_URL = 'http://127.0.0.1:8000/api';

function isLocalEnvironment() {
  if (import.meta.env.DEV) {
    return true;
  }

  if (typeof window === 'undefined') {
    return import.meta.env.DEV;
  }

  return ['localhost', '127.0.0.1'].includes(window.location.hostname);
}

function isLocalApiUrl(url) {
  if (!url) return false;
  if (url.startsWith('/')) return true;

  try {
    const parsed = new URL(url);
    return ['localhost', '127.0.0.1'].includes(parsed.hostname);
  } catch {
    return false;
  }
}

function resolveApiUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim();
  const forceRemoteInDev = import.meta.env.VITE_USE_REMOTE_API === 'true';

  if (configuredUrl) {
    if (import.meta.env.DEV && !forceRemoteInDev && !isLocalApiUrl(configuredUrl)) {
      return LOCAL_API_URL;
    }

    return configuredUrl.replace(/\/$/, '');
  }

  return isLocalEnvironment() ? LOCAL_API_URL : REMOTE_API_URL;
}

const API_URL = resolveApiUrl();
const API_ORIGIN = (() => {
  try {
    return new URL(API_URL).origin;
  } catch {
    return '';
  }
})();

const MEDIA_PATH_PATTERN = /^\/(storage|uploads|images)\//i;
const ABSOLUTE_HTTP_PATTERN = /^https?:\/\//i;
const MEDIA_FIELD_HINT = /(thumbnail|avatar|image|images|photo|picture|logo|banner|cover)/i;

export function resolveMediaUrl(value) {
  if (typeof value !== 'string' || value.length === 0) {
    return value;
  }

  // No transformar data:image (ya está en el formato correcto)
  if (value.startsWith('data:image/')) {
    return value;
  }

  if (MEDIA_PATH_PATTERN.test(value) && API_ORIGIN) {
    return `${API_ORIGIN}${value}`;
  }

  if (!ABSOLUTE_HTTP_PATTERN.test(value)) {
    return value;
  }

  try {
    const url = new URL(value);

    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.protocol === 'http:') {
      const apiHost = API_ORIGIN ? new URL(API_ORIGIN).hostname : null;
      const isKnownBackendHost = apiHost && url.hostname === apiHost;
      const isSameFrontendHost = url.hostname === window.location.hostname;

      if (isKnownBackendHost || isSameFrontendHost) {
        url.protocol = 'https:';
        return url.toString();
      }
    }
  } catch {
    return value;
  }

  return value;
}

function normalizeMediaPayload(payload, parentKey = '') {
  if (Array.isArray(payload)) {
    if (MEDIA_FIELD_HINT.test(parentKey)) {
      return payload.map((item) => (typeof item === 'string' ? resolveMediaUrl(item) : normalizeMediaPayload(item, parentKey)));
    }

    return payload.map((item) => normalizeMediaPayload(item, parentKey));
  }

  if (payload && typeof payload === 'object') {
    return Object.fromEntries(
      Object.entries(payload).map(([key, value]) => {
        // No transformar data:image en request (solo en response)
        if (typeof value === 'string' && value.startsWith('data:image/')) {
          return [key, value];
        }
        
        if (typeof value === 'string' && (MEDIA_FIELD_HINT.test(key) || MEDIA_PATH_PATTERN.test(value))) {
          return [key, resolveMediaUrl(value)];
        }

        if (Array.isArray(value) || (value && typeof value === 'object')) {
          return [key, normalizeMediaPayload(value, key)];
        }

        return [key, value];
      })
    );
  }

  return payload;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response?.data) {
      response.data = normalizeMediaPayload(response.data);
    }

    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return Promise.reject(error);
    }

    let message;
    if (error.code === 'ECONNABORTED') {
      message = 'La solicitud está tardando más de lo normal. Verifica tu conexión a internet e intenta de nuevo.';
    } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      message = 'Error de conexión. Verifica tu conexión a internet e intenta de nuevo.';
    } else if (error.response?.status === 0 || !error.response) {
      message = 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
    } else {
      message = error.response?.data?.message ||
        (error.response?.data?.errors
          ? Object.values(error.response.data.errors).flat().join(', ')
          : 'Ha ocurrido un error');
    }

    if (error.response?.status !== 401) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  becomeSeller: (data) => api.post('/auth/become-seller', data),
  updateAvatar: (data) => api.post('/auth/avatar', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  changePassword: (data) => api.post('/auth/change-password', data),
};

export const productService = {
  getAll: (params) => api.get('/products', { params }),
  getBySlug: (slug) => api.get(`/products/${slug}`),
  getById: (id) => api.get(`/seller/products/${id}`),
  search: (query) => api.get(`/products/search/${query}`),
  getMyProducts: (params) => api.get('/seller/products', { params }),
  create: (data, config = {}) => api.post('/seller/products', data, config),
  update: (id, data, config = {}) => api.put(`/seller/products/${id}`, data, config),
  delete: (id) => api.delete(`/seller/products/${id}`),
  toggleLike: (productId) => api.post(`/products/${productId}/like`),
  getLikers: (productId) => api.get(`/products/${productId}/likers`),
  pingVisit: (productId, sessionId) => api.post(`/products/${productId}/visit/ping`, { session_id: sessionId }),
  getVisitors: (productId) => api.get(`/products/${productId}/visitors`),
};

export const auctionService = {
  getAll: (params) => api.get('/auctions', { params }),
  getById: (slug) => api.get(`/auctions/${slug}`),
  getMyAuctions: (params) => api.get('/seller/auctions', { params }),
  create: (data) => api.post('/seller/auctions', data),
  update: (id, data) => api.put(`/seller/auctions/${id}`, data),
  end: (id) => api.post(`/seller/auctions/${id}/end`),
  placeBid: (id, amount) => api.post(`/auctions/${id}/bid`, { amount }),
  configureAutoBid: (id, maxBid) => api.post(`/auctions/${id}/auto-bid`, { max_bid: maxBid }),
  buyNow: (id) => api.post(`/auctions/${id}/buy-now`),
  getMyBids: () => api.get('/my-bids'),
};

export const cartService = {
  get: () => api.get('/cart'),
  add: (data) => api.post('/cart', data),
  update: (id, data) => api.put(`/cart/${id}`, data),
  remove: (id) => api.delete(`/cart/${id}`),
  clear: () => api.delete('/cart'),
  checkout: (data) => api.post('/cart/checkout', data),
};

export const orderService = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  cancel: (id) => api.post(`/orders/${id}/cancel`),
  getSellerOrders: (params) => api.get('/seller/orders', { params }),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
};

export const categoryService = {
  getAll: () => api.get('/categories'),
  getBySlug: (slug) => api.get(`/categories/${slug}`),
};

export const addressService = {
  getAll: () => api.get('/addresses'),
  getById: (id) => api.get(`/addresses/${id}`),
  create: (data) => api.post('/addresses', data),
  update: (id, data) => api.put(`/addresses/${id}`, data),
  remove: (id) => api.delete(`/addresses/${id}`),
  setDefault: (id) => api.post(`/addresses/${id}/default`),
};

export const notificationService = {
  getUnread: () => api.get('/notifications/unread'),
  getAll: (page = 1) => api.get(`/notifications?page=${page}`),
  markAsRead: (id) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  clear: () => api.delete('/notifications/clear'),
};

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  getActivity: () => api.get('/dashboard/activity'),
  getSalesReport: (params) => api.get('/dashboard/sales-report', { params }),
  getAdminStats: () => api.get('/dashboard/admin-stats'),
};

export const adminService = {
  getUsers: () => api.get('/admin/users'),
  toggleStatus: (id) => api.post(`/admin/users/${id}/toggle-status`),
  updateRole: (id, roleId) => api.put(`/admin/users/${id}/role`, { role_id: roleId }),
  broadcastNotification: (data) => api.post('/admin/notifications/broadcast', data),
};

export function getProductImageUrl(slugOrId) {
  return `${API_URL}/products/image/${slugOrId}`;
}

export default api;
