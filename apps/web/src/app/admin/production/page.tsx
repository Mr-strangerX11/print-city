'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Printer, CheckCircle2, AlertCircle, Clock, RefreshCw, ChevronDown } from 'lucide-react';

type PrintJob = any;
type QCJob = any;
const PRINT_STATUSES = ['QUEUED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED'];
const QC_STATUSES = ['PENDING', 'PASSED', 'FAILED', 'REWORK'];

const STATUS_COLORS: Record<string, string> = {
  QUEUED: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-700',
  PENDING: 'bg-yellow-100 text-yellow-800',
  PASSED: 'bg-green-100 text-green-800',
  REWORK: 'bg-orange-100 text-orange-800',
};

export default function ProductionPage() {
  const [tab, setTab] = useState<'print' | 'qc'>('print');
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [qcJobs, setQcJobs] = useState<QCJob[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [pj, qc, st] = await Promise.all([
        api.get('/production/print-jobs', { params: { status: statusFilter || undefined } }),
        api.get('/production/qc', { params: { status: statusFilter || undefined } }),
        api.get('/production/print-jobs/stats'),
      ]);
      setPrintJobs(pj.data.data?.items ?? []);
      setQcJobs(qc.data.data?.items ?? []);
      setStats(st.data.data);
    } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const updatePrintStatus = async (id: string, status: string) => {
    await api.patch(`/production/print-jobs/${id}/status`, { status });
    fetch();
  };

  const updateQCStatus = async (id: string, status: string) => {
    await api.patch(`/production/qc/${id}`, { status });
    fetch();
  };

  const createPrintJob = async (orderId: string) => {
    await api.post(`/production/print-jobs/${orderId}`);
    fetch();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">Print Production</h1>
        <button onClick={() => fetch()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 rounded-xl px-3 py-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Queued', value: stats.queued, icon: <Clock className="w-5 h-5 text-yellow-500" />, bg: 'bg-yellow-50' },
            { label: 'In Progress', value: stats.inProgress, icon: <Printer className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-50' },
            { label: 'Completed', value: stats.completed, icon: <CheckCircle2 className="w-5 h-5 text-green-500" />, bg: 'bg-green-50' },
            { label: 'Failed', value: stats.failed, icon: <AlertCircle className="w-5 h-5 text-red-500" />, bg: 'bg-red-50' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>{s.icon}</div>
              <p className="text-2xl font-black text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['print', 'qc'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'print' ? 'Print Jobs' : 'Quality Control'}
          </button>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setStatusFilter('')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${!statusFilter ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>All</button>
        {(tab === 'print' ? PRINT_STATUSES : QC_STATUSES).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${statusFilter === s ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>{s}</button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-gray-50 animate-pulse rounded-xl" />)}</div>
        ) : (tab === 'print' ? printJobs : qcJobs).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Printer className="w-10 h-10 text-gray-300 mb-3" />
            <p className="font-semibold text-gray-600">No {tab === 'print' ? 'print jobs' : 'QC records'} found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {tab === 'print' ? printJobs.map((job: any) => (
              <div key={job.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm">Order #{job.order?.id?.slice(-8).toUpperCase()}</p>
                  <p className="text-xs text-gray-400">{job.order?.user?.name} · {job.order?.items?.map((i: any) => i.product?.title).join(', ')}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(job.createdAt)}</p>
                </div>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[job.status] ?? 'bg-gray-100 text-gray-700'}`}>{job.status}</span>
                <select
                  value={job.status}
                  onChange={(e) => updatePrintStatus(job.id, e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none bg-white"
                >
                  {PRINT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )) : qcJobs.map((qc: any) => (
              <div key={qc.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm">Order #{qc.printJob?.order?.id?.slice(-8).toUpperCase()}</p>
                  <p className="text-xs text-gray-400">{qc.printJob?.order?.user?.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(qc.createdAt)}</p>
                </div>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[qc.status] ?? 'bg-gray-100 text-gray-700'}`}>{qc.status}</span>
                <select
                  value={qc.status}
                  onChange={(e) => updateQCStatus(qc.id, e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none bg-white"
                >
                  {QC_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
