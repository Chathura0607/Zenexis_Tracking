import { useAuth } from '@/contexts/AuthContext';
import { getUserParcels, updateParcelStatus } from '@/services/parcelService';
import { Parcel } from '@/types/parcel';
import { CircleCheck as CheckCircle, Clock, MapPin, Package, Search, Truck, Circle as XCircle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [newStatus, setNewStatus] = useState<'pending' | 'in-transit' | 'delivered' | 'cancelled'>('pending');
  const [location, setLocation] = useState('');
  const [updating, setUpdating] = useState(false);

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

  const openUpdate = (parcel: Parcel) => {
    setSelectedParcel(parcel);
    setNewStatus(parcel.status);
    setLocation('');
    setShowUpdateModal(true);
  };

  const submitUpdate = async () => {
    if (!selectedParcel) return;
    setUpdating(true);
    try {
      const loc = location || 'Status updated';
      await updateParcelStatus(selectedParcel.id, newStatus, loc);
      setShowUpdateModal(false);
      setSelectedParcel(null);
      await loadParcels();
    } catch (e) {
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setUpdating(false);
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

      <ScrollView
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadParcels} />}
      >
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
                  {parcel.photos && parcel.photos[0] ? (
                    <Image source={{ uri: parcel.photos[0] }} style={styles.thumb} />
                  ) : null}
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

                <View style={{ marginTop: 12 }}>
                  <TouchableOpacity style={styles.updateBtn} onPress={() => openUpdate(parcel)}>
                    <Text style={styles.updateBtnText}>Update Status</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal transparent visible={showUpdateModal} animationType="fade" onRequestClose={() => setShowUpdateModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowUpdateModal(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Update Status</Text>
            {selectedParcel && (
              <Text style={styles.modalSubtitle}>{selectedParcel.title} • {selectedParcel.trackingNumber}</Text>
            )}

            <View style={{ marginTop: 16 }}>
              <Text style={styles.modalLabel}>Select status</Text>
              <View style={styles.statusRow}>
                {(['pending','in-transit','delivered'] as const).map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.statusChip, newStatus === s && styles.statusChipActive]}
                    onPress={() => setNewStatus(s)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ marginRight: 6 }}>
                        <StatusIcon status={s} />
                      </View>
                      <Text style={[styles.statusChipText, newStatus === s && styles.statusChipTextActive]}>{s}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              {selectedParcel && (
                <Text style={styles.modalHint}>Current: <Text style={{ textTransform: 'capitalize' }}>{selectedParcel.status}</Text></Text>
              )}
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={styles.modalLabel}>Location/Note</Text>
              <TextInput
                placeholder="e.g., Arrived at sorting facility"
                value={location}
                onChangeText={setLocation}
                style={styles.modalInput}
                placeholderTextColor="#6b7280"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnSecondary]} onPress={() => setShowUpdateModal(false)}>
                <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary, (updating || (selectedParcel && newStatus === selectedParcel.status)) && { opacity: 0.6 }]}
                onPress={submitUpdate}
                disabled={updating || (selectedParcel ? newStatus === selectedParcel.status : false)}
              >
                <Text style={styles.modalBtnPrimaryText}>{updating ? 'Updating...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  updateBtn: { backgroundColor: '#111827', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  updateBtnText: { color: 'white', fontWeight: '600' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: 'white', borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalSubtitle: { color: '#6b7280', marginTop: 4 },
  modalLabel: { color: '#374151', fontWeight: '500', marginBottom: 8 },
  modalHint: { color: '#6b7280', marginTop: 8 },
  statusRow: { flexDirection: 'row', columnGap: 8 },
  statusChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#f3f4f6' },
  statusChipActive: { backgroundColor: '#dbeafe' },
  statusChipText: { color: '#374151', fontWeight: '500', textTransform: 'capitalize' },
  statusChipTextActive: { color: '#1d4ed8' },
  modalInput: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#111827' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', columnGap: 12, marginTop: 16 },
  modalBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  modalBtnSecondary: { backgroundColor: '#f3f4f6' },
  modalBtnPrimary: { backgroundColor: '#2563eb' },
  modalBtnSecondaryText: { color: '#111827', fontWeight: '600' },
  modalBtnPrimaryText: { color: 'white', fontWeight: '600' },
  thumb: { width: '100%', height: 160, borderRadius: 10, marginBottom: 8, backgroundColor: '#f3f4f6' },
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