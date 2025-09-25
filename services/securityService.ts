import { auth, db } from '@/config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, updateDoc, where } from 'firebase/firestore';

export interface LoginSession {
  id: string;
  userId: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  deviceType?: string;
  success: boolean;
  failureReason?: string;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginNotifications: boolean;
  suspiciousActivityAlerts: boolean;
  sessionTimeout: number; // in minutes
  allowedDevices: string[];
}

class SecurityService {
  // Log login attempt
  async logLoginAttempt(
    userId: string, 
    success: boolean, 
    failureReason?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const session: Omit<LoginSession, 'id'> = {
        userId,
        timestamp: new Date().toISOString(),
        ipAddress: ipAddress || 'unknown',
        userAgent: userAgent || 'unknown',
        location: await this.getLocationFromIP(ipAddress),
        deviceType: this.getDeviceType(userAgent),
        success,
        // Only include failureReason if it's not undefined
        ...(failureReason !== undefined && { failureReason }),
      };

      await addDoc(collection(db, 'loginSessions'), session);
    } catch (error: any) {
      console.error('Error logging login attempt:', error);
    }
  }

  // Get user's login history
  async getLoginHistory(userId: string, limitCount: number = 20): Promise<LoginSession[]> {
    try {
      const sessionsQuery = query(
        collection(db, 'loginSessions'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(sessionsQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LoginSession[];
    } catch (error: any) {
      console.error('Error fetching login history:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }

  // Get recent login sessions
  async getRecentSessions(userId: string, limitCount: number = 5): Promise<LoginSession[]> {
    return this.getLoginHistory(userId, limitCount);
  }

  // Get suspicious login attempts
  async getSuspiciousLogins(userId: string): Promise<LoginSession[]> {
    try {
      const sessionsQuery = query(
        collection(db, 'loginSessions'),
        where('userId', '==', userId),
        where('success', '==', false),
        orderBy('timestamp', 'desc'),
        limit(10)
      );

      const querySnapshot = await getDocs(sessionsQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LoginSession[];
    } catch (error: any) {
      console.error('Error fetching suspicious logins:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }

  // Update security settings
  async updateSecuritySettings(userId: string, settings: Partial<SecuritySettings>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        securitySettings: settings,
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error updating security settings:', error);
      throw new Error('Failed to update security settings');
    }
  }

  // Get security settings
  async getSecuritySettings(userId: string): Promise<SecuritySettings> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return data.securitySettings || {
          twoFactorEnabled: false,
          loginNotifications: true,
          suspiciousActivityAlerts: true,
          sessionTimeout: 30,
          allowedDevices: [],
        };
      }
      return {
        twoFactorEnabled: false,
        loginNotifications: true,
        suspiciousActivityAlerts: true,
        sessionTimeout: 30,
        allowedDevices: [],
      };
    } catch (error: any) {
      console.error('Error fetching security settings:', error);
      return {
        twoFactorEnabled: false,
        loginNotifications: true,
        suspiciousActivityAlerts: true,
        sessionTimeout: 30,
        allowedDevices: [],
      };
    }
  }

  // Check for suspicious activity
  async checkSuspiciousActivity(userId: string): Promise<{
    isSuspicious: boolean;
    reasons: string[];
  }> {
    try {
      const recentSessions = await this.getRecentSessions(userId, 10);
      const suspiciousLogins = await this.getSuspiciousLogins(userId);
      
      const reasons: string[] = [];
      let isSuspicious = false;

      // Check for multiple failed attempts
      if (suspiciousLogins.length >= 3) {
        reasons.push('Multiple failed login attempts');
        isSuspicious = true;
      }

      // Check for logins from different locations
      const uniqueLocations = new Set(
        recentSessions
          .filter(session => session.success && session.location)
          .map(session => session.location)
      );
      
      if (uniqueLocations.size > 3) {
        reasons.push('Logins from multiple locations');
        isSuspicious = true;
      }

      // Check for logins from different devices
      const uniqueDevices = new Set(
        recentSessions
          .filter(session => session.success && session.deviceType)
          .map(session => session.deviceType)
      );
      
      if (uniqueDevices.size > 2) {
        reasons.push('Logins from multiple devices');
        isSuspicious = true;
      }

      return { isSuspicious, reasons };
    } catch (error: any) {
      console.error('Error checking suspicious activity:', error);
      return { isSuspicious: false, reasons: [] };
    }
  }

  // Generate security report
  async generateSecurityReport(userId: string): Promise<{
    totalLogins: number;
    successfulLogins: number;
    failedLogins: number;
    uniqueDevices: number;
    uniqueLocations: number;
    lastLogin: string | null;
    suspiciousActivity: boolean;
  }> {
    try {
      const loginHistory = await this.getLoginHistory(userId, 100);
      const suspiciousCheck = await this.checkSuspiciousActivity(userId);
      
      const successfulLogins = loginHistory.filter(session => session.success);
      const failedLogins = loginHistory.filter(session => !session.success);
      
      const uniqueDevices = new Set(
        loginHistory
          .filter(session => session.deviceType)
          .map(session => session.deviceType)
      ).size;
      
      const uniqueLocations = new Set(
        loginHistory
          .filter(session => session.location)
          .map(session => session.location)
      ).size;
      
      const lastLogin = loginHistory.length > 0 ? loginHistory[0].timestamp : null;

      return {
        totalLogins: loginHistory.length,
        successfulLogins: successfulLogins.length,
        failedLogins: failedLogins.length,
        uniqueDevices,
        uniqueLocations,
        lastLogin,
        suspiciousActivity: suspiciousCheck.isSuspicious,
      };
    } catch (error: any) {
      console.error('Error generating security report:', error);
      return {
        totalLogins: 0,
        successfulLogins: 0,
        failedLogins: 0,
        uniqueDevices: 0,
        uniqueLocations: 0,
        lastLogin: null,
        suspiciousActivity: false,
      };
    }
  }

  // Helper methods
  private async getLocationFromIP(ipAddress?: string): Promise<string | undefined> {
    if (!ipAddress) return undefined;
    
    try {
      // In a real app, you would use a geolocation service like ipapi.co or ipinfo.io
      // For now, return a placeholder
      return 'Unknown Location';
    } catch (error: any) {
      console.error('Error getting location from IP:', error);
      return undefined;
    }
  }

  private getDeviceType(userAgent?: string): string {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    if (userAgent.includes('Windows')) return 'Desktop (Windows)';
    if (userAgent.includes('Mac')) return 'Desktop (Mac)';
    if (userAgent.includes('Linux')) return 'Desktop (Linux)';
    
    return 'Unknown';
  }

  // Enhanced login with security logging
  async secureLogin(email: string, password: string, userAgent?: string): Promise<void> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Log successful login
      await this.logLoginAttempt(
        userCredential.user.uid,
        true,
        undefined,
        undefined, // IP address would be obtained from request headers in a real app
        userAgent
      );
    } catch (error: any) {
      // Log failed login attempt
      if (auth.currentUser) {
        await this.logLoginAttempt(
          auth.currentUser.uid,
          false,
          error.message,
          undefined,
          userAgent
        );
      }
      throw error;
    }
  }
}

export const securityService = new SecurityService();
