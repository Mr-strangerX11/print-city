'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { MessageSquare, RefreshCw, ChevronDown, Send, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

type Ticket = any;

const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-600',
};
const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, s] = await Promise.all([
        api.get('/support', { params: { status: statusFilter || undefined } }),
        api.get('/support/stats'),
      ]);
      setTickets(t.data.data?.items ?? []);
      setStats(s.data.data);
    } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openTicket = async (t: Ticket) => {
    const { data } = await api.get(`/support/${t.id}`);
    setSelected(data.data ?? t);
    setReply('');
  };

  const sendReply = async () => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      await api.post(`/support/${selected.id}/reply`, { message: reply });
      const { data } = await api.get(`/support/${selected.id}`);
      setSelected(data.data);
      setReply('');
      load();
    } finally { setSending(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    await api.patch(`/support/${id}/status`, { status });
    if (selected?.id === id) {
      const { data } = await api.get(`/support/${id}`);
      setSelected(data.data);
    }
    load();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Support Tickets</h1>
          <p className="text-sm text-gray-500 mt-0.5">{tickets.length} tickets</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 rounded-xl px-3 py-2">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Open', value: stats.open ?? 0, icon: <AlertCircle className="w-5 h-5 text-yellow-500" />, bg: 'bg-yellow-50' },
            { label: 'In Progress', value: stats.inProgress ?? 0, icon: <Clock className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-50' },
            { label: 'Resolved', value: stats.resolved ?? 0, icon: <CheckCircle2 className="w-5 h-5 text-green-500" />, bg: 'bg-green-50' },
            { label: 'Total', value: stats.total ?? tickets.length, icon: <MessageSquare className="w-5 h-5 text-violet-500" />, bg: 'bg-violet-50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>{s.icon}</div>
              <p className="text-2xl font-black text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setStatusFilter('')} className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap ${!statusFilter ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>All</button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap ${statusFilter === s ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>{s.replace(/_/g, ' ')}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket List */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-50 animate-pulse rounded-xl" />)}</div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare className="w-10 h-10 text-gray-300 mb-3" />
              <p className="font-semibold text-gray-600">No tickets</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {tickets.map((t: any) => (
                <button key={t.id} onClick={() => openTicket(t)} className={`w-full text-left px-5 py-4 hover:bg-gray-50/50 transition-colors ${selected?.id === t.id ? 'bg-violet-50/60' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900 text-sm truncate">{t.subject}</p>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[t.priority] ?? 'bg-gray-100 text-gray-600'}`}>{t.priority}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{t.user?.name} · {t.user?.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[t.status] ?? 'bg-gray-100 text-gray-600'}`}>{t.status}</span>
                        <span className="text-xs text-gray-400">{formatDate(t.createdAt)}</span>
                      </div>
                    </div>
                    {t._count?.messages > 0 && (
                      <span className="flex-shrink-0 text-xs bg-violet-100 text-violet-700 font-bold rounded-full px-2 py-0.5">{t._count.messages}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ticket Detail / Reply Panel */}
        {selected ? (
          <div className="bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-black text-gray-900">{selected.subject}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{selected.user?.name} · {selected.user?.email}</p>
                </div>
                <select
                  value={selected.status}
                  onChange={e => updateStatus(selected.id, e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none bg-white flex-shrink-0"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[selected.priority]}`}>{selected.priority}</span>
                <span className="text-xs text-gray-400">Ticket #{selected.id?.slice(-8).toUpperCase()}</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-72">
              {/* Original message */}
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-600">
                  {selected.user?.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-xl rounded-tl-none px-4 py-3">
                    <p className="text-sm text-gray-800">{selected.description}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(selected.createdAt)}</p>
                </div>
              </div>

              {/* Reply messages */}
              {(selected.messages ?? []).map((m: any) => (
                <div key={m.id} className={`flex gap-3 ${m.isStaff ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${m.isStaff ? 'bg-violet-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {m.isStaff ? 'A' : selected.user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className={`rounded-xl px-4 py-3 ${m.isStaff ? 'bg-violet-600 text-white rounded-tr-none' : 'bg-gray-50 text-gray-800 rounded-tl-none'}`}>
                      <p className="text-sm">{m.message}</p>
                    </div>
                    <p className={`text-xs text-gray-400 mt-1 ${m.isStaff ? 'text-right' : ''}`}>{formatDate(m.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply input */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex gap-2">
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="Type your reply…"
                  rows={2}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 resize-none"
                />
                <button
                  onClick={sendReply}
                  disabled={sending || !reply.trim()}
                  className="px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 flex items-center justify-center py-20">
            <div className="text-center">
              <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Select a ticket to view and reply</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
