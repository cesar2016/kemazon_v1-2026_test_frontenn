import axios from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || '/api';

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
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return Promise.reject(error);
    }

    const message = error.response?.data?.message ||
      (error.response?.data?.errors
        ? Object.values(error.response.data.errors).flat().join(', ')
        : 'Ha ocurrido un error');

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
  create: (data) => api.post('/seller/products', data),
  update: (id, data) => api.put(`/seller/products/${id}`, data),
  delete: (id) => api.delete(`/seller/products/${id}`),
  toggleLike: (productId) => api.post(`/products/${productId}/like`),
  getLikers: (productId) => api.get(`/products/${productId}/likers`),
  pingVisit: (productId, sessionId) => api.post(`/products/${productId}/visit/ping`, { session_id: sessionId }),
  getVisitors: (productId) => api.get(`/products/${productId}/visitors`),
};

export const auctionService = {
  getAll: (params) => api.get('/auctions', { params }),
  getById: (id) => api.get(`/auctions/${id}`),
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

export default api;
