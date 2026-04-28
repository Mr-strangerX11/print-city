'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useDesignViewer } from './useDesignViewer';

interface SecureCanvasProps {
  designId: string;
  className?: string;
  onLoad?: () => void;
  onError?: (msg: string) => void;
}

export default function SecureCanvas({
  designId,
  className = '',
  onLoad,
  onError,
}: SecureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { loading, error, imageData, mimeType, loadImage } = useDesignViewer(designId);

  // ─── Draw base64 image onto canvas ─────────────────────────────────────────

  const drawOnCanvas = useCallback(
    (b64: string, mime: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const img = new Image();
      img.onload = () => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        ctx.drawImage(img, 0, 0);

        // Revoke object URL after drawing to prevent reuse
        URL.revokeObjectURL(img.src);
        onLoad?.();
      };

      // Build blob from base64 — never set as img src directly
      const byteChars = atob(b64);
      const byteNums = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
      const blob = new Blob([byteNums], { type: mime });

      // Create a short-lived object URL — canvas draws it, then it's revoked
      img.src = URL.createObjectURL(blob);
    },
    [onLoad],
  );

  useEffect(() => {
    if (imageData) drawOnCanvas(imageData, mimeType);
  }, [imageData, mimeType, drawOnCanvas]);

  useEffect(() => {
    if (error) onError?.(error);
  }, [error, onError]);

  // ─── Security: block all extraction attempts ────────────────────────────────

  const blockEvent = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Block native drag and right-click at DOM level
    const noop = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    canvas.addEventListener('contextmenu', noop, { capture: true });
    canvas.addEventListener('dragstart', noop, { capture: true });
    canvas.addEventListener('copy', noop, { capture: true });

    // Disable pointer events that could be used for screenshot via DevTools
    const handleKey = (e: KeyboardEvent) => {
      // Block Ctrl/Cmd+S (Save), Ctrl/Cmd+Shift+S, PrintScreen
      const blocked =
        (e.key === 'PrintScreen') ||
        ((e.ctrlKey || e.metaKey) && e.key === 's') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 's');
      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('keydown', handleKey, { capture: true });

    return () => {
      canvas.removeEventListener('contextmenu', noop, { capture: true });
      canvas.removeEventListener('dragstart', noop, { capture: true });
      canvas.removeEventListener('copy', noop, { capture: true });
      window.removeEventListener('keydown', handleKey, { capture: true });
    };
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className={`relative select-none overflow-hidden rounded-lg bg-zinc-900 ${className}`}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* Security overlay: invisible div on top of canvas to catch mouse events */}
      <div
        className="absolute inset-0 z-10"
        onContextMenu={blockEvent}
        onDragStart={blockEvent}
        style={{ cursor: 'default' }}
      />

      {!imageData && !loading && !error && (
        <div className="flex h-64 items-center justify-center">
          <button
            onClick={loadImage}
            className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg
              transition-all hover:bg-indigo-500 active:scale-95"
          >
            🔐 Load Secure Preview
          </button>
        </div>
      )}

      {loading && (
        <div className="flex h-64 items-center justify-center gap-3 text-zinc-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <span className="text-sm">Generating secure preview…</span>
        </div>
      )}

      {error && (
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={loadImage}
            className="rounded-md bg-zinc-700 px-4 py-2 text-xs text-zinc-200 hover:bg-zinc-600"
          >
            Retry
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className={`block w-full ${imageData ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        style={{ maxWidth: '100%', height: 'auto', pointerEvents: 'none' }}
        aria-label="Secure design preview"
      />

      {imageData && (
        <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between
          bg-black/60 px-3 py-1.5 text-[10px] text-zinc-400 backdrop-blur-sm">
          <span>🔒 Watermarked secure preview — not for download</span>
          <button
            onClick={loadImage}
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            ↻ Refresh
          </button>
        </div>
      )}
    </div>
  );
}
