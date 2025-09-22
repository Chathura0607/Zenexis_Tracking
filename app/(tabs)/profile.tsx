import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Package, Clock, CircleCheck as CheckCircle, Settings, LogOut, Bell, Shield } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getUserParcels } from '@/services/parcelService';
import { router } from 'expo-router';

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
              router.replace('/(auth)/login');
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
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <View className="bg-white px-6 py-8">
          <View className="items-center mb-6">
            <View className="bg-primary-500 rounded-full p-4 mb-4">
              <User size={32} color="white" />
            </View>
            <Text className="text-2xl font-bold text-gray-900">{user?.email}</Text>
            <Text className="text-gray-600 mt-1">Member since {new Date().getFullYear()}</Text>
          </View>

          <View className="flex-row justify-around bg-gray-50 rounded-lg p-4">
            <View className="items-center">
              <Text className="text-2xl font-bold text-gray-900">{stats.total}</Text>
              <Text className="text-gray-600 text-sm">Total Parcels</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-yellow-600">{stats.pending}</Text>
              <Text className="text-gray-600 text-sm">Pending</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-blue-600">{stats.inTransit}</Text>
              <Text className="text-gray-600 text-sm">In Transit</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-green-600">{stats.delivered}</Text>
              <Text className="text-gray-600 text-sm">Delivered</Text>
            </View>
          </View>
        </View>

        <View className="px-6 py-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Settings</Text>
          
          <View className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                className={`flex-row items-center p-4 ${
                  index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
                }`}
                onPress={() => Alert.alert('Coming Soon', 'This feature will be available soon!')}
              >
                <View className="bg-gray-100 rounded-full p-2 mr-4">
                  <item.icon size={20} color="#6b7280" />
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-gray-900">{item.title}</Text>
                  <Text className="text-gray-600 text-sm mt-1">{item.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="px-6 py-4">
          <TouchableOpacity
            className="bg-red-500 rounded-lg p-4 flex-row items-center justify-center"
            onPress={handleLogout}
          >
            <LogOut size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Logout</Text>
          </TouchableOpacity>
        </View>

        <View className="px-6 py-4 items-center">
          <Text className="text-gray-500 text-sm">ParcelTracker v1.0.0</Text>
          <Text className="text-gray-500 text-sm mt-1">Made with ❤️ for parcel tracking</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}