import axios from 'axios';
import Cookies from 'js-cookie';

// In dev the Next.js rewrite proxy forwards /api → localhost:4000/api.
// In production rewrites are disabled, so use the absolute backend URL directly.
const API_URL =
  typeof window !== 'undefined' && process.env.NODE_ENV !== 'production'
    ? '/api'
    : (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api');

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const refreshToken = Cookies.get('refreshToken');
        // Use the same `api` instance so it routes through the proxy
        const { data } = await api.post('/auth/refresh', { refreshToken });
        const { accessToken } = data.data;
        Cookies.set('accessToken', accessToken, { expires: 1 });
        refreshQueue.forEach((cb) => cb(accessToken));
        refreshQueue = [];
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.patch('/auth/me', data),
};

// ─── Products ─────────────────────────────────────────────────────────────────
export const productsApi = {
  list: (params?: any) => api.get('/products', { params }),
  get: (slug: string) => api.get(`/products/${slug}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.patch(`/products/${id}`, data),
  importCsv: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/products/import-csv', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

// ─── Categories ───────────────────────────────────────────────────────────────
export const categoriesApi = {
  list: () => api.get('/categories'),
  get: (slug: string) => api.get(`/categories/${slug}`),
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.patch(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// ─── Cart ─────────────────────────────────────────────────────────────────────
export const cartApi = {
  get: () => api.get('/cart'),
  addItem: (variantId: string, qty: number) => api.post('/cart/items', { variantId, qty }),
  updateItem: (itemId: string, qty: number) => api.patch(`/cart/items/${itemId}`, { qty }),
  removeItem: (itemId: string) => api.delete(`/cart/items/${itemId}`),
};

// ─── Orders ───────────────────────────────────────────────────────────────────
export const ordersApi = {
  checkout: (data: any) => api.post('/orders', data),
  list: (params?: any) => api.get('/orders', { params }),
  get: (id: string) => api.get(`/orders/${id}`),
  cancel: (id: string) => api.patch(`/orders/${id}/cancel`),
  updateStatus: (id: string, status: string) => api.patch(`/orders/${id}/status`, { status }),
  stats: () => api.get('/orders/stats'),
};

// ─── Reviews ──────────────────────────────────────────────────────────────────
export const reviewsApi = {
  create: (data: { productId: string; rating: number; comment?: string }) => api.post('/reviews', data),
  forProduct: (productId: string) => api.get(`/reviews/product/${productId}`),
  myReview: (productId: string) => api.get(`/reviews/my/${productId}`),
};

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentsApi = {
  createCheckout: (orderId: string) => api.post(`/payments/checkout/${orderId}`),
  initiateEsewa: (orderId: string) => api.post(`/payments/esewa/${orderId}`),
  initiateKhalti: (orderId: string) => api.post(`/payments/khalti/${orderId}`),
};

// ─── Vendors ──────────────────────────────────────────────────────────────────
export const vendorsApi = {
  list: (params?: any) => api.get('/vendors', { params }),
  get: (slug: string) => api.get(`/vendors/${slug}`),
  getProfile: () => api.get('/vendors/me/profile'),
  updateProfile: (data: any) => api.patch('/vendors/me/profile', data),
  updateStatus: (id: string, status: string) => api.patch(`/vendors/${id}/status`, { status }),
  updateCommission: (id: string, commissionRate: number) => api.patch(`/vendors/${id}/commission`, { commissionRate }),
};

// ─── Custom Design ────────────────────────────────────────────────────────────
export const customDesignApi = {
  create: (data: any) => api.post('/custom-design', data),
  list: (params?: any) => api.get('/custom-design', { params }),
  get: (id: string) => api.get(`/custom-design/${id}`),
  update: (id: string, data: any) => api.patch(`/custom-design/${id}`, data),
};

// ─── Payouts ──────────────────────────────────────────────────────────────────
export const payoutsApi = {
  list: (params?: any) => api.get('/payouts', { params }),
  earnings: () => api.get('/payouts/earnings'),
  run: (data: { periodStart: string; periodEnd: string }) => api.post('/payouts/run', data),
  markPaid: (id: string) => api.patch(`/payouts/${id}/paid`),
};

// ─── Uploads ──────────────────────────────────────────────────────────────────
export const uploadsApi = {
  getSignature: (folder?: string) => api.get('/uploads/sign', { params: { folder } }),
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    // Do NOT set Content-Type manually — axios must auto-set it with the multipart boundary
    return api.post('/uploads/file', form);
  },
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminApi = {
  listUsers: (params?: any) => api.get('/auth/users', { params }),
  toggleUserStatus: (id: string, isActive: boolean) => api.patch(`/auth/users/${id}/status`, { isActive }),
};

// ─── Addresses ────────────────────────────────────────────────────────────────
export const addressesApi = {
  list: () => api.get('/addresses'),
  create: (data: any) => api.post('/addresses', data),
  update: (id: string, data: any) => api.patch(`/addresses/${id}`, data),
  setDefault: (id: string) => api.patch(`/addresses/${id}/default`),
  remove: (id: string) => api.delete(`/addresses/${id}`),
};

// ─── Wishlist ─────────────────────────────────────────────────────────────────
export const wishlistApi = {
  get: () => api.get('/wishlist'),
  getIds: () => api.get('/wishlist/ids'),
  toggle: (productId: string) => api.post(`/wishlist/${productId}`),
  remove: (productId: string) => api.delete(`/wishlist/${productId}`),
};

// ─── Invoices ─────────────────────────────────────────────────────────────────
export const invoicesApi = {
  list: (params?: any) => api.get('/invoices', { params }),
  get: (id: string) => api.get(`/invoices/${id}`),
  getByOrder: (orderId: string) => api.get(`/invoices/order/${orderId}`),
  stats: () => api.get('/invoices/stats'),
  generate: (orderId: string) => api.post(`/invoices/generate/${orderId}`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/invoices/${id}/status`, null, { params: { status } }),
  downloadUrl: (id: string) => `${typeof window !== 'undefined' ? '/api' : (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api')}/invoices/${id}/download`,
};

// ─── Coupons ──────────────────────────────────────────────────────────────────
export const couponsApi = {
  list: (params?: any) => api.get('/coupons', { params }),
  get: (id: string) => api.get(`/coupons/${id}`),
  create: (data: any) => api.post('/coupons', data),
  update: (id: string, data: any) => api.patch(`/coupons/${id}`, data),
  remove: (id: string) => api.delete(`/coupons/${id}`),
  validate: (code: string, orderAmount: number) =>
    api.post('/coupons/validate', { code, orderAmount }),
  stats: () => api.get('/coupons/stats'),
};

// ─── Production ───────────────────────────────────────────────────────────────
export const productionApi = {
  listPrintJobs: (params?: any) => api.get('/production/print-jobs', { params }),
  createPrintJob: (orderId: string) => api.post(`/production/print-jobs/${orderId}`),
  updatePrintJobStatus: (id: string, status: string) =>
    api.patch(`/production/print-jobs/${id}/status`, { status }),
  printJobStats: () => api.get('/production/print-jobs/stats'),
  listQC: (params?: any) => api.get('/production/qc', { params }),
  updateQC: (id: string, status: string, notes?: string) =>
    api.patch(`/production/qc/${id}`, { status, notes }),
  listShipments: (params?: any) => api.get('/production/shipments', { params }),
  createShipment: (orderId: string, data: any) =>
    api.post(`/production/shipments/${orderId}`, data),
  updateShipmentStatus: (id: string, status: string) =>
    api.patch(`/production/shipments/${id}/status`, { status }),
};

// ─── Support ──────────────────────────────────────────────────────────────────
export const supportApi = {
  list: (params?: any) => api.get('/support', { params }),
  get: (id: string) => api.get(`/support/${id}`),
  create: (data: { subject: string; description: string; priority?: string }) =>
    api.post('/support', data),
  reply: (id: string, message: string) =>
    api.post(`/support/${id}/reply`, { message }),
  updateStatus: (id: string, status: string) =>
    api.patch(`/support/${id}/status`, { status }),
  stats: () => api.get('/support/stats'),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  list: (params?: { limit?: number; skip?: number }) => api.get('/notifications', { params }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  unreadCount: () => api.get('/notifications/unread-count'),
};
