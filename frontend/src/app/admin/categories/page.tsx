'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Layers, Plus, Pencil, Trash2, RefreshCw, ImageIcon, X } from 'lucide-react';

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  children?: Category[];
};

const emptyForm = { name: '', description: '', image: '' };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setError('');
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description ?? '', image: cat.image ?? '' });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm({ ...emptyForm });
    setError('');
  };

  const save = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        image: form.image.trim() || undefined,
      };
      if (editing) {
        await api.patch(`/categories/${editing.id}`, payload);
      } else {
        await api.post('/categories', payload);
      }
      closeModal();
      load();
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (cat: Category) => {
    if (!confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return;
    setDeleting(cat.id);
    try {
      await api.delete(`/categories/${cat.id}`);
      load();
    } finally {
      setDeleting(null);
    }
  };

  const allCategories = categories.flatMap((c) => [c, ...(c.children ?? [])]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {allCategories.length} categories · displayed on the home page
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 rounded-xl px-3 py-2"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 text-sm font-semibold bg-violet-600 text-white rounded-xl px-4 py-2 hover:bg-violet-700"
          >
            <Plus className="w-4 h-4" /> New Category
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-violet-50 border border-violet-100 rounded-2xl px-5 py-3 text-sm text-violet-700 flex items-center gap-2">
        <Layers className="w-4 h-4 flex-shrink-0" />
        Categories you add here appear automatically in the <strong className="mx-1">Shop by Category</strong> section on the home page.
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-50 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : allCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Layers className="w-10 h-10 text-gray-300 mb-3" />
            <p className="font-semibold text-gray-600">No categories yet</p>
            <p className="text-xs text-gray-400 mt-1">Create your first category to get started.</p>
            <button
              onClick={openCreate}
              className="mt-4 flex items-center gap-2 text-sm font-semibold bg-violet-600 text-white rounded-xl px-4 py-2 hover:bg-violet-700"
            >
              <Plus className="w-4 h-4" /> New Category
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {allCategories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50">
                {/* Image */}
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-gray-300" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm">{cat.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    /{cat.slug}
                    {cat.description && <span className="ml-2 text-gray-500">· {cat.description}</span>}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-2 hover:bg-violet-50 rounded-lg text-gray-400 hover:text-violet-600"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => remove(cat)}
                    disabled={deleting === cat.id}
                    className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-gray-900 text-lg">
                {editing ? 'Edit Category' : 'New Category'}
              </h3>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Name *</label>
                <input
                  type="text"
                  placeholder="e.g. T-Shirts"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label>
                <input
                  type="text"
                  placeholder="Short description (optional)"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Image URL</label>
                <input
                  type="url"
                  placeholder="https://... (optional)"
                  value={form.image}
                  onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                />
                {form.image && (
                  <div className="mt-2 w-16 h-16 rounded-xl overflow-hidden border border-gray-100">
                    <img src={form.image} alt="preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving || !form.name.trim()}
                className="flex-1 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
