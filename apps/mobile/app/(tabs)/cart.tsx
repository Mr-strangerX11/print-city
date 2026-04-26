import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  ActivityIndicator, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react-native';
import { cartApi } from '../../src/lib/api';
import { useAuth } from '../../src/context/AuthContext';

export default function CartScreen() {
  const { user } = useAuth();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const { data } = await cartApi.get();
      setCart(data.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user]);

  const updateQty = async (itemId: string, qty: number) => {
    if (qty === 0) {
      Alert.alert('Remove item?', '', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: async () => { await cartApi.removeItem(itemId); load(); } },
      ]);
      return;
    }
    await cartApi.updateItem(itemId, qty);
    load();
  };

  const fmt = (n: number) => `Rs. ${Number(n).toLocaleString('en-NP')}`;

  if (!user) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.empty}>
        <ShoppingBag size={48} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>Sign in to view your cart</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.push('/login')}>
          <Text style={styles.btnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  if (loading) return (
    <SafeAreaView style={styles.container}>
      <ActivityIndicator size="large" color="#7C3AED" style={{ marginTop: 60 }} />
    </SafeAreaView>
  );

  if (!cart?.items?.length) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.empty}>
        <ShoppingBag size={48} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.push('/(tabs)/explore')}>
          <Text style={styles.btnText}>Browse Products</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cart</Text>
        <Text style={styles.headerSub}>{cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}</Text>
      </View>

      <FlatList
        data={cart.items}
        keyExtractor={(i: any) => i.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 120 }}
        renderItem={({ item }: { item: any }) => (
          <View style={styles.cartItem}>
            <Image
              source={{ uri: item.variant?.product?.images?.[0]?.url ?? 'https://placehold.co/100' }}
              style={styles.cartImage}
              resizeMode="cover"
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle} numberOfLines={2}>{item.variant?.product?.title}</Text>
              <Text style={styles.itemVariant}>{item.variant?.size} · {item.variant?.color}</Text>
              <Text style={styles.itemPrice}>{fmt(Number(item.variant?.price) * item.qty)}</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, item.qty - 1)}>
                  {item.qty === 1 ? <Trash2 size={14} color="#EF4444" /> : <Minus size={14} color="#374151" />}
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.qty}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, item.qty + 1)}>
                  <Plus size={14} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{fmt(cart.subtotal)}</Text>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} onPress={() => router.push('/checkout')}>
          <Text style={styles.checkoutText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#111827' },
  headerSub: { fontSize: 13, color: '#6B7280' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  btn: { backgroundColor: '#7C3AED', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12, marginTop: 4 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  cartItem: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 12, gap: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  cartImage: { width: 80, height: 80, borderRadius: 12 },
  itemTitle: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 2 },
  itemVariant: { fontSize: 11, color: '#9CA3AF', marginBottom: 4 },
  itemPrice: { fontSize: 14, fontWeight: '800', color: '#7C3AED', marginBottom: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: 14, fontWeight: '700', color: '#111827', minWidth: 20, textAlign: 'center' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F3F4F6', padding: 16, gap: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  totalValue: { fontSize: 20, fontWeight: '900', color: '#111827' },
  checkoutBtn: { backgroundColor: '#7C3AED', borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  checkoutText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
