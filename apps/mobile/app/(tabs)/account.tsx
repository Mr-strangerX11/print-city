import React from 'react';
import {
  View, Text, TouchableOpacity, Image,
  StyleSheet, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Package, ChevronRight, LogOut, User, Heart, MapPin, HelpCircle } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';

const MenuItem = ({ icon: Icon, label, onPress, danger = false }: any) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={[styles.menuIcon, danger && { backgroundColor: '#FEF2F2' }]}>
      <Icon size={18} color={danger ? '#EF4444' : '#7C3AED'} />
    </View>
    <Text style={[styles.menuLabel, danger && { color: '#EF4444' }]}>{label}</Text>
    <ChevronRight size={16} color={danger ? '#EF4444' : '#D1D5DB'} />
  </TouchableOpacity>
);

export default function AccountScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Log out?', 'You will need to sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  if (!user) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.guestCard}>
        <View style={styles.guestAvatar}>
          <User size={32} color="#9CA3AF" />
        </View>
        <Text style={styles.guestTitle}>Sign in to your account</Text>
        <Text style={styles.guestSub}>View orders, wishlist and more</Text>
        <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/login')}>
          <Text style={styles.signInText}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/register')}>
          <Text style={styles.registerLink}>Create account →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Profile card */}
        <View style={styles.profileCard}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{user.name?.[0]?.toUpperCase()}</Text>
            </View>
          )}
          <View>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          <MenuItem icon={Package} label="My Orders" onPress={() => router.push('/orders')} />
          <MenuItem icon={Heart} label="Wishlist" onPress={() => {}} />
          <MenuItem icon={MapPin} label="Saved Addresses" onPress={() => {}} />
          <MenuItem icon={HelpCircle} label="Support" onPress={() => {}} />
        </View>

        <View style={[styles.menuSection, { marginTop: 12 }]}>
          <MenuItem icon={LogOut} label="Log Out" onPress={handleLogout} danger />
        </View>

        <Text style={styles.version}>Print City v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  guestCard: { margin: 20, backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#F3F4F6' },
  guestAvatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  guestTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  guestSub: { fontSize: 13, color: '#9CA3AF', marginBottom: 8 },
  signInBtn: { backgroundColor: '#7C3AED', borderRadius: 14, paddingHorizontal: 32, paddingVertical: 12, width: '100%', alignItems: 'center' },
  signInText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  registerLink: { fontSize: 13, color: '#7C3AED', fontWeight: '600', marginTop: 4 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', margin: 16, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#F3F4F6' },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: { backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#7C3AED' },
  userName: { fontSize: 16, fontWeight: '800', color: '#111827' },
  userEmail: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  menuSection: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  menuIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827' },
  version: { textAlign: 'center', fontSize: 12, color: '#D1D5DB', marginTop: 24, marginBottom: 8 },
});
