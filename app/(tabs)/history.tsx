import { useAuth } from '@/contexts/AuthContext';
import { getUserParcels, updateParcelStatus } from '@/services/parcelService';
import { Parcel } from '@/types/parcel';
import { CircleCheck as CheckCircle, Clock, CreditCard, MapPin, Package, Truck, Circle as XCircle } from 'lucide-react-native';
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
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.headerTitle}>Parcel History</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          <View style={st.filtersRow}>
            {statusFilters.map((filter) => {
              const active = selectedStatus === filter.key;
              return (
                <TouchableOpacity key={filter.key} style={[st.filterChip, active ? st.filterChipActive : st.filterChipInactive]} onPress={() => setSelectedStatus(filter.key)}>
                  <Text style={[st.filterChipText, active ? st.filterChipTextActive : st.filterChipTextInactive]}>
                    {filter.label} ({filter.count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={st.listContainer}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadParcels} />}
      >
        {loading ? (
          <View style={st.centered}><Text style={st.muted}>Loading history...</Text></View>
        ) : filteredParcels.length === 0 ? (
          <View style={st.centeredEmpty}>
            <Package size={48} color="#9ca3af" />
            <Text style={[st.muted, { marginTop: 16, textAlign: 'center' }]}>No parcels found for {selectedStatus === 'all' ? 'this filter' : selectedStatus}</Text>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {filteredParcels.map((parcel) => (
              <View key={parcel.id} style={st.cardWrap}>
                <View style={{ padding: 16 }}>
                  <View style={st.cardHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={st.cardTitle}>{parcel.title}</Text>
                      <Text style={st.cardSubtitle}>{parcel.trackingNumber}</Text>
                    </View>
                    <View style={[st.statusPill, statusPillWithBorder(parcel.status)]}>
                      <StatusIcon status={parcel.status} />
                      <Text style={st.statusText}>{parcel.status}</Text>
                    </View>
                  </View>

                  {parcel.description && (
                    <Text style={st.description}>{parcel.description}</Text>
                  )}

                  <View style={{ gap: 8, marginBottom: 16 }}>
                    {parcel.photos && parcel.photos[0] ? (
                      <Image source={{ uri: parcel.photos[0] }} style={st.thumb} />
                    ) : null}
                    <View style={st.inlineRow}>
                      <MapPin size={16} color="#6b7280" />
                      <Text style={st.inlineText}>From: {parcel.sender} → To: {parcel.recipient}</Text>
                    </View>
                    <View style={st.inlineRow}>
                      <Clock size={16} color="#6b7280" />
                      <Text style={st.inlineText}>Created: {formatDate(parcel.createdAt)}</Text>
                    </View>
                    {parcel.paymentInfo && parcel.paymentInfo.amount && (
                      <View style={st.inlineRow}>
                        <CreditCard size={16} color="#6b7280" />
                        <Text style={st.inlineText}>Payment: ₹{parcel.paymentInfo.amount} ({parcel.paymentInfo.method})</Text>
                      </View>
                    )}
                  </View>

                  {parcel.statusHistory && parcel.statusHistory.length > 0 && (
                    <View style={st.footer}>
                      <Text style={st.footerHeading}>Status History:</Text>
                      {parcel.statusHistory.map((status, index) => (
                        <View key={index} style={st.historyRow}>
                          <StatusIcon status={status.status} />
                          <View style={{ marginLeft: 8, flex: 1 }}>
                            <Text style={st.inlineTitle}>{status.status}</Text>
                            <Text style={st.inlineSubtle}>{status.location}</Text>
                          </View>
                          <Text style={st.inlineSubtle}>{formatDate(status.timestamp)}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <View style={{ marginTop: 12 }}>
                    <TouchableOpacity style={st.updateBtn} onPress={() => openUpdate(parcel)}>
                      <Text style={st.updateBtnText}>Update Status</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      <Modal transparent visible={showUpdateModal} animationType="fade" onRequestClose={() => setShowUpdateModal(false)}>
        <Pressable style={st.modalBackdrop} onPress={() => setShowUpdateModal(false)}>
          <Pressable style={st.modalCard} onPress={() => {}}>
            <Text style={st.modalTitle}>Update Status</Text>
            {selectedParcel && (
              <Text style={st.modalSubtitle}>{selectedParcel.title} • {selectedParcel.trackingNumber}</Text>
            )}

            <View style={{ marginTop: 16 }}>
              <Text style={st.modalLabel}>Select status</Text>
              <View style={st.statusRow}>
                {(['pending','in-transit','delivered'] as const).map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[st.statusChip, newStatus === s && st.statusChipActive]}
                    onPress={() => setNewStatus(s)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ marginRight: 6 }}>
                        <StatusIcon status={s} />
                      </View>
                      <Text style={[st.statusChipText, newStatus === s && st.statusChipTextActive]}>{s}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              {selectedParcel && (
                <Text style={st.modalHint}>Current: <Text style={{ textTransform: 'capitalize' }}>{selectedParcel.status}</Text></Text>
              )}
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={st.modalLabel}>Location/Note</Text>
              <TextInput
                placeholder="e.g., Arrived at sorting facility"
                value={location}
                onChangeText={setLocation}
                style={st.modalInput}
                placeholderTextColor="#6b7280"
              />
            </View>

            <View style={st.modalActions}>
              <TouchableOpacity style={[st.modalBtn, st.modalBtnSecondary]} onPress={() => setShowUpdateModal(false)}>
                <Text style={st.modalBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.modalBtn, st.modalBtnPrimary, (updating || (selectedParcel && newStatus === selectedParcel.status)) && { opacity: 0.6 }]}
                onPress={submitUpdate}
                disabled={updating || (selectedParcel ? newStatus === selectedParcel.status : false)}
              >
                <Text style={st.modalBtnPrimaryText}>{updating ? 'Updating...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#ffffff' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 16 },
  filtersRow: { flexDirection: 'row', columnGap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  filterChipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  filterChipInactive: { backgroundColor: '#ffffff', borderColor: '#e5e7eb' },
  filterChipText: { fontWeight: '500' },
  filterChipTextActive: { color: 'white' },
  filterChipTextInactive: { color: '#374151' },
  listContainer: { paddingHorizontal: 24, paddingVertical: 16, flexGrow: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centeredEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  muted: { color: '#4b5563' },
  cardWrap: { backgroundColor: '#ffffff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#f3f4f6', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTitle: { fontWeight: '600', color: '#111827', fontSize: 18 },
  cardSubtitle: { color: '#4b5563', fontSize: 12, marginTop: 4 },
  statusPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  statusText: { marginLeft: 8, fontSize: 14, fontWeight: '500', textTransform: 'capitalize' },
  description: { color: '#4b5563', fontSize: 12, marginBottom: 12 },
  inlineRow: { flexDirection: 'row', alignItems: 'center' },
  inlineText: { marginLeft: 8, color: '#4b5563', fontSize: 12, flex: 1 },
  footer: { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 12 },
  footerHeading: { fontSize: 12, fontWeight: '600', color: '#111827', marginBottom: 8 },
  historyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
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

function statusPillWithBorder(status: string) {
  switch (status) {
    case 'pending':
      return { backgroundColor: '#fef3c7', borderColor: '#fde68a' };
    case 'in-transit':
      return { backgroundColor: '#dbeafe', borderColor: '#bfdbfe' };
    case 'delivered':
      return { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' };
    case 'cancelled':
      return { backgroundColor: '#fee2e2', borderColor: '#fecaca' };
    default:
      return { backgroundColor: '#f3f4f6', borderColor: '#e5e7eb' };
  }
}