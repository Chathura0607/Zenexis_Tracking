import React from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function LoadingSpinner() {
  return (
    <View className="flex-1 justify-center items-center bg-gray-50">
      <ActivityIndicator size="large" color="#3b82f6" />
    </View>
  );
}