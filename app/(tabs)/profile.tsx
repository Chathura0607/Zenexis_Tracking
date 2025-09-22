import { useAuth } from '@/contexts/AuthContext';
import { getUserParcels } from '@/services/parcelService';
import { Bell, LogOut, Settings, Shield, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import or define the Parcel type
import type { Parcel } from '@/services/parcelService';

export default function Profile() {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  useEffect(() => {
    loadParcels();
  }, [user]);

  const loadParcels = async () => {
    if (!user) return;
    
    try {
      const userParcels = await getUserParcels(user.uid);
      setParcels(userParcels);
    } catch (error) {
      console.error('Failed to load parcels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Navigation handled by TabLayout when user becomes null
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  const stats = {
    total: parcels.length,
    pending: parcels.filter((p: any) => p.status === 'pending').length,
    inTransit: parcels.filter((p: any) => p.status === 'in-transit').length,
    delivered: parcels.filter((p: any) => p.status === 'delivered').length,
  };

  const menuItems = [
    { icon: Bell, title: 'Notifications', subtitle: 'Manage notification preferences' },
    { icon: Shield, title: 'Privacy & Security', subtitle: 'Account security settings' },
    { icon: Settings, title: 'App Settings', subtitle: 'Customize your experience' },
  ];

  return (
    <SafeAreaView style={p.container}>
      <ScrollView style={{ flex: 1 }}>
        <View style={p.headerWrap}>
          <View style={p.centerItems}>
            <View style={p.avatar}><User size={32} color="white" /></View>
            <Text style={p.title}>{user?.email}</Text>
            <Text style={p.subtle}>Member since {new Date().getFullYear()}</Text>
          </View>

          <View style={p.statsRow}>
            <View style={p.statItem}>
              <Text style={p.statNumber}>{stats.total}</Text>
              <Text style={p.statLabel}>Total Parcels</Text>
            </View>
            <View style={p.statItem}>
              <Text style={[p.statNumber, { color: '#d97706' }]}>{stats.pending}</Text>
              <Text style={p.statLabel}>Pending</Text>
            </View>
            <View style={p.statItem}>
              <Text style={[p.statNumber, { color: '#2563eb' }]}>{stats.inTransit}</Text>
              <Text style={p.statLabel}>In Transit</Text>
            </View>
            <View style={p.statItem}>
              <Text style={[p.statNumber, { color: '#16a34a' }]}>{stats.delivered}</Text>
              <Text style={p.statLabel}>Delivered</Text>
            </View>
          </View>
        </View>

        <View style={p.section}>
          <Text style={p.sectionTitle}>Settings</Text>
          <View style={p.menuCard}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[p.menuRow, index !== menuItems.length - 1 && p.menuRowDivider]}
                onPress={() => Alert.alert('Coming Soon', 'This feature will be available soon!')}
              >
                <View style={p.menuIcon}><item.icon size={20} color="#6b7280" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={p.menuTitle}>{item.title}</Text>
                  <Text style={p.menuSubtitle}>{item.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={p.section}>
          <TouchableOpacity style={p.logoutBtn} onPress={handleLogout}>
            <LogOut size={20} color="white" />
            <Text style={p.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={[p.section, p.centerItems]}>
          <Text style={p.footerText}>ParcelTracker v1.0.0</Text>
          <Text style={[p.footerText, { marginTop: 4 }]}>Made with ❤️ for parcel tracking</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const p = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  headerWrap: { backgroundColor: '#ffffff', paddingHorizontal: 24, paddingVertical: 24 },
  centerItems: { alignItems: 'center' },
  avatar: { backgroundColor: '#3b82f6', borderRadius: 999, padding: 16, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  subtle: { color: '#6b7280', marginTop: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#f3f4f6', borderRadius: 12, padding: 16, marginTop: 16 },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: '700', color: '#111827' },
  statLabel: { color: '#4b5563', fontSize: 12 },
  section: { paddingHorizontal: 24, paddingVertical: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 16 },
  menuCard: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#f3f4f6', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuRowDivider: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  menuIcon: { backgroundColor: '#f3f4f6', borderRadius: 999, padding: 8, marginRight: 16 },
  menuTitle: { fontWeight: '500', color: '#111827' },
  menuSubtitle: { color: '#4b5563', fontSize: 12, marginTop: 4 },
  logoutBtn: { backgroundColor: '#ef4444', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  logoutText: { color: 'white', fontWeight: '600', marginLeft: 8 },
  footerText: { color: '#6b7280', fontSize: 12, textAlign: 'center' },
});