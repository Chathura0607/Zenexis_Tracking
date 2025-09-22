import { useAuth } from '@/contexts/AuthContext';
import { Link, router } from 'expo-router';
import { Package } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signup(email, password, name);
      router.replace('/(tabs)/track');
    } catch (error: any) {
      console.error('Signup error:', error);
      let errorMessage = 'Failed to create account. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please use a different email.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.code === 'auth/invalid-api-key') {
        errorMessage = 'Configuration error. Please contact support.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={s.content}>
          <View style={s.heroWrap}>
            <View style={s.heroIcon}><Package size={32} color="white" /></View>
            <Text style={s.title}>Join ParcelTracker</Text>
            <Text style={s.subtitle}>Create your account today</Text>
          </View>

          <View style={s.formStack}>
            <View>
              <Text style={s.label}>Full Name</Text>
              <TextInput style={s.input} placeholder="Enter your full name" value={name} onChangeText={setName} placeholderTextColor="#6b7280" />
            </View>
            <View>
              <Text style={s.label}>Email</Text>
              <TextInput style={s.input} placeholder="Enter your email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#6b7280" />
            </View>
            <View>
              <Text style={s.label}>Password</Text>
              <TextInput style={s.input} placeholder="Enter your password" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="#6b7280" />
            </View>
            <View>
              <Text style={s.label}>Confirm Password</Text>
              <TextInput style={s.input} placeholder="Confirm your password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholderTextColor="#6b7280" />
            </View>

            <TouchableOpacity style={[s.primaryBtn, loading && { opacity: 0.5 }]} onPress={handleSignup} disabled={loading}>
              <Text style={s.primaryBtnText}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
            </TouchableOpacity>

            <View style={s.inlineCenter}>
              <Text style={s.muted}>Already have an account? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={s.link}>Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  heroWrap: { alignItems: 'center', marginBottom: 48 },
  heroIcon: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 999, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  subtitle: { color: '#4b5563', marginTop: 8 },
  formStack: { rowGap: 16 },
  label: { color: '#374151', fontWeight: '500', marginBottom: 8 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: '#111827' },
  primaryBtn: { backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  primaryBtnText: { color: 'white', fontWeight: '600', fontSize: 18 },
  inlineCenter: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  muted: { color: '#4b5563' },
  link: { color: '#3b82f6', fontWeight: '500' },
});