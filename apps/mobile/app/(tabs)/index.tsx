import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  TextInput, FlatList, ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Search, ChevronRight } from 'lucide-react-native';
import { productsApi, categoriesApi } from '../../src/lib/api';
import { useAuth } from '../../src/context/AuthContext';

export default function HomeScreen() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      productsApi.list({ limit: 12 }),
      categoriesApi.list(),
    ]).then(([p, c]) => {
      setProducts(p.data.data?.items ?? []);
      setCategories(c.data.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => `Rs. ${Number(n).toLocaleString('en-NP')}`;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] ?? 'Guest'} 👋</Text>
            <Text style={styles.subGreeting}>What would you like to print?</Text>
          </View>
        </View>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Search size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products…"
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => router.push({ pathname: '/(tabs)/explore', params: { q: search } })}
          />
        </View>

        {/* Categories */}
        {categories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
                <Text style={styles.seeAll}>See all <ChevronRight size={12} color="#7C3AED" /></Text>
              </TouchableOpacity>
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categories.slice(0, 8)}
              keyExtractor={i => i.id}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.categoryChip}
                  onPress={() => router.push({ pathname: '/(tabs)/explore', params: { categoryId: item.id } })}
                >
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.categoryImg} />
                  ) : null}
                  <Text style={styles.categoryLabel}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Featured Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Products</Text>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="#7C3AED" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.productGrid}>
              {products.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.productCard}
                  onPress={() => router.push(`/product/${p.slug}`)}
                >
                  <Image
                    source={{ uri: p.images?.[0]?.url ?? 'https://placehold.co/200' }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                  <View style={styles.productInfo}>
                    <Text style={styles.productTitle} numberOfLines={2}>{p.title}</Text>
                    <Text style={styles.productStore}>{p.vendor?.storeName}</Text>
                    <Text style={styles.productPrice}>{fmt(p.basePrice)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  greeting: { fontSize: 22, fontWeight: '900', color: '#111827' },
  subGreeting: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 16, paddingHorizontal: 14, paddingVertical: 11, gap: 10, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  section: { marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  seeAll: { fontSize: 12, color: '#7C3AED', fontWeight: '600' },
  categoryChip: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#E5E7EB', minWidth: 80 },
  categoryImg: { width: 32, height: 32, borderRadius: 8, marginBottom: 6 },
  categoryLabel: { fontSize: 11, fontWeight: '600', color: '#374151' },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10 },
  productCard: { width: '47%', backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6' },
  productImage: { width: '100%', height: 140 },
  productInfo: { padding: 10 },
  productTitle: { fontSize: 12, fontWeight: '700', color: '#111827', marginBottom: 2 },
  productStore: { fontSize: 10, color: '#9CA3AF', marginBottom: 4 },
  productPrice: { fontSize: 13, fontWeight: '800', color: '#7C3AED' },
});
