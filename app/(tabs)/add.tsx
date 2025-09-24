import { useAuth } from '@/contexts/AuthContext';
import { createParcel, generateTrackingNumber } from '@/services/parcelService';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  
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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        Alert.alert('Error', 'Failed to capture photo');
      }
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!title) newErrors.title = 'Title is required';
    if (!sender) newErrors.sender = 'Sender is required';
    if (!recipient) newErrors.recipient = 'Recipient is required';
    if (!recipientAddress) newErrors.recipientAddress = 'Recipient address is required';
    if (paymentAmount && isNaN(Number(paymentAmount))) newErrors.paymentAmount = 'Amount must be a number';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
      setErrors({});
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to create parcel. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need access to your photos to pick images.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.6,
        selectionLimit: 5,
      });
      if (!result.canceled) {
        const selected = result.assets?.map(a => a.uri).filter(Boolean) as string[];
        if (selected?.length) {
          setPhotos(prev => [...prev, ...selected]);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open gallery');
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
            <View>
              <Text style={s.label}>Title <Text style={s.req}>*</Text></Text>
              <TextInput placeholder="Parcel title" value={title} onChangeText={setTitle} style={[s.input, errors.title && s.inputError]} placeholderTextColor="#6b7280" />
              {errors.title ? <Text style={s.errorText}>{errors.title}</Text> : null}
            </View>
            <View>
              <Text style={s.label}>Description</Text>
              <TextInput placeholder="Short description" value={description} onChangeText={setDescription} style={s.input} placeholderTextColor="#6b7280" />
            </View>
            <View>
              <Text style={s.label}>Sender <Text style={s.req}>*</Text></Text>
              <TextInput placeholder="Sender name" value={sender} onChangeText={setSender} style={[s.input, errors.sender && s.inputError]} placeholderTextColor="#6b7280" />
              {errors.sender ? <Text style={s.errorText}>{errors.sender}</Text> : null}
            </View>
            <View>
              <Text style={s.label}>Recipient <Text style={s.req}>*</Text></Text>
              <TextInput placeholder="Recipient name" value={recipient} onChangeText={setRecipient} style={[s.input, errors.recipient && s.inputError]} placeholderTextColor="#6b7280" />
              {errors.recipient ? <Text style={s.errorText}>{errors.recipient}</Text> : null}
            </View>
            <View>
              <Text style={s.label}>Recipient Address <Text style={s.req}>*</Text></Text>
              <TextInput placeholder="Address" value={recipientAddress} onChangeText={setRecipientAddress} style={[s.input, errors.recipientAddress && s.inputError]} placeholderTextColor="#6b7280" />
              {errors.recipientAddress ? <Text style={s.errorText}>{errors.recipientAddress}</Text> : null}
            </View>
            <View>
              <Text style={s.label}>Weight (kg)</Text>
              <TextInput placeholder="e.g., 1.5" value={weight} onChangeText={setWeight} style={s.input} placeholderTextColor="#6b7280" keyboardType="decimal-pad" />
            </View>
            <View>
              <Text style={s.label}>Dimensions (cm)</Text>
              <TextInput placeholder="L x W x H" value={dimensions} onChangeText={setDimensions} style={s.input} placeholderTextColor="#6b7280" />
            </View>
            <View>
              <Text style={s.label}>Payment Amount</Text>
              <TextInput placeholder="0" value={paymentAmount} onChangeText={setPaymentAmount} keyboardType="decimal-pad" style={[s.input, errors.paymentAmount && s.inputError]} placeholderTextColor="#6b7280" />
              {errors.paymentAmount ? <Text style={s.errorText}>{errors.paymentAmount}</Text> : null}
            </View>
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
          <View style={{ rowGap: 12 }}>
            <TouchableOpacity style={s.photoCta} onPress={handleTakePhoto}>
              <View style={s.photoCtaIcon}><Camera size={32} color="#6b7280" /></View>
              <Text style={s.photoCtaTitle}>Take Photo</Text>
              <Text style={s.photoCtaSubtitle}>Use camera to add a photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.photoCta, { borderColor: '#c7d2fe', backgroundColor: '#eef2ff' }]} onPress={handlePickFromGallery}>
              <View style={[s.photoCtaIcon, { backgroundColor: '#e0e7ff' }]}><Camera size={32} color="#6b7280" /></View>
              <Text style={s.photoCtaTitle}>Pick from Gallery</Text>
              <Text style={s.photoCtaSubtitle}>Select up to 5 photos</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity
          style={[s.primaryBtn, (loading || !title || !sender || !recipient || !recipientAddress || (paymentAmount && isNaN(Number(paymentAmount)))) && { opacity: 0.5 }]}
          onPress={handleSubmit}
          disabled={loading || !title || !sender || !recipient || !recipientAddress || (paymentAmount && isNaN(Number(paymentAmount)))}
        >
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
  inputError: { borderColor: '#ef4444' },
  label: { color: '#374151', fontWeight: '500', marginBottom: 8 },
  req: { color: '#ef4444' },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: 6 },
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