import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  ActivityIndicator, StyleSheet, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Heart, ShoppingBag, Star, ChevronLeft } from 'lucide-react-native';
import { productsApi, cartApi, wishlistApi } from '../../src/lib/api';
import { useAuth } from '../../src/context/AuthContext';

const { width } = Dimensions.get('window');

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { user } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [adding, setAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [imageIdx, setImageIdx] = useState(0);

  useEffect(() => {
    productsApi.get(slug).then(({ data }) => {
      const p = data.data;
      setProduct(p);
      setSelectedVariant(p.variants?.[0] ?? null);
    }).finally(() => setLoading(false));
  }, [slug]);

  const addToCart = async () => {
    if (!user) { router.push('/login'); return; }
    if (!selectedVariant) { Alert.alert('Please select a variant'); return; }
    setAdding(true);
    try {
      await cartApi.addItem(selectedVariant.id, 1);
      Alert.alert('Added to cart', product.title, [
        { text: 'Continue', style: 'cancel' },
        { text: 'View Cart', onPress: () => router.push('/(tabs)/cart') },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message ?? 'Could not add to cart');
    } finally { setAdding(false); }
  };

  const toggleWishlist = async () => {
    if (!user) { router.push('/login'); return; }
    try {
      await wishlistApi.toggle(product.id);
      setWishlisted(w => !w);
    } catch {}
  };

  const fmt = (n: number) => `Rs. ${Number(n).toLocaleString('en-NP')}`;

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#7C3AED" />
    </View>
  );

  if (!product) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#9CA3AF' }}>Product not found</Text>
    </View>
  );

  const images = product.images ?? [];

  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <ChevronLeft size={22} color="#111827" />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Images */}
        <View>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={e => setImageIdx(Math.round(e.nativeEvent.contentOffset.x / width))}>
            {images.length > 0 ? images.map((img: any, i: number) => (
              <Image key={i} source={{ uri: img.url }} style={{ width, height: 340 }} resizeMode="cover" />
            )) : <Image source={{ uri: 'https://placehold.co/400x340' }} style={{ width, height: 340 }} resizeMode="cover" />}
          </ScrollView>
          {images.length > 1 && (
            <View style={styles.dots}>
              {images.map((_: any, i: number) => (
                <View key={i} style={[styles.dot, { opacity: i === imageIdx ? 1 : 0.3 }]} />
              ))}
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Title & vendor */}
          <Text style={styles.title}>{product.title}</Text>
          <Text style={styles.store}>{product.vendor?.storeName}</Text>

          {/* Rating */}
          {product._count?.reviews > 0 && (
            <View style={styles.ratingRow}>
              <Star size={14} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingText}>{product.avgRating?.toFixed(1) ?? '—'} ({product._count.reviews} reviews)</Text>
            </View>
          )}

          {/* Price */}
          <Text style={styles.price}>{fmt(selectedVariant?.price ?? product.basePrice)}</Text>

          {/* Variants */}
          {product.variants?.length > 0 && (
            <View style={styles.variantsSection}>
              <Text style={styles.sectionLabel}>Size / Variant</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {product.variants.map((v: any) => (
                  <TouchableOpacity
                    key={v.id}
                    onPress={() => setSelectedVariant(v)}
                    style={[styles.variantChip, selectedVariant?.id === v.id && styles.variantChipActive]}
                  >
                    <Text style={[styles.variantText, selectedVariant?.id === v.id && { color: '#fff' }]}>
                      {v.size}{v.color ? ` · ${v.color}` : ''}
                    </Text>
                    {v.stock === 0 && <Text style={{ fontSize: 9, color: '#EF4444' }}>Out of stock</Text>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Description */}
          {product.description && (
            <View style={styles.descSection}>
              <Text style={styles.sectionLabel}>Description</Text>
              <Text style={styles.desc}>{product.description}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <TouchableOpacity style={styles.wishlistBtn} onPress={toggleWishlist}>
          <Heart size={20} color={wishlisted ? '#EF4444' : '#6B7280'} fill={wishlisted ? '#EF4444' : 'none'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.addBtn, (!selectedVariant || selectedVariant.stock === 0 || adding) && { opacity: 0.6 }]}
          onPress={addToCart}
          disabled={!selectedVariant || selectedVariant.stock === 0 || adding}
        >
          {adding ? <ActivityIndicator color="#fff" size="small" /> : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ShoppingBag size={18} color="#fff" />
              <Text style={styles.addText}>
                {selectedVariant?.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  backBtn: { position: 'absolute', top: 52, left: 16, zIndex: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, position: 'absolute', bottom: 12, left: 0, right: 0 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#7C3AED' },
  content: { padding: 20, gap: 12 },
  title: { fontSize: 20, fontWeight: '900', color: '#111827' },
  store: { fontSize: 13, color: '#9CA3AF' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13, color: '#6B7280' },
  price: { fontSize: 24, fontWeight: '900', color: '#7C3AED' },
  variantsSection: { gap: 8 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#374151' },
  variantChip: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
  variantChipActive: { borderColor: '#7C3AED', backgroundColor: '#7C3AED' },
  variantText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  descSection: { gap: 6 },
  desc: { fontSize: 14, color: '#6B7280', lineHeight: 22 },
  footer: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: '#fff' },
  wishlistBtn: { width: 48, height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  addBtn: { flex: 1, backgroundColor: '#7C3AED', borderRadius: 14, height: 48, alignItems: 'center', justifyContent: 'center' },
  addText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
