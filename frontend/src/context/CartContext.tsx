'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { cartApi } from '@/lib/api';
import { Cart } from '@/types';
import { useAuth } from './AuthContext';

interface CartState {
  cart: Cart | null;
  loading: boolean;
  itemCount: number;
  addItem: (variantId: string, qty: number) => Promise<void>;
  updateItem: (itemId: string, qty: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartState>({
  cart: null, loading: false, itemCount: 0,
  addItem: async () => {}, updateItem: async () => {},
  removeItem: async () => {}, refreshCart: async () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshCart = async () => {
    if (!user) { setCart(null); return; }
    try {
      setLoading(true);
      const { data } = await cartApi.get();
      setCart(data.data);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshCart(); }, [user]);

  const addItem = async (variantId: string, qty: number) => {
    const { data } = await cartApi.addItem(variantId, qty);
    setCart(data.data);
  };

  const updateItem = async (itemId: string, qty: number) => {
    const { data } = await cartApi.updateItem(itemId, qty);
    setCart(data.data);
  };

  const removeItem = async (itemId: string) => {
    // Optimistic remove
    setCart(prev => prev ? { ...prev, items: prev.items.filter(i => i.id !== itemId) } : prev);
    try {
      const { data } = await cartApi.removeItem(itemId);
      setCart(data.data);
    } catch {
      await refreshCart(); // revert on failure
    }
  };

  const itemCount = cart?.items.reduce((sum, i) => sum + i.qty, 0) ?? 0;

  return (
    <CartContext.Provider value={{ cart, loading, itemCount, addItem, updateItem, removeItem, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
