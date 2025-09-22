import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, CircleCheck as CheckCircle, Circle as XCircle, Truck, MapPin, Package, CreditCard } from 'lucide-react-native';
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
    case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'in-transit': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'delivered': return 'text-green-600 bg-green-50 border-green-200';
    case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export default function History() {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
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

  const statusFilters = [
    { key: 'all', label: 'All', count: parcels.length },
    { key: 'pending', label: 'Pending', count: parcels.filter(p => p.status === 'pending').length },
    { key: 'in-transit', label: 'In Transit', count: parcels.filter(p => p.status === 'in-transit').length },
    { key: 'delivered', label: 'Delivered', count: parcels.filter(p => p.status === 'delivered').length },
    { key: 'cancelled', label: 'Cancelled', count: parcels.filter(p => p.status === 'cancelled').length },
  ];

  const filteredParcels = selectedStatus === 'all' 
    ? parcels 
    : parcels.filter(parcel => parcel.status === selectedStatus);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 py-4 bg-white">
        <Text className="text-2xl font-bold text-gray-900 mb-4">Parcel History</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          <View className="flex-row space-x-2">
            {statusFilters.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                className={`px-4 py-2 rounded-full border ${
                  selectedStatus === filter.key
                    ? 'bg-primary-500 border-primary-500'
                    : 'bg-white border-gray-200'
                }`}
                onPress={() => setSelectedStatus(filter.key)}
              >
                <Text className={`font-medium ${
                  selectedStatus === filter.key ? 'text-white' : 'text-gray-700'
                }`}>
                  {filter.label} ({filter.count})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-gray-600">Loading history...</Text>
          </View>
        ) : filteredParcels.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20">
            <Package size={48} color="#9ca3af" />
            <Text className="text-gray-600 mt-4 text-center">
              No parcels found for {selectedStatus === 'all' ? 'this filter' : selectedStatus}
            </Text>
          </View>
        ) : (
          <View className="space-y-4">
            {filteredParcels.map((parcel) => (
              <View key={parcel.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <View className="p-4">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900 text-lg">{parcel.title}</Text>
                      <Text className="text-gray-600 text-sm mt-1">{parcel.trackingNumber}</Text>
                    </View>
                    <View className={`px-3 py-1 rounded-full border flex-row items-center ${getStatusColor(parcel.status)}`}>
                      <StatusIcon status={parcel.status} />
                      <Text className="ml-2 text-sm font-medium capitalize">{parcel.status}</Text>
                    </View>
                  </View>

                  {parcel.description && (
                    <Text className="text-gray-600 text-sm mb-3">{parcel.description}</Text>
                  )}

                  <View className="space-y-2 mb-4">
                    <View className="flex-row items-center">
                      <MapPin size={16} color="#6b7280" />
                      <Text className="ml-2 text-gray-600 text-sm flex-1">
                        From: {parcel.sender} → To: {parcel.recipient}
                      </Text>
                    </View>
                    
                    <View className="flex-row items-center">
                      <Clock size={16} color="#6b7280" />
                      <Text className="ml-2 text-gray-600 text-sm">
                        Created: {formatDate(parcel.createdAt)}
                      </Text>
                    </View>

                    {parcel.paymentInfo && parcel.paymentInfo.amount && (
                      <View className="flex-row items-center">
                        <CreditCard size={16} color="#6b7280" />
                        <Text className="ml-2 text-gray-600 text-sm">
                          Payment: ₹{parcel.paymentInfo.amount} ({parcel.paymentInfo.method})
                        </Text>
                      </View>
                    )}
                  </View>

                  {parcel.statusHistory && parcel.statusHistory.length > 0 && (
                    <View className="border-t border-gray-100 pt-3">
                      <Text className="text-sm font-medium text-gray-900 mb-2">Status History:</Text>
                      {parcel.statusHistory.map((status, index) => (
                        <View key={index} className="flex-row items-center mb-2">
                          <StatusIcon status={status.status} />
                          <View className="ml-2 flex-1">
                            <Text className="text-sm text-gray-900 capitalize">{status.status}</Text>
                            <Text className="text-xs text-gray-500">{status.location}</Text>
                          </View>
                          <Text className="text-xs text-gray-500">
                            {formatDate(status.timestamp)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}