'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Plus, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { productsApi, categoriesApi, uploadsApi } from '@/lib/api';
import { Category } from '@/types';
import { toast } from 'sonner';

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  basePrice: z.coerce.number().min(1, 'Price must be positive'),
  categoryId: z.string().optional(),
  tags: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const COLORS = ['White', 'Black', 'Navy', 'Gray', 'Red', 'Forest Green', 'Maroon', 'Royal Blue'];

export default function NewDesignPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<{ url: string; publicId: string }[]>([]);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [variants, setVariants] = useState<{ size: string; color: string; stock: number; price: number }[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['M', 'L']);
  const [selectedColors, setSelectedColors] = useState<string[]>(['White', 'Black']);
  const [variantPrice, setVariantPrice] = useState(799);
  const [variantStock, setVariantStock] = useState(20);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { basePrice: 799 },
  });

  React.useEffect(() => {
    categoriesApi.list().then(({ data }) => setCategories(data.data ?? []));
  }, []);

  const onDrop = useCallback(async (files: File[]) => {
    for (const file of files.slice(0, 5 - images.length)) {
      setUploadingImg(true);
      try {
        const { data } = await uploadsApi.upload(file);
        setImages(prev => [...prev, { url: data.data.secure_url, publicId: data.data.public_id }]);
      } catch { toast.error('Image upload failed'); }
      finally { setUploadingImg(false); }
    }
  }, [images.length]);

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'image/*': [] }, maxFiles: 5 });

  const generateVariants = () => {
    const generated = [];
    for (const size of selectedSizes) {
      for (const color of selectedColors) {
        generated.push({ size, color, stock: variantStock, price: variantPrice });
      }
    }
    setVariants(generated);
    toast.success(`${generated.length} variants generated`);
  };

  const onSubmit = async (data: FormData) => {
    if (images.length === 0) { toast.error('Add at least one product image'); return; }
    try {
      await productsApi.create({
        ...data,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
        imageUrls: images.map(i => i.url),
        variants: variants.length > 0 ? variants : undefined,
      });
      toast.success('Design submitted for review!');
      router.push('/vendor/designs');
    } catch (err: any) {
      toast.error(err.response?.data?.message?.error ?? 'Failed to create product');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Upload New Design</h1>
        <p className="text-gray-500 mt-1">Your design will be reviewed before going live</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Images */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-black text-gray-900 mb-4">Product Images</h2>
          <div className="flex gap-3 flex-wrap">
            {images.map((img, i) => (
              <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                  <X className="w-3 h-3" />
                </button>
                {i === 0 && <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded">Primary</span>}
              </div>
            ))}
            {images.length < 5 && (
              <div {...getRootProps()} className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-gray-300 transition-colors">
                <input {...getInputProps()} />
                {uploadingImg ? <Loader2 className="w-5 h-5 text-gray-400 animate-spin" /> : <Plus className="w-6 h-6 text-gray-300" />}
                <span className="text-xs text-gray-400 mt-1">{uploadingImg ? 'Uploading' : 'Add'}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-3">Up to 5 images · PNG, JPG · Max 10MB each</p>
        </div>

        {/* Details */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-black text-gray-900">Product Details</h2>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title *</label>
            <input {...register('title')} placeholder="e.g. Minimalist Mountain Tee"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea {...register('description')} rows={3} placeholder="Describe your design..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Base Price (Rs.) *</label>
              <input {...register('basePrice')} type="number" min="1"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
              {errors.basePrice && <p className="text-xs text-red-500 mt-1">{errors.basePrice.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
              <select {...register('categoryId')} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tags (comma separated)</label>
            <input {...register('tags')} placeholder="minimal, mountain, outdoor, nature"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
          </div>
        </div>

        {/* Variants */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-black text-gray-900">Variants</h2>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Sizes</p>
            <div className="flex flex-wrap gap-2">
              {SIZES.map(s => (
                <button type="button" key={s} onClick={() => setSelectedSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                  className={`px-3 py-1.5 rounded-lg text-sm border-2 font-medium transition-all ${selectedSizes.includes(s) ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Colors</p>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button type="button" key={c} onClick={() => setSelectedColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                  className={`px-3 py-1.5 rounded-lg text-sm border-2 font-medium transition-all ${selectedColors.includes(c) ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Variant Price (Rs.)</label>
              <input type="number" value={variantPrice} onChange={e => setVariantPrice(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Stock per variant</label>
              <input type="number" value={variantStock} onChange={e => setVariantStock(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
            </div>
          </div>
          <button type="button" onClick={generateVariants}
            className="px-4 py-2.5 bg-blue-50 text-blue-700 text-sm font-semibold rounded-xl hover:bg-blue-100 transition-colors border border-blue-200">
            Generate {selectedSizes.length * selectedColors.length} Variants
          </button>
          {variants.length > 0 && (
            <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-100">
              <div className="divide-y divide-gray-50">
                {variants.map((v, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-gray-700">{v.size} / {v.color}</span>
                    <div className="flex gap-4 text-gray-500">
                      <span>Stock: {v.stock}</span>
                      <span className="font-semibold text-gray-900">Rs.{v.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting}
            className="flex-1 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      </form>
    </div>
  );
}
