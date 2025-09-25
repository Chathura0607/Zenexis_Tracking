import { useAuth } from '@/contexts/AuthContext';
import { PasswordUpdateData, profileService, ProfileUpdateData, UserProfile } from '@/services/profileService';
import { Edit3, Eye, EyeOff, Lock, Mail, Trash2, User, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileSettings() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  
  // Form states
  const [passwordData, setPasswordData] = useState<PasswordUpdateData>({
    currentPassword: '',
    newPassword: '',
  });
  const [profileData, setProfileData] = useState<ProfileUpdateData>({
    name: '',
    phone: '',
    email: '',
  });
  const [deletePassword, setDeletePassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    delete: false,
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const profileData = await profileService.getUserProfile(user.uid);
      setProfile(profileData);
      if (profileData) {
        setProfileData({
          name: profileData.name || '',
          phone: profileData.phone || '',
          email: profileData.email || '',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePicker = () => {
    Alert.alert(
      'Select Profile Picture',
      'Choose how you want to add a profile picture',
      [
        { text: 'Camera', onPress: () => takePhoto() },
        { text: 'Gallery', onPress: () => pickFromGallery() },
        { text: 'Remove Picture', onPress: () => removeProfilePicture(), style: 'destructive' },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const takePhoto = async () => {
    try {
      const imageUri = await profileService.takeProfilePhoto();
      if (imageUri && user) {
        const downloadURL = await profileService.uploadProfilePicture(user.uid, imageUri);
        setProfile(prev => prev ? { ...prev, profilePicture: downloadURL } : null);
        Alert.alert('Success', 'Profile picture updated successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const pickFromGallery = async () => {
    try {
      const imageUri = await profileService.pickProfileImage();
      if (imageUri && user) {
        const downloadURL = await profileService.uploadProfilePicture(user.uid, imageUri);
        setProfile(prev => prev ? { ...prev, profilePicture: downloadURL } : null);
        Alert.alert('Success', 'Profile picture updated successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const removeProfilePicture = async () => {
    if (!user) return;
    
    Alert.alert(
      'Remove Profile Picture',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await profileService.deleteProfilePicture(user.uid);
              setProfile(prev => prev ? { ...prev, profilePicture: undefined } : null);
              Alert.alert('Success', 'Profile picture removed successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    try {
      await profileService.updateUserProfile(user.uid, profileData);
      await profileService.updateAuthProfile(profileData.name);
      setProfile(prev => prev ? { ...prev, ...profileData } : null);
      setShowProfileModal(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleUpdatePassword = async () => {
    try {
      await profileService.updatePassword(passwordData);
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '' });
      Alert.alert('Success', 'Password updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleUpdateEmail = async () => {
    if (!user) return;
    
    Alert.prompt(
      'Update Email',
      'Enter your current password to confirm email change:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async (currentPassword?: string) => {
            if (!currentPassword) return;
            
            try {
              await profileService.updateEmail(profileData.email!, currentPassword);
              setProfile(prev => prev ? { ...prev, email: profileData.email! } : null);
              Alert.alert('Success', 'Email updated successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ],
      'secure-text'
    );
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              await profileService.deleteAccount(deletePassword);
              await logout();
              Alert.alert('Account Deleted', 'Your account has been permanently deleted');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile Settings</Text>
        </View>

        {/* Profile Picture Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Picture</Text>
          <View style={styles.profilePictureContainer}>
            <TouchableOpacity style={styles.profilePicture} onPress={handleImagePicker}>
              {profile?.profilePicture ? (
                <Image source={{ uri: profile.profilePicture }} style={styles.profileImage} />
              ) : (
                <User size={40} color="#6b7280" />
              )}
              <View style={styles.editIcon}>
                <Edit3 size={16} color="white" />
              </View>
            </TouchableOpacity>
            <Text style={styles.profilePictureText}>Tap to change</Text>
          </View>
        </View>

        {/* Profile Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <View style={styles.infoValueContainer}>
                <Text style={styles.infoValue}>{profile?.name || 'Not set'}</Text>
                <TouchableOpacity onPress={() => setShowProfileModal(true)}>
                  <Edit3 size={16} color="#3b82f6" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <View style={styles.infoValueContainer}>
                <Text style={styles.infoValue}>{profile?.email || 'Not set'}</Text>
                <TouchableOpacity onPress={() => setShowProfileModal(true)}>
                  <Edit3 size={16} color="#3b82f6" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <View style={styles.infoValueContainer}>
                <Text style={styles.infoValue}>{profile?.phone || 'Not set'}</Text>
                <TouchableOpacity onPress={() => setShowProfileModal(true)}>
                  <Edit3 size={16} color="#3b82f6" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Security Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity 
              style={styles.settingRow} 
              onPress={() => setShowPasswordModal(true)}
            >
              <Lock size={20} color="#6b7280" />
              <Text style={styles.settingTitle}>Change Password</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.settingRow} 
              onPress={handleUpdateEmail}
            >
              <Mail size={20} color="#6b7280" />
              <Text style={styles.settingTitle}>Update Email</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <View style={styles.dangerCard}>
            <TouchableOpacity 
              style={[styles.settingRow, styles.dangerRow]} 
              onPress={() => setShowDeleteModal(true)}
            >
              <Trash2 size={20} color="#ef4444" />
              <Text style={[styles.settingTitle, styles.dangerText]}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Password Update Modal */}
      <Modal visible={showPasswordModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Update Password</Text>
            <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <View style={styles.passwordInput}>
                <TextInput
                  style={styles.textInput}
                  value={passwordData.currentPassword}
                  onChangeText={(text) => setPasswordData(prev => ({ ...prev, currentPassword: text }))}
                  placeholder="Enter current password"
                  secureTextEntry={!showPasswords.current}
                />
                <TouchableOpacity onPress={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}>
                  {showPasswords.current ? <EyeOff size={20} color="#6b7280" /> : <Eye size={20} color="#6b7280" />}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.passwordInput}>
                <TextInput
                  style={styles.textInput}
                  value={passwordData.newPassword}
                  onChangeText={(text) => setPasswordData(prev => ({ ...prev, newPassword: text }))}
                  placeholder="Enter new password"
                  secureTextEntry={!showPasswords.new}
                />
                <TouchableOpacity onPress={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}>
                  {showPasswords.new ? <EyeOff size={20} color="#6b7280" /> : <Eye size={20} color="#6b7280" />}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.updateButton} onPress={handleUpdatePassword}>
              <Text style={styles.updateButtonText}>Update Password</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Profile Update Modal */}
      <Modal visible={showProfileModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={() => setShowProfileModal(false)}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.textInput}
                value={profileData.name}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, name: text }))}
                placeholder="Enter your name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.textInput}
                value={profileData.phone}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, phone: text }))}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                value={profileData.email}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, email: text }))}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity style={styles.updateButton} onPress={handleUpdateProfile}>
              <Text style={styles.updateButtonText}>Update Profile</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Delete Account Modal */}
      <Modal visible={showDeleteModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <TouchableOpacity onPress={() => setShowDeleteModal(false)}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.warningText}>
              This action cannot be undone. All your data will be permanently deleted.
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <View style={styles.passwordInput}>
                <TextInput
                  style={styles.textInput}
                  value={deletePassword}
                  onChangeText={setDeletePassword}
                  placeholder="Enter current password to confirm"
                  secureTextEntry={!showPasswords.delete}
                />
                <TouchableOpacity onPress={() => setShowPasswords(prev => ({ ...prev, delete: !prev.delete }))}>
                  {showPasswords.delete ? <EyeOff size={20} color="#6b7280" /> : <Eye size={20} color="#6b7280" />}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    padding: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  profilePictureContainer: {
    alignItems: 'center',
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 4,
  },
  profilePictureText: {
    marginTop: 8,
    color: '#6b7280',
    fontSize: 14,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  infoValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoValue: {
    fontSize: 16,
    color: '#6b7280',
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginLeft: 12,
  },
  dangerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    overflow: 'hidden',
  },
  dangerRow: {
    borderBottomWidth: 0,
  },
  dangerText: {
    color: '#ef4444',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  modalContent: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  passwordInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  updateButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  updateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  warningText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
});
