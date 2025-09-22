import { useAuth } from '@/contexts/AuthContext';
import { createParcel, generateTrackingNumber } from '@/services/parcelService';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { Camera, X } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddParcel() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sender, setSender] = useState('');
  const [recipient, setRecipient] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [weight, setWeight] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [photos, setPhotos] = useState<string[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [permission, requestPermission] = useCameraPermissions();
  const { user } = useAuth();
  const cameraRef = useRef<CameraView>(null);

  const handleTakePhoto = async () => {
    if (!permission?.granted) {
      const newPermission = await requestPermission();
      if (!newPermission?.granted) {
        Alert.alert('Error', 'Camera permission is required to take photos');
        return;
      }
    }

    setShowCamera(true);
  };

  const capturePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        setPhotos([...photos, photo.uri]);
        setShowCamera(false);
      } catch (error) {
        Alert.alert('Error', 'Failed to capture photo');
      }
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title || !sender || !recipient || !recipientAddress) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a parcel');
      return;
    }

    setLoading(true);
    try {
      const trackingNumber = generateTrackingNumber();
      
      await createParcel({
        trackingNumber,
        title,
        description,
        status: 'pending',
        sender,
        recipient,
        recipientAddress,
        weight: weight || '0',
        dimensions: dimensions || '0x0x0',
        photos,
        paymentInfo: {
          amount: paymentAmount || '0',
          method: paymentMethod,
          status: 'pending'
        },
        userId: user.uid,
        statusHistory: [{
          status: 'pending',
          timestamp: new Date().toISOString(),
          location: 'Package received at origin'
        }]
      });

      Alert.alert('Success', `Parcel created with tracking number: ${trackingNumber}`, [
        { text: 'OK', onPress: () => router.push('/(tabs)/track') }
      ]);

      // Reset form
      setTitle('');
      setDescription('');
      setSender('');
      setRecipient('');
      setRecipientAddress('');
      setWeight('');
      setDimensions('');
      setPaymentAmount('');
      setPaymentMethod('Cash');
      setPhotos([]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create parcel. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (showCamera) {
    return (
      <View style={{ flex: 1, backgroundColor: 'black' }}>
        <CameraView 
          style={{ flex: 1 }}
          ref={cameraRef}
        >
          <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 80 }}>
            <View style={{ flexDirection: 'row', columnGap: 80 }}>
              <TouchableOpacity
                style={{ backgroundColor: 'rgba(75,85,99,0.8)', borderRadius: 999, padding: 16 }}
                onPress={() => setShowCamera(false)}
              >
                <X size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: 'white', borderRadius: 999, padding: 24 }}
                onPress={capturePhoto}
              >
                <Camera size={32} color="black" />
              </TouchableOpacity>
              <View style={{ width: 64 }} />
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Add New Parcel</Text>
        <Text style={s.headerSubtitle}>Create a new tracking entry for your package</Text>
      </View>

      <ScrollView style={s.scroller} showsVerticalScrollIndicator={false}>
        <View style={s.card}>
          <View style={s.inputsStack}>
            <TextInput placeholder="Title" value={title} onChangeText={setTitle} style={s.input} placeholderTextColor="#6b7280" />
            <TextInput placeholder="Description" value={description} onChangeText={setDescription} style={s.input} placeholderTextColor="#6b7280" />
            <TextInput placeholder="Sender" value={sender} onChangeText={setSender} style={s.input} placeholderTextColor="#6b7280" />
            <TextInput placeholder="Recipient" value={recipient} onChangeText={setRecipient} style={s.input} placeholderTextColor="#6b7280" />
            <TextInput placeholder="Recipient Address" value={recipientAddress} onChangeText={setRecipientAddress} style={s.input} placeholderTextColor="#6b7280" />
            <TextInput placeholder="Weight (kg)" value={weight} onChangeText={setWeight} style={s.input} placeholderTextColor="#6b7280" />
            <TextInput placeholder="Dimensions (cm)" value={dimensions} onChangeText={setDimensions} style={s.input} placeholderTextColor="#6b7280" />
            <TextInput placeholder="Payment Amount" value={paymentAmount} onChangeText={setPaymentAmount} keyboardType="numeric" style={s.input} placeholderTextColor="#6b7280" />
          </View>
          <Text style={s.sectionLabel}>Payment Method</Text>
          <View style={s.rowBetween}>
            <TouchableOpacity onPress={() => setPaymentMethod('Cash')} style={{ marginRight: 16 }}>
              <Text style={paymentMethod === 'Cash' ? s.choiceActive : s.choice}>{'Cash'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPaymentMethod('Card')}>
              <Text style={paymentMethod === 'Card' ? s.choiceActive : s.choice}>{'Card'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.sectionLabel}>Photos</Text>
          {photos.length > 0 && (
            <ScrollView horizontal style={{ marginBottom: 16 }} showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', columnGap: 12 }}>
                {photos.map((photo, index) => (
                  <View key={index} style={{ position: 'relative' }}>
                    <Image source={{ uri: photo }} style={s.photo} />
                    <TouchableOpacity style={s.photoDelete} onPress={() => removePhoto(index)}>
                      <X size={12} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
          <TouchableOpacity style={s.photoCta} onPress={handleTakePhoto}>
            <View style={s.photoCtaIcon}><Camera size={32} color="#6b7280" /></View>
            <Text style={s.photoCtaTitle}>Take Photo</Text>
            <Text style={s.photoCtaSubtitle}>Add photos of your parcel</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[s.primaryBtn, loading && { opacity: 0.5 }]} onPress={handleSubmit} disabled={loading}>
          <Text style={s.primaryBtnText}>{loading ? 'Creating Parcel...' : 'Create Parcel'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingHorizontal: 24, paddingVertical: 24, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#111827' },
  headerSubtitle: { marginTop: 4, fontSize: 12, color: '#6b7280' },
  scroller: { flex: 1, paddingHorizontal: 24, paddingVertical: 24 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#f3f4f6', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  inputsStack: { rowGap: 12 },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: '#111827' },
  sectionLabel: { fontWeight: '600', marginTop: 24, marginBottom: 8, color: '#374151' },
  rowBetween: { flexDirection: 'row', marginBottom: 16 },
  choice: { color: '#6b7280', fontWeight: '700' },
  choiceActive: { color: '#2563eb', fontWeight: '700' },
  photo: { width: 96, height: 96, borderRadius: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  photoDelete: { position: 'absolute', top: -6, right: -6, backgroundColor: '#ef4444', borderRadius: 999, padding: 6 },
  photoCta: { borderWidth: 2, borderStyle: 'dashed', borderColor: '#d1d5db', borderRadius: 12, padding: 32, alignItems: 'center' },
  photoCtaIcon: { backgroundColor: '#f3f4f6', borderRadius: 999, padding: 12, marginBottom: 12 },
  photoCtaTitle: { color: '#374151', fontWeight: '600', fontSize: 16 },
  photoCtaSubtitle: { color: '#6b7280', fontSize: 12, marginTop: 4 },
  primaryBtn: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 32, marginBottom: 32 },
  primaryBtnText: { color: 'white', fontWeight: '600', fontSize: 18 },
});