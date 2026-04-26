import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  TextInput, ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { productsApi } from '../../src/lib/api';

export default function ExploreScreen() {
  const params = useLocalSearchParams<{ q?: string; categoryId?: string }>();
  const [query, setQuery] = useState(params.q ?? '');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const load = async (reset = false) => {
    if (loading) return;
    setLoading(true);
    const currentPage = reset ? 1 : page;
    try {
      const { data } = await productsApi.list({
        search: query || undefined,
        categoryId: params.categoryId || undefined,
        page: currentPage,
        limit: 20,
      });
      const items = data.data?.items ?? [];
      setProducts(reset ? items : (prev) => [...prev, ...items]);
      setHasMore(items.length === 20);
      if (reset) setPage(2); else setPage(p => p + 1);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(true); }, [query, params.categoryId]);

  const fmt = (n: number) => `Rs. ${Number(n).toLocaleString('en-NP')}`;

  return (
    <SafeAreaView style={styles.container}>
      {/* Search header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Search size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products…"
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
        </View>
      </View>

      <FlatList
        data={products}
        keyExtractor={i => i.id}
        numColumns={2}
        contentContainerStyle={{ padding: 12, gap: 10 }}
        columnWrapperStyle={{ gap: 10 }}
        onEndReached={() => hasMore && load()}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          loading ? <ActivityIndicator size="large" color="#7C3AED" style={{ marginTop: 60 }} /> : (
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Text style={{ color: '#9CA3AF', fontSize: 14 }}>No products found</Text>
            </View>
          )
        }
        ListFooterComponent={!loading || products.length === 0 ? null : <ActivityIndicator color="#7C3AED" style={{ marginVertical: 16 }} />}
        renderItem={({ item: p }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/product/${p.slug}`)}>
            <Image source={{ uri: p.images?.[0]?.url ?? 'https://placehold.co/200' }} style={styles.image} resizeMode="cover" />
            <View style={{ padding: 10 }}>
              <Text style={styles.title} numberOfLines={2}>{p.title}</Text>
              <Text style={styles.store}>{p.vendor?.storeName}</Text>
              <Text style={styles.price}>{fmt(p.basePrice)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, gap: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6' },
  image: { width: '100%', height: 130 },
  title: { fontSize: 12, fontWeight: '700', color: '#111827', marginBottom: 2 },
  store: { fontSize: 10, color: '#9CA3AF', marginBottom: 4 },
  price: { fontSize: 13, fontWeight: '800', color: '#7C3AED' },
});
