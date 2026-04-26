import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!form.name || !form.email || !form.password) { setError('Please fill in all required fields'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    setError('');
    try {
      await register({ ...form, email: form.email.trim().toLowerCase() });
      router.back();
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const f = (key: keyof typeof form) => ({
    value: form[key],
    onChangeText: (v: string) => setForm(p => ({ ...p, [key]: v })),
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.sub}>Join Print City and start printing</Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.field}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput {...f('name')} style={styles.input} placeholder="Jane Doe" autoComplete="name" />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Email *</Text>
            <TextInput {...f('email')} style={styles.input} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Phone</Text>
            <TextInput {...f('phone')} style={styles.input} placeholder="98XXXXXXXX" keyboardType="phone-pad" />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Password *</Text>
            <TextInput {...f('password')} style={styles.input} placeholder="Min. 8 characters" secureTextEntry autoComplete="new-password" />
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/login')} style={{ marginTop: 16, alignItems: 'center' }}>
            <Text style={styles.switchText}>Already have an account? <Text style={{ color: '#7C3AED', fontWeight: '700' }}>Sign In</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { padding: 24, gap: 14 },
  header: { marginTop: 12, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: '#111827' },
  sub: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151' },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111827', backgroundColor: '#F9FAFB' },
  submitBtn: { backgroundColor: '#7C3AED', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  error: { backgroundColor: '#FEF2F2', color: '#EF4444', fontSize: 13, padding: 12, borderRadius: 10, fontWeight: '500' },
  switchText: { fontSize: 13, color: '#6B7280' },
});
