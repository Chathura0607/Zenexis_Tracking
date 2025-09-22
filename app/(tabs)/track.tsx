import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, Clock, CircleCheck as CheckCircle, Circle as XCircle, Truck, Package } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getUserParcels } from '@/services/parcelService';
import { Parcel } from '@/types/parcel';

const StatusIcon = ({ status }: { status: string }) => {
  const iconProps = { size: 20 };
  
  switch (status) {
    case 'pending':
      return <Clock {...iconProps} color="#f59e0b" />;
    case 'in-transit':
      return <Truck {...iconProps} color="#3b82f6" />;
    case 'delivered':
      return <CheckCircle {...iconProps} color="#10b981" />;
    case 'cancelled':
      return <XCircle {...iconProps} color="#ef4444" />;
    default:
      return <Clock {...iconProps} color="#6b7280" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'text-yellow-600 bg-yellow-50';
    case 'in-transit': return 'text-blue-600 bg-blue-50';
    case 'delivered': return 'text-green-600 bg-green-50';
    case 'cancelled': return 'text-red-600 bg-red-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

export default function Track() {
  const [searchQuery, setSearchQuery] = useState('');
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadParcels();
  }, [user]);

  const loadParcels = async () => {
    if (!user) return;
    
    try {
      const userParcels = await getUserParcels(user.uid);
      setParcels(userParcels);
    } catch (error) {
      Alert.alert('Error', 'Failed to load parcels');
    } finally {
      setLoading(false);
    }
  };

  const filteredParcels = parcels.filter(parcel =>
    parcel.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    parcel.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 py-4 bg-white">
        <Text className="text-2xl font-bold text-gray-900 mb-6">Track Parcels</Text>
        
        <View className="relative">
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-lg pl-12 pr-4 py-3 text-gray-900"
            placeholder="Search by tracking number or title..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Search className="absolute left-4 top-3" size={20} color="#6b7280" />
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-gray-600">Loading parcels...</Text>
          </View>
        ) : filteredParcels.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20">
            <Package size={48} color="#9ca3af" />
            <Text className="text-gray-600 mt-4 text-center">
              {searchQuery ? 'No parcels match your search' : 'No parcels found'}
            </Text>
            {!searchQuery && (
              <Text className="text-gray-500 mt-2 text-center">
                Add your first parcel to start tracking
              </Text>
            )}
          </View>
        ) : (
          <View className="space-y-4">
            {filteredParcels.map((parcel) => (
              <View key={parcel.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900 text-lg">{parcel.title}</Text>
                    <Text className="text-gray-600 text-sm mt-1">{parcel.trackingNumber}</Text>
                  </View>
                  <View className={`px-3 py-1 rounded-full flex-row items-center ${getStatusColor(parcel.status)}`}>
                    <StatusIcon status={parcel.status} />
                    <Text className="ml-2 text-sm font-medium capitalize">{parcel.status}</Text>
                  </View>
                </View>

                <View className="space-y-2">
                  <View className="flex-row items-center">
                    <MapPin size={16} color="#6b7280" />
                    <Text className="ml-2 text-gray-600 text-sm flex-1">{parcel.recipientAddress}</Text>
                  </View>
                  
                  <View className="flex-row items-center">
                    <Clock size={16} color="#6b7280" />
                    <Text className="ml-2 text-gray-600 text-sm">Created: {formatDate(parcel.createdAt)}</Text>
                  </View>
                </View>

                {parcel.statusHistory && parcel.statusHistory.length > 0 && (
                  <View className="mt-3 pt-3 border-t border-gray-100">
                    <Text className="text-sm font-medium text-gray-900 mb-2">Latest Update:</Text>
                    <View className="flex-row items-center">
                      <StatusIcon status={parcel.statusHistory[0].status} />
                      <View className="ml-2 flex-1">
                        <Text className="text-sm text-gray-900 capitalize">{parcel.statusHistory[0].status}</Text>
                        <Text className="text-xs text-gray-500">{parcel.statusHistory[0].location}</Text>
                      </View>
                      <Text className="text-xs text-gray-500">
                        {formatDate(parcel.statusHistory[0].timestamp)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}