'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { MessageSquare, Plus, Send, ChevronRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';

type Ticket = any;

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
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '', priority: 'MEDIUM' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/support');
      setTickets(data.data?.items ?? data.data ?? []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!form.subject.trim() || !form.description.trim()) return;
    setSaving(true);
    try {
      await api.post('/support', form);
      setShowCreate(false);
      setForm({ subject: '', description: '', priority: 'MEDIUM' });
      load();
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Support</h1>
          <p className="text-sm text-gray-500 mt-0.5">Get help with your orders and account</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 text-sm font-semibold bg-violet-600 text-white rounded-xl px-4 py-2 hover:bg-violet-700">
          <Plus className="w-4 h-4" /> New Ticket
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-50 animate-pulse rounded-2xl" />)}</div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-20 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
          <p className="font-semibold text-gray-600">No support tickets</p>
          <p className="text-sm text-gray-400 mt-1 max-w-xs">Have an issue? Create a ticket and our team will get back to you shortly.</p>
          <button onClick={() => setShowCreate(true)} className="mt-4 text-sm font-semibold text-violet-600 hover:underline">
            Create a ticket →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t: any) => (
            <Link key={t.id} href={`/dashboard/support/${t.id}`}
              className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center gap-4 hover:border-violet-200 hover:shadow-sm transition-all group">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-gray-900 text-sm">{t.subject}</p>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[t.priority] ?? 'bg-gray-100 text-gray-600'}`}>{t.priority}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{t.description}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[t.status] ?? 'bg-gray-100 text-gray-600'}`}>{t.status.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-gray-400">{formatDate(t.createdAt)}</span>
                  {t._count?.messages > 0 && (
                    <span className="text-xs text-violet-600 font-medium">{t._count.messages} {t._count.messages === 1 ? 'reply' : 'replies'}</span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-violet-500 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-violet-600" />
              </div>
              <h3 className="font-black text-gray-900 text-lg">New Support Ticket</h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Subject *</label>
              <input
                type="text" placeholder="Briefly describe your issue"
                value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Priority</label>
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description *</label>
              <textarea
                rows={4} placeholder="Provide full details about your issue…"
                value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => { setShowCreate(false); setForm({ subject: '', description: '', priority: 'MEDIUM' }); }}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={create} disabled={saving || !form.subject.trim() || !form.description.trim()}
                className="flex-1 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 disabled:opacity-50">
                {saving ? 'Submitting…' : 'Submit Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
