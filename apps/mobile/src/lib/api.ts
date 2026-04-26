import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        const { data } = await api.post('/auth/refresh', { refreshToken });
        const { accessToken } = data.data;
        await SecureStore.setItemAsync('accessToken', accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
      }
    }
    return Promise.reject(error);
  },
);

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: { name: string; email: string; password: string; phone?: string }) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

export const productsApi = {
  list: (params?: any) => api.get('/products', { params }),
  get: (slug: string) => api.get(`/products/${slug}`),
};

export const categoriesApi = {
  list: () => api.get('/categories'),
};

export const cartApi = {
  get: () => api.get('/cart'),
  addItem: (variantId: string, qty: number) => api.post('/cart/items', { variantId, qty }),
  updateItem: (itemId: string, qty: number) => api.patch(`/cart/items/${itemId}`, { qty }),
  removeItem: (itemId: string) => api.delete(`/cart/items/${itemId}`),
};

export const ordersApi = {
  list: (params?: any) => api.get('/orders', { params }),
  get: (id: string) => api.get(`/orders/${id}`),
  checkout: (data: any) => api.post('/orders', data),
  cancel: (id: string) => api.patch(`/orders/${id}/cancel`),
};

export const wishlistApi = {
  getIds: () => api.get('/wishlist/ids'),
  toggle: (productId: string) => api.post(`/wishlist/${productId}`),
};
