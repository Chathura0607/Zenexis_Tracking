import { useAuth } from '@/contexts/AuthContext';
import { LoginSession, securityService, SecuritySettings } from '@/services/securityService';
import {
    AlertTriangle,
    Eye,
    Globe,
    Lock,
    Monitor,
    Shield,
    Smartphone,
    X
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SecuritySettingsScreen() {
  const { user } = useAuth();
  const [loginHistory, setLoginHistory] = useState<LoginSession[]>([]);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    loginNotifications: true,
    suspiciousActivityAlerts: true,
    sessionTimeout: 30,
    allowedDevices: [],
  });
  const [loading, setLoading] = useState(true);
  const [showLoginHistory, setShowLoginHistory] = useState(false);
  const [securityReport, setSecurityReport] = useState<any>(null);

  useEffect(() => {
    loadSecurityData();
  }, [user]);

  const loadSecurityData = async () => {
    if (!user) return;
    
    try {
      const [history, settings, report] = await Promise.all([
        securityService.getLoginHistory(user.uid, 20),
        securityService.getSecuritySettings(user.uid),
        securityService.generateSecurityReport(user.uid)
      ]);
      
      setLoginHistory(history);
      setSecuritySettings(settings);
      setSecurityReport(report);
    } catch (error) {
      Alert.alert('Error', 'Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSetting = async (setting: keyof SecuritySettings, value: any) => {
    if (!user) return;
    
    try {
      const newSettings = { ...securitySettings, [setting]: value };
      await securityService.updateSecuritySettings(user.uid, newSettings);
      setSecuritySettings(newSettings);
      Alert.alert('Success', 'Security settings updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update security settings');
    }
  };

  const handleViewLoginHistory = () => {
    setShowLoginHistory(true);
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <Shield size={16} color="#16a34a" />
    ) : (
      <AlertTriangle size={16} color="#ef4444" />
    );
  };

  const getDeviceIcon = (deviceType?: string) => {
    if (!deviceType) return <Monitor size={16} color="#6b7280" />;
    
    if (deviceType.includes('Mobile')) return <Smartphone size={16} color="#6b7280" />;
    if (deviceType.includes('Tablet')) return <Monitor size={16} color="#6b7280" />;
    return <Monitor size={16} color="#6b7280" />;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading security settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Security Settings</Text>
        </View>

        {/* Security Overview */}
        {securityReport && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security Overview</Text>
            <View style={styles.overviewCard}>
              <View style={styles.overviewRow}>
                <Text style={styles.overviewLabel}>Total Logins</Text>
                <Text style={styles.overviewValue}>{securityReport.totalLogins}</Text>
              </View>
              <View style={styles.overviewRow}>
                <Text style={styles.overviewLabel}>Successful Logins</Text>
                <Text style={[styles.overviewValue, { color: '#16a34a' }]}>
                  {securityReport.successfulLogins}
                </Text>
              </View>
              <View style={styles.overviewRow}>
                <Text style={styles.overviewLabel}>Failed Logins</Text>
                <Text style={[styles.overviewValue, { color: '#ef4444' }]}>
                  {securityReport.failedLogins}
                </Text>
              </View>
              <View style={styles.overviewRow}>
                <Text style={styles.overviewLabel}>Unique Devices</Text>
                <Text style={styles.overviewValue}>{securityReport.uniqueDevices}</Text>
              </View>
              <View style={styles.overviewRow}>
                <Text style={styles.overviewLabel}>Unique Locations</Text>
                <Text style={styles.overviewValue}>{securityReport.uniqueLocations}</Text>
              </View>
              {securityReport.suspiciousActivity && (
                <View style={styles.suspiciousAlert}>
                  <AlertTriangle size={16} color="#ef4444" />
                  <Text style={styles.suspiciousText}>Suspicious activity detected</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Security Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Preferences</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Two-Factor Authentication</Text>
                <Text style={styles.settingSubtitle}>Add an extra layer of security</Text>
              </View>
              <Switch
                value={securitySettings.twoFactorEnabled}
                onValueChange={(value) => handleToggleSetting('twoFactorEnabled', value)}
                trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                thumbColor={securitySettings.twoFactorEnabled ? '#ffffff' : '#ffffff'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Login Notifications</Text>
                <Text style={styles.settingSubtitle}>Get notified of new logins</Text>
              </View>
              <Switch
                value={securitySettings.loginNotifications}
                onValueChange={(value) => handleToggleSetting('loginNotifications', value)}
                trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                thumbColor={securitySettings.loginNotifications ? '#ffffff' : '#ffffff'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Suspicious Activity Alerts</Text>
                <Text style={styles.settingSubtitle}>Alert for unusual login patterns</Text>
              </View>
              <Switch
                value={securitySettings.suspiciousActivityAlerts}
                onValueChange={(value) => handleToggleSetting('suspiciousActivityAlerts', value)}
                trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                thumbColor={securitySettings.suspiciousActivityAlerts ? '#ffffff' : '#ffffff'}
              />
            </View>
          </View>
        </View>

        {/* Session Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Management</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingRow} onPress={handleViewLoginHistory}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Login History</Text>
                <Text style={styles.settingSubtitle}>View recent login attempts</Text>
              </View>
              <Eye size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Tips</Text>
          <View style={styles.tipsCard}>
            <View style={styles.tipItem}>
              <Shield size={20} color="#3b82f6" />
              <Text style={styles.tipText}>Use a strong, unique password</Text>
            </View>
            <View style={styles.tipItem}>
              <Lock size={20} color="#3b82f6" />
              <Text style={styles.tipText}>Enable two-factor authentication</Text>
            </View>
            <View style={styles.tipItem}>
              <Globe size={20} color="#3b82f6" />
              <Text style={styles.tipText}>Be cautious on public networks</Text>
            </View>
            <View style={styles.tipItem}>
              <Monitor size={20} color="#3b82f6" />
              <Text style={styles.tipText}>Log out from shared devices</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Login History Modal */}
      <Modal visible={showLoginHistory} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Login History</Text>
            <TouchableOpacity onPress={() => setShowLoginHistory(false)}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {loginHistory.map((session, index) => (
              <View key={index} style={styles.sessionItem}>
                <View style={styles.sessionHeader}>
                  <View style={styles.sessionInfo}>
                    {getStatusIcon(session.success)}
                    <Text style={styles.sessionStatus}>
                      {session.success ? 'Successful Login' : 'Failed Login'}
                    </Text>
                  </View>
                  <Text style={styles.sessionTime}>
                    {formatDate(session.timestamp)}
                  </Text>
                </View>
                
                <View style={styles.sessionDetails}>
                  <View style={styles.sessionDetail}>
                    {getDeviceIcon(session.deviceType)}
                    <Text style={styles.sessionDetailText}>
                      {session.deviceType || 'Unknown Device'}
                    </Text>
                  </View>
                  
                  {session.location && (
                    <View style={styles.sessionDetail}>
                      <Globe size={16} color="#6b7280" />
                      <Text style={styles.sessionDetailText}>{session.location}</Text>
                    </View>
                  )}
                  
                  {session.failureReason && (
                    <Text style={styles.failureReason}>
                      {session.failureReason}
                    </Text>
                  )}
                </View>
              </View>
            ))}
            
            {loginHistory.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No login history available</Text>
              </View>
            )}
          </ScrollView>
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
  overviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  overviewLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  suspiciousAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  suspiciousText: {
    color: '#ef4444',
    marginLeft: 8,
    fontWeight: '500',
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
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  tipsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 12,
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
    flex: 1,
    padding: 24,
  },
  sessionItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionStatus: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginLeft: 8,
  },
  sessionTime: {
    fontSize: 14,
    color: '#6b7280',
  },
  sessionDetails: {
    marginTop: 8,
  },
  sessionDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sessionDetailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  failureReason: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
});
