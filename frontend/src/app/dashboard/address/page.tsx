'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, Plus, Trash2, Star, Loader2, X, Check } from 'lucide-react';
import { addressesApi } from '@/lib/api';
import { toast } from 'sonner';

interface Address {
  id: string;
  label: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip?: string;
  country: string;
  isDefault: boolean;
}

const EMPTY_FORM = { label: 'Home', name: '', phone: '', address: '', city: '', state: '', zip: '', country: 'Nepal' };

export default function AddressPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await addressesApi.list();
      setAddresses(data.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); };
  const openEdit = (a: Address) => {
    setForm({ label: a.label, name: a.name, phone: a.phone, address: a.address, city: a.city, state: a.state, zip: a.zip ?? '', country: a.country });
    setEditId(a.id);
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.address || !form.city || !form.state) {
      toast.error('Please fill in all required fields'); return;
    }
    setSaving(true);
    try {
      if (editId) {
        const { data } = await addressesApi.update(editId, form);
        setAddresses(prev => prev.map(a => a.id === editId ? data.data : a));
        toast.success('Address updated');
      } else {
        const { data } = await addressesApi.create(form);
        setAddresses(prev => [...prev, data.data]);
        toast.success('Address added');
      }
      closeForm();
    } catch {
      toast.error('Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await addressesApi.setDefault(id);
      setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
      toast.success('Default address updated');
    } catch {
      toast.error('Failed to update default');
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await addressesApi.remove(id);
      setAddresses(prev => prev.filter(a => a.id !== id));
      toast.success('Address removed');
    } catch {
      toast.error('Failed to remove address');
    } finally {
      setDeletingId(null);
    }
  };

  const field = (key: keyof typeof form, label: string, placeholder: string, required = false, type = 'text') => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
      />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Saved Addresses</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Manage delivery addresses for faster checkout</p>
        </div>
        {!showForm && (
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors">
            <Plus className="w-4 h-4" /> Add Address
          </button>
        )}
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-black text-gray-900">{editId ? 'Edit Address' : 'New Address'}</h2>
            <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            {/* Label */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Label</label>
              <div className="flex gap-2">
                {['Home', 'Office', 'Other'].map(l => (
                  <button key={l} type="button"
                    onClick={() => setForm(p => ({ ...p, label: l }))}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${form.label === l ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field('name', 'Full Name', 'Recipient name', true)}
              {field('phone', 'Phone', '+977 98XXXXXXXX', true, 'tel')}
            </div>
            {field('address', 'Street Address', 'House no., street, area', true)}
            <div className="grid grid-cols-2 gap-4">
              {field('city', 'City', 'Kathmandu', true)}
              {field('state', 'Province / State', 'Bagmati', true)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {field('zip', 'Postal Code', '44600')}
              {field('country', 'Country', 'Nepal')}
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={closeForm}
                className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-60 transition-colors text-sm flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? 'Saving…' : 'Save Address'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Address List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : addresses.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <MapPin className="w-7 h-7 text-gray-300" />
          </div>
          <p className="font-bold text-gray-900 mb-1">No saved addresses</p>
          <p className="text-sm text-gray-400 mb-5">Add an address for faster checkout</p>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors">
            <Plus className="w-4 h-4" /> Add First Address
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map(a => (
            <div key={a.id} className={`bg-white rounded-2xl border p-5 transition-all ${a.isDefault ? 'border-blue-200 shadow-sm' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${a.isDefault ? 'bg-blue-600' : 'bg-gray-100'}`}>
                    <MapPin className={`w-4 h-4 ${a.isDefault ? 'text-white' : 'text-gray-500'}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 text-sm">{a.label}</span>
                      {a.isDefault && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-full">
                          <Star className="w-2.5 h-2.5 fill-current" /> Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-700 mt-0.5">{a.name}</p>
                    <p className="text-sm text-gray-500">{a.phone}</p>
                    <p className="text-sm text-gray-500 mt-1">{a.address}, {a.city}, {a.state}{a.zip ? ` ${a.zip}` : ''}, {a.country}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!a.isDefault && (
                    <button onClick={() => handleSetDefault(a.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      Set default
                    </button>
                  )}
                  <button onClick={() => openEdit(a)}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(a.id)} disabled={deletingId === a.id}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40">
                    {deletingId === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
