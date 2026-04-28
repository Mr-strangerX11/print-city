'use client';

import { useState, useRef, useCallback } from 'react';

type PrintFormat = 'A4' | 'A3' | 'TSHIRT' | 'HOODIE' | 'MUG' | 'CUSTOM';
type ColorMode = 'RGB' | 'CMYK';

interface PrintTriggerProps {
  designId: string;
  designTitle: string;
}

const FORMAT_LABELS: Record<PrintFormat, string> = {
  A4: 'A4 (210×297mm)',
  A3: 'A3 (297×420mm)',
  TSHIRT: 'T-Shirt (280×330mm)',
  HOODIE: 'Hoodie (300×380mm)',
  MUG: 'Mug Wrap (237×93mm)',
  CUSTOM: 'Custom',
};

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

type Stage = 'idle' | 'configuring' | 'creating' | 'polling' | 'printing' | 'done' | 'error';

export default function PrintTrigger({ designId, designTitle }: PrintTriggerProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [format, setFormat] = useState<PrintFormat>('A4');
  const [colorMode, setColorMode] = useState<ColorMode>('RGB');
  const [copies, setCopies] = useState(1);
  const [dpi, setDpi] = useState(300);
  const [error, setError] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
  };

  const handlePrint = useCallback(async () => {
    setStage('creating');
    setError(null);

    try {
      // 1. Create print job
      const createRes = await fetch(`${API}/api/print-secure/jobs`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ designId, format, colorMode, copies, dpi }),
      });

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        throw new Error(err.message ?? 'Failed to create print job');
      }

      const { id: jobId } = await createRes.json();
      setStage('polling');

      // 2. Poll until completed
      await new Promise<void>((resolve, reject) => {
        pollRef.current = setInterval(async () => {
          try {
            const statusRes = await fetch(`${API}/api/print-secure/jobs/${jobId}`, {
              credentials: 'include',
            });
            const job = await statusRes.json();

            if (job.status === 'COMPLETED') {
              clearPolling();
              resolve();
            } else if (job.status === 'FAILED') {
              clearPolling();
              reject(new Error(job.error ?? 'Print job failed'));
            }
          } catch (e) {
            clearPolling();
            reject(e);
          }
        }, 1500);
      });

      setStage('printing');

      // 3. Get one-time 30s print token
      const tokenRes = await fetch(`${API}/api/print-secure/jobs/${jobId}/token`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!tokenRes.ok) throw new Error('Failed to get print token');

      const { printToken } = await tokenRes.json();

      // 4. Open print PDF in hidden iframe — triggers browser print dialog
      // The file is served inline (no download), token is single-use
      const printUrl = `${API}/api/print-secure/stream/${printToken}`;

      if (iframeRef.current) {
        iframeRef.current.src = printUrl;

        // Wait for iframe to load, then trigger print dialog
        iframeRef.current.onload = () => {
          try {
            iframeRef.current?.contentWindow?.print();
          } catch {
            // Cross-origin fallback: open in new tab (rare)
            window.open(printUrl, '_blank', 'noopener,noreferrer');
          }
          setStage('done');
        };
      }
    } catch (err: any) {
      clearPolling();
      setError(err.message);
      setStage('error');
    }
  }, [designId, format, colorMode, copies, dpi]);

  return (
    <>
      {/* Hidden iframe for print streaming */}
      <iframe
        ref={iframeRef}
        className="hidden"
        title="Print Preview"
        aria-hidden="true"
      />

      {stage === 'idle' && (
        <button
          onClick={() => setStage('configuring')}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm
            font-semibold text-white shadow transition-all hover:bg-indigo-500 active:scale-95"
        >
          🖨️ Print Design
        </button>
      )}

      {stage === 'configuring' && (
        <div className="rounded-xl border border-zinc-700 bg-zinc-800 p-5 space-y-4 shadow-xl">
          <h3 className="text-sm font-semibold text-zinc-100">
            Print Settings — <span className="text-zinc-400">{designTitle}</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as PrintFormat)}
                className="w-full rounded-md bg-zinc-700 border-zinc-600 text-sm text-zinc-100
                  px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {(Object.entries(FORMAT_LABELS) as [PrintFormat, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Color Mode</label>
              <select
                value={colorMode}
                onChange={(e) => setColorMode(e.target.value as ColorMode)}
                className="w-full rounded-md bg-zinc-700 border-zinc-600 text-sm text-zinc-100
                  px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="RGB">RGB (Screen / Digital)</option>
                <option value="CMYK">CMYK (Professional Print)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">DPI</label>
              <select
                value={dpi}
                onChange={(e) => setDpi(Number(e.target.value))}
                className="w-full rounded-md bg-zinc-700 border-zinc-600 text-sm text-zinc-100
                  px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={150}>150 DPI (Draft)</option>
                <option value={300}>300 DPI (Standard)</option>
                <option value={600}>600 DPI (Premium)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Copies</label>
              <input
                type="number"
                min={1}
                max={100}
                value={copies}
                onChange={(e) => setCopies(Math.max(1, Number(e.target.value)))}
                className="w-full rounded-md bg-zinc-700 border-zinc-600 text-sm text-zinc-100
                  px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={handlePrint}
              className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white
                shadow hover:bg-indigo-500 transition-all active:scale-95"
            >
              🖨️ Generate & Print
            </button>
            <button
              onClick={() => setStage('idle')}
              className="rounded-lg bg-zinc-700 px-4 py-2.5 text-sm text-zinc-300
                hover:bg-zinc-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {(stage === 'creating' || stage === 'polling') && (
        <div className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800 px-5 py-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <div>
            <p className="text-sm font-medium text-zinc-100">
              {stage === 'creating' ? 'Creating print job…' : 'Processing at 300 DPI…'}
            </p>
            <p className="text-xs text-zinc-500">Building print-ready PDF with crop marks</p>
          </div>
        </div>
      )}

      {stage === 'printing' && (
        <div className="flex items-center gap-3 rounded-lg border border-green-800/50 bg-green-900/20 px-5 py-4">
          <span className="text-lg">🖨️</span>
          <div>
            <p className="text-sm font-medium text-green-300">Opening print dialog…</p>
            <p className="text-xs text-green-600">File streams directly to printer — no download</p>
          </div>
        </div>
      )}

      {stage === 'done' && (
        <div className="flex items-center justify-between rounded-lg border border-zinc-700
          bg-zinc-800 px-5 py-3">
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <span className="text-green-400">✓</span> Print sent to dialog
          </div>
          <button
            onClick={() => setStage('idle')}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Print again
          </button>
        </div>
      )}

      {stage === 'error' && (
        <div className="rounded-lg border border-red-800/50 bg-red-900/20 px-5 py-4 space-y-2">
          <p className="text-sm text-red-400">Print failed: {error}</p>
          <button
            onClick={() => setStage('idle')}
            className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Try again
          </button>
        </div>
      )}
    </>
  );
}
