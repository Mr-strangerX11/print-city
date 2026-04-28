'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { vendorsApi } from '@/lib/api';
import { toast } from 'sonner';

export default function VendorSettingsPage() {
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<any>();

  useEffect(() => {
    vendorsApi.getProfile().then(({ data }) => {
      reset({ storeName: data.data.storeName, description: data.data.description });
    }).finally(() => setLoading(false));
  }, [reset]);

  const onSubmit = async (data: any) => {
    try {
      await vendorsApi.updateProfile(data);
      toast.success('Profile updated');
    } catch { toast.error('Failed to update'); }
  };

  if (loading) return <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />;

  return (
    <div className="space-y-6 max-w-lg animate-fade-in">
      <h1 className="text-2xl font-black text-gray-900">Store Settings</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Store Name</label>
          <input {...register('storeName')} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
          <textarea {...register('description')} rows={4} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
        </div>
        <button type="submit" disabled={isSubmitting}
          className="w-full py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Changes
        </button>
      </form>
    </div>
  );
}
