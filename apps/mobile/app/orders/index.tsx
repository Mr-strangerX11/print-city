import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Package, ChevronRight } from 'lucide-react-native';
import { ordersApi } from '../../src/lib/api';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#FEF9C3', text: '#854D0E' },
  CONFIRMED: { bg: '#DBEAFE', text: '#1E40AF' },
  PRINTING: { bg: '#EDE9FE', text: '#5B21B6' },
  PACKED: { bg: '#CFFAFE', text: '#0E7490' },
  SHIPPED: { bg: '#E0E7FF', text: '#3730A3' },
  DELIVERED: { bg: '#DCFCE7', text: '#14532D' },
  CANCELLED: { bg: '#F3F4F6', text: '#374151' },
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.list().then(({ data }) => setOrders(data.data?.items ?? [])).finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => `Rs. ${Number(n).toLocaleString('en-NP')}`;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) return (
    <SafeAreaView style={styles.container}>
      <ActivityIndicator size="large" color="#7C3AED" style={{ marginTop: 60 }} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <ChevronRight size={22} color="#111827" style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 60, gap: 8 }}>
            <Package size={48} color="#D1D5DB" />
            <Text style={{ color: '#9CA3AF', fontSize: 15, fontWeight: '600' }}>No orders yet</Text>
          </View>
        }
        renderItem={({ item }) => {
          const sc = STATUS_COLORS[item.orderStatus] ?? { bg: '#F3F4F6', text: '#374151' };
          return (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/orders/${item.id}`)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderId}>Order #{item.id.slice(-8).toUpperCase()}</Text>
                <Text style={styles.orderDate}>{fmtDate(item.createdAt)}</Text>
                <Text style={styles.orderItems}>{item.items?.length ?? 0} item(s)</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                  <Text style={[styles.statusText, { color: sc.text }]}>{item.orderStatus.replace(/_/g, ' ')}</Text>
                </View>
                <Text style={styles.amount}>{fmt(item.totalAmount)}</Text>
              </View>
              <ChevronRight size={16} color="#D1D5DB" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#111827' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F3F4F6' },
  orderId: { fontSize: 14, fontWeight: '800', color: '#111827' },
  orderDate: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  orderItems: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  amount: { fontSize: 14, fontWeight: '800', color: '#111827' },
});
