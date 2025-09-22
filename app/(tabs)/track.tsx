import { useAuth } from '@/contexts/AuthContext';
import { getUserParcels } from '@/services/parcelService';
import { Parcel } from '@/types/parcel';
import { CircleCheck as CheckCircle, Clock, MapPin, Package, Search, Truck, Circle as XCircle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Track Parcels</Text>
        <View style={styles.searchWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by tracking number or title..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#6b7280"
          />
          <View style={styles.searchIcon}>
            <Search size={20} color="#6b7280" />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {loading ? (
          <View style={styles.centered}>
            <Text style={styles.mutedText}>Loading parcels...</Text>
          </View>
        ) : filteredParcels.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={48} color="#9ca3af" />
            <Text style={[styles.mutedText, styles.mt4, styles.textCenter]}>
              {searchQuery ? 'No parcels match your search' : 'No parcels found'}
            </Text>
            {!searchQuery && (
              <Text style={[styles.subtleText, styles.mt2, styles.textCenter]}>
                Add your first parcel to start tracking
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.cardsStack}>
            {filteredParcels.map((parcel) => (
              <View key={parcel.id} style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.flex1}>
                    <Text style={styles.cardTitle}>{parcel.title}</Text>
                    <Text style={styles.cardSubtitle}>{parcel.trackingNumber}</Text>
                  </View>
                  <View style={[styles.statusPill, getStatusPillStyle(parcel.status)]}>
                    <StatusIcon status={parcel.status} />
                    <Text style={styles.statusText}>{parcel.status}</Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.inlineRow}>
                    <MapPin size={16} color="#6b7280" />
                    <Text style={styles.inlineText}>{parcel.recipientAddress}</Text>
                  </View>

                  <View style={styles.inlineRow}>
                    <Clock size={16} color="#6b7280" />
                    <Text style={styles.inlineText}>Created: {formatDate(parcel.createdAt)}</Text>
                  </View>
                </View>

                {parcel.statusHistory && parcel.statusHistory.length > 0 && (
                  <View style={styles.cardFooter}>
                    <Text style={styles.footerHeading}>Latest Update:</Text>
                    <View style={styles.inlineRow}>
                      <StatusIcon status={parcel.statusHistory[0].status} />
                      <View style={styles.flex1}>
                        <Text style={styles.inlineTitle}>{parcel.statusHistory[0].status}</Text>
                        <Text style={styles.inlineSubtle}>{parcel.statusHistory[0].location}</Text>
                      </View>
                      <Text style={styles.inlineSubtle}>{formatDate(parcel.statusHistory[0].timestamp)}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#ffffff' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 24 },
  searchWrapper: { position: 'relative' },
  searchInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingLeft: 48,
    paddingRight: 16,
    paddingVertical: 12,
    color: '#111827',
  },
  searchIcon: { position: 'absolute', left: 16, top: 10 },
  listContainer: { paddingHorizontal: 24, paddingVertical: 16, flexGrow: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mutedText: { color: '#4b5563' },
  subtleText: { color: '#6b7280' },
  textCenter: { textAlign: 'center' },
  mt2: { marginTop: 8 },
  mt4: { marginTop: 16 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  cardsStack: { gap: 16 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  flex1: { flex: 1 },
  cardTitle: { fontWeight: '600', color: '#111827', fontSize: 18 },
  cardSubtitle: { color: '#4b5563', fontSize: 12, marginTop: 4 },
  statusPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, flexDirection: 'row', alignItems: 'center' },
  statusText: { marginLeft: 8, fontSize: 14, fontWeight: '500', textTransform: 'capitalize' },
  cardBody: { gap: 8 },
  inlineRow: { flexDirection: 'row', alignItems: 'center' },
  inlineText: { marginLeft: 8, color: '#4b5563', fontSize: 12, flex: 1 },
  cardFooter: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  footerHeading: { fontSize: 12, fontWeight: '600', color: '#111827', marginBottom: 8 },
  inlineTitle: { fontSize: 14, color: '#111827', textTransform: 'capitalize' },
  inlineSubtle: { fontSize: 12, color: '#6b7280' },
});

function getStatusPillStyle(status: string) {
  switch (status) {
    case 'pending':
      return { backgroundColor: '#fffbeb' };
    case 'in-transit':
      return { backgroundColor: '#eff6ff' };
    case 'delivered':
      return { backgroundColor: '#ecfdf5' };
    case 'cancelled':
      return { backgroundColor: '#fef2f2' };
    default:
      return { backgroundColor: '#f9fafb' };
  }
}