'use client';

import { useState, useCallback, useRef } from 'react';

interface ViewerState {
  loading: boolean;
  error: string | null;
  imageData: string | null; // base64
  mimeType: string;
  tokenExpiresAt: Date | null;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

export function useDesignViewer(designId: string) {
  const [state, setState] = useState<ViewerState>({
    loading: false,
    error: null,
    imageData: null,
    mimeType: 'image/jpeg',
    tokenExpiresAt: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const loadImage = useCallback(async () => {
    // Abort any in-flight request
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setState((s) => ({ ...s, loading: true, error: null, imageData: null }));

    try {
      // Step 1: Request a one-time view token (60s)
      const tokenRes = await fetch(`${API}/api/designs/${designId}/view-token`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
      });

      if (!tokenRes.ok) {
        const err = await tokenRes.json().catch(() => ({}));
        throw new Error(err.message ?? 'Failed to get view token');
      }

      const { token, expiresAt } = await tokenRes.json();

      // Step 2: Exchange token for watermarked base64 image
      const renderRes = await fetch(`${API}/api/designs/render`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
        signal: ctrl.signal,
      });

      if (!renderRes.ok) {
        const err = await renderRes.json().catch(() => ({}));
        throw new Error(err.message ?? 'Failed to render image');
      }

      const { imageData, mimeType } = await renderRes.json();

      setState({
        loading: false,
        error: null,
        imageData,
        mimeType,
        tokenExpiresAt: new Date(expiresAt),
      });
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setState((s) => ({ ...s, loading: false, error: err.message }));
    }
  }, [designId]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ loading: false, error: null, imageData: null, mimeType: 'image/jpeg', tokenExpiresAt: null });
  }, []);

  return { ...state, loadImage, reset };
}
