import { auth, db } from '@/config/firebase';
import * as ImagePicker from 'expo-image-picker';
import {
    deleteUser,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updateEmail,
    updatePassword,
    updateProfile
} from 'firebase/auth';
import { deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  profilePicture?: string | null;
  createdAt: string;
  lastLoginAt?: string;
  isEmailVerified: boolean;
  twoFactorEnabled?: boolean;
}

export interface PasswordUpdateData {
  currentPassword: string;
  newPassword: string;
}

export interface ProfileUpdateData {
  name?: string;
  phone?: string;
  email?: string;
  profilePicture?: string | null;
  twoFactorEnabled?: boolean;
}

class ProfileService {
  private storage = getStorage();

  // Get user profile from Firestore
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return { uid, ...userDoc.data() } as UserProfile;
      }
      return null;
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch profile');
    }
  }

  // Update user profile in Firestore
  async updateUserProfile(uid: string, data: ProfileUpdateData): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update profile');
    }
  }

  // Update Firebase Auth profile
  async updateAuthProfile(displayName?: string, photoURL?: string): Promise<void> {
    try {
      if (!auth.currentUser) throw new Error('No user logged in');
      
      await updateProfile(auth.currentUser, {
        displayName,
        photoURL,
      });
    } catch (error: any) {
      console.error('Error updating auth profile:', error);
      throw new Error('Failed to update profile');
    }
  }

  // Update password
  async updatePassword(passwordData: PasswordUpdateData): Promise<void> {
    try {
      if (!auth.currentUser) throw new Error('No user logged in');
      
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        passwordData.currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Update password
      await updatePassword(auth.currentUser, passwordData.newPassword);
    } catch (error: any) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/wrong-password') {
        throw new Error('Current password is incorrect');
      }
      throw new Error('Failed to update password');
    }
  }

  // Update email
  async updateEmail(newEmail: string, currentPassword: string): Promise<void> {
    try {
      if (!auth.currentUser) throw new Error('No user logged in');
      
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Update email
      await updateEmail(auth.currentUser, newEmail);
      
      // Update email in Firestore
      await this.updateUserProfile(auth.currentUser.uid, { email: newEmail });
    } catch (error: any) {
      console.error('Error updating email:', error);
      if (error.code === 'auth/wrong-password') {
        throw new Error('Current password is incorrect');
      }
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email is already in use');
      }
      throw new Error('Failed to update email');
    }
  }

  // Upload profile picture
  async uploadProfilePicture(uid: string, imageUri: string): Promise<string> {
    try {
      // Convert image to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Create storage reference
      const storageRef = ref(this.storage, `profile-pictures/${uid}`);
      
      // Upload file
      await uploadBytes(storageRef, blob);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update user profile with new picture URL
      await this.updateUserProfile(uid, { profilePicture: downloadURL });
      await this.updateAuthProfile(undefined, downloadURL);
      
      return downloadURL;
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      throw new Error('Failed to upload profile picture');
    }
  }

  // Delete profile picture
  async deleteProfilePicture(uid: string): Promise<void> {
    try {
      // Delete from storage
      const storageRef = ref(this.storage, `profile-pictures/${uid}`);
      await deleteObject(storageRef);
      
      // Update user profile
      await this.updateUserProfile(uid, { profilePicture: null });
      await this.updateAuthProfile(undefined, undefined);
    } catch (error: any) {
      console.error('Error deleting profile picture:', error);
      throw new Error('Failed to delete profile picture');
    }
  }

  // Pick image from gallery or camera
  async pickProfileImage(): Promise<string | null> {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access media library was denied');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }
      return null;
    } catch (error: any) {
      console.error('Error picking image:', error);
      throw new Error('Failed to pick image');
    }
  }

  // Take photo with camera
  async takeProfilePhoto(): Promise<string | null> {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access camera was denied');
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }
      return null;
    } catch (error: any) {
      console.error('Error taking photo:', error);
      throw new Error('Failed to take photo');
    }
  }

  // Delete user account
  async deleteAccount(currentPassword: string): Promise<void> {
    try {
      if (!auth.currentUser) throw new Error('No user logged in');
      
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Delete user data from Firestore
      await deleteDoc(doc(db, 'users', auth.currentUser.uid));
      
      // Delete profile picture from storage
      try {
        const storageRef = ref(this.storage, `profile-pictures/${auth.currentUser.uid}`);
        await deleteObject(storageRef);
      } catch (error) {
        console.warn('Profile picture not found or already deleted');
      }
      
      // Delete user from Firebase Auth
      await deleteUser(auth.currentUser);
    } catch (error: any) {
      console.error('Error deleting account:', error);
      if (error.code === 'auth/wrong-password') {
        throw new Error('Current password is incorrect');
      }
      throw new Error('Failed to delete account');
    }
  }

  // Get user's login history (placeholder for future implementation)
  async getLoginHistory(uid: string): Promise<any[]> {
    // This would require additional setup with Firebase Functions or a separate collection
    // For now, return empty array
    return [];
  }

  // Enable/disable two-factor authentication (placeholder for future implementation)
  async toggleTwoFactor(uid: string, enabled: boolean): Promise<void> {
    await this.updateUserProfile(uid, { twoFactorEnabled: enabled });
  }
}

export const profileService = new ProfileService();
