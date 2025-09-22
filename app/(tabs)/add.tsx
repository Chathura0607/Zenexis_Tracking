import { useAuth } from '@/contexts/AuthContext';
import { createParcel, generateTrackingNumber } from '@/services/parcelService';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { Camera, X } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
      <View className="flex-1 bg-black">
        <CameraView 
          className="flex-1"
          ref={cameraRef}
        >
          <View className="flex-1 justify-end items-center pb-20">
            <View className="flex-row space-x-20">
              <TouchableOpacity
                className="bg-gray-600/80 backdrop-blur-sm rounded-full p-4 shadow-strong"
                onPress={() => setShowCamera(false)}
              >
                <X size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-white rounded-full p-6 shadow-strong active:scale-95 transition-transform duration-150"
                onPress={capturePhoto}
              >
                <Camera size={32} color="black" />
              </TouchableOpacity>
              <View className="w-16" />
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 py-6 bg-white shadow-soft border-b border-gray-100">
        <Text className="heading-2 text-gray-900">Add New Parcel</Text>
        <Text className="text-caption mt-1">Create a new tracking entry for your package</Text>
      </View>

      <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={false}>
        <View className="card p-6 space-y-modern">
          <View className="space-y-6">
            <View className="form-group">
              <Text className="form-label-required">Title</Text>
              <TextInput
                className="input"
                placeholder="e.g., iPhone 15 Pro"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View className="form-group">
              <Text className="form-label">Description</Text>
              <TextInput
                className="input"
                placeholder="Package description..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <Text className="form-help">Optional: Add details about the package contents</Text>
            </View>

            <View className="form-group">
              <Text className="form-label-required">Sender</Text>
              <TextInput
                className="input"
                placeholder="Sender name"
                value={sender}
                onChangeText={setSender}
              />
            </View>

            <View className="form-group">
              <Text className="form-label-required">Recipient</Text>
              <TextInput
                className="input"
                placeholder="Recipient name"
                value={recipient}
                onChangeText={setRecipient}
              />
            </View>

            <View className="form-group">
              <Text className="form-label-required">Delivery Address</Text>
              <TextInput
                className="input"
                placeholder="Full delivery address"
                value={recipientAddress}
                onChangeText={setRecipientAddress}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>

            <View className="flex-row space-x-4">
              <View className="flex-1 form-group">
                <Text className="form-label">Weight (kg)</Text>
                <TextInput
                  className="input"
                  placeholder="0.5"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                />
              </View>
              <View className="flex-1 form-group">
                <Text className="form-label">Dimensions</Text>
                <TextInput
                  className="input"
                  placeholder="20x15x10 cm"
                  value={dimensions}
                  onChangeText={setDimensions}
                />
              </View>
            </View>

            <View className="form-group">
              <Text className="form-label">Payment Information</Text>
              <View className="flex-row space-x-4">
                <View className="flex-1">
                  <TextInput
                    className="input"
                    placeholder="Amount (₹)"
                    value={paymentAmount}
                    onChangeText={setPaymentAmount}
                    keyboardType="numeric"
                  />
                </View>
                <View className="flex-1">
                  <View className="input">
                    <Text className="text-gray-900">{paymentMethod}</Text>
                  </View>
                </View>
              </View>
              <Text className="form-help">Payment method is set to Cash by default</Text>
            </View>

            <View className="form-group">
              <Text className="form-label">Photos</Text>
              
              {photos.length > 0 && (
                <ScrollView horizontal className="mb-4" showsHorizontalScrollIndicator={false}>
                  <View className="flex-row space-x-3">
                    {photos.map((photo, index) => (
                      <View key={index} className="relative">
                        <Image source={{ uri: photo }} className="w-24 h-24 rounded-lg shadow-soft" />
                        <TouchableOpacity
                          className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1.5 shadow-soft"
                          onPress={() => removePhoto(index)}
                        >
                          <X size={12} color="white" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              )}

              <TouchableOpacity
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 items-center hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                onPress={handleTakePhoto}
              >
                <View className="bg-gray-100 rounded-full p-4 mb-3">
                  <Camera size={32} color="#6b7280" />
                </View>
                <Text className="text-gray-700 font-semibold text-base">Take Photo</Text>
                <Text className="text-gray-500 text-sm mt-1">Add photos of your parcel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity
          className={`btn-primary mt-8 mb-8 ${loading ? 'opacity-50' : ''}`}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text className="text-white font-semibold text-lg">
            {loading ? 'Creating Parcel...' : 'Create Parcel'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}