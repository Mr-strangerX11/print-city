'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { wishlistApi } from '@/lib/api';
import { useAuth } from './AuthContext';

interface WishlistState {
  ids: string[];
  pending: string[];
  isInWishlist: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistState>({
  ids: [],
  pending: [],
  isInWishlist: () => false,
  toggle: async () => {},
  refresh: async () => {},
});

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [ids, setIds] = useState<string[]>([]);
  const [pending, setPending] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    if (!user) { setIds([]); return; }
    try {
      const { data } = await wishlistApi.getIds();
      setIds(data.data ?? []);
    } catch {
      setIds([]);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const toggle = async (productId: string) => {
    if (!user) return;
    if (pending.includes(productId)) return; // Prevent concurrent toggle
    const inList = ids.includes(productId);
    setPending(prev => [...prev, productId]);
    setIds(prev => inList ? prev.filter(id => id !== productId) : [...prev, productId]);
    try {
      await wishlistApi.toggle(productId);
    } catch {
      setIds(prev => inList ? [...prev, productId] : prev.filter(id => id !== productId));
    } finally {
      setPending(prev => prev.filter(id => id !== productId));
    }
  };

  const isInWishlist = (productId: string) => ids.includes(productId);

  return (
    <WishlistContext.Provider value={{ ids, pending, isInWishlist, toggle, refresh }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
