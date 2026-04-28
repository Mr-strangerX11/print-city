'use client';

import React, { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Send, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

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

export default function SupportTicketPage() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/support/${id}`);
      setTicket(data.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [ticket?.messages]);

  const send = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await api.post(`/support/${id}/reply`, { message: reply });
      setReply('');
      load();
    } finally { setSending(false); }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send();
  };

  if (loading) return (
    <div className="space-y-4 animate-fade-in">
      <div className="h-8 w-40 bg-gray-100 animate-pulse rounded-xl" />
      <div className="h-32 bg-gray-100 animate-pulse rounded-2xl" />
      <div className="h-64 bg-gray-100 animate-pulse rounded-2xl" />
    </div>
  );

  if (!ticket) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Ticket not found</p>
      <Link href="/dashboard/support" className="text-violet-600 text-sm mt-2 inline-block hover:underline">← Back to support</Link>
    </div>
  );

  const isClosed = ticket.status === 'CLOSED' || ticket.status === 'RESOLVED';

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <Link href="/dashboard/support" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4" /> Back to tickets
      </Link>

      {/* Ticket header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-black text-gray-900 text-lg">{ticket.subject}</h1>
            <p className="text-xs text-gray-400 mt-1">Ticket #{ticket.id?.slice(-8).toUpperCase()} · {formatDate(ticket.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${PRIORITY_COLORS[ticket.priority] ?? 'bg-gray-100'}`}>{ticket.priority}</span>
            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[ticket.status] ?? 'bg-gray-100'}`}>{ticket.status.replace(/_/g, ' ')}</span>
          </div>
        </div>
      </div>

      {/* Conversation */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-5 space-y-5 max-h-[500px] overflow-y-auto">
          {/* Original description */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-100 flex-shrink-0 flex items-center justify-center text-sm font-bold text-violet-700">
              {ticket.user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-gray-900">You</p>
                <span className="text-xs text-gray-400">{formatDate(ticket.createdAt)}</span>
              </div>
              <div className="bg-gray-50 rounded-xl rounded-tl-none px-4 py-3">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{ticket.description}</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          {(ticket.messages ?? []).map((m: any) => (
            <div key={m.id} className={`flex gap-3 ${m.isStaff ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold ${m.isStaff ? 'bg-violet-600 text-white' : 'bg-violet-100 text-violet-700'}`}>
                {m.isStaff ? 'S' : ticket.user?.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div className="flex-1">
                <div className={`flex items-center gap-2 mb-1 ${m.isStaff ? 'justify-end' : ''}`}>
                  <span className="text-xs text-gray-400">{formatDate(m.createdAt)}</span>
                  <p className="text-sm font-semibold text-gray-900">{m.isStaff ? 'Support Team' : 'You'}</p>
                </div>
                <div className={`rounded-xl px-4 py-3 ${m.isStaff ? 'bg-violet-600 text-white rounded-tr-none' : 'bg-gray-50 text-gray-800 rounded-tl-none'}`}>
                  <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                </div>
              </div>
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {/* Reply box */}
        {!isClosed ? (
          <div className="border-t border-gray-100 p-4">
            <div className="flex gap-3">
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Write a reply… (Ctrl+Enter to send)"
                rows={3}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 resize-none"
              />
              <button
                onClick={send}
                disabled={sending || !reply.trim()}
                className="px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 flex-shrink-0 self-end"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Our team typically replies within 24 hours.</p>
          </div>
        ) : (
          <div className="border-t border-gray-100 p-4 text-center">
            <p className="text-sm text-gray-500">This ticket is {ticket.status.toLowerCase()}.</p>
            <Link href="/dashboard/support" className="text-sm text-violet-600 hover:underline mt-1 inline-block">
              Open a new ticket →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
