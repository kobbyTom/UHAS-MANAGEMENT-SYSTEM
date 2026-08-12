import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Switch,
  ActivityIndicator, TouchableOpacity
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import Header from '../components/Header';
import { Bell, Mail, MessageSquare, BookOpen, Calendar, HelpCircle } from 'lucide-react-native';
import { MotiView } from 'moti';

const NotificationsScreen = () => {
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();

  const [emailNotif, setEmailNotif] = useState(user?.receive_email ?? true);
  const [smsNotif, setSmsNotif] = useState(user?.receive_sms ?? true);
  const [academicAlerts, setAcademicAlerts] = useState(true);
  const [eventAlerts, setEventAlerts] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  const handleToggle = async (type, val) => {
    let newEmail = emailNotif;
    let newSms = smsNotif;

    if (type === 'email') {
      setEmailNotif(val);
      newEmail = val;
    } else if (type === 'sms') {
      setSmsNotif(val);
      newSms = val;
    } else if (type === 'academic') {
      setAcademicAlerts(val);
      return;
    } else if (type === 'events') {
      setEventAlerts(val);
      return;
    }

    setLoading(true);
    setSaveStatus('');
    try {
      const res = await authAPI.updateNotifications({
        receive_email: newEmail,
        receive_sms: newSms
      });
      
      if (res.data?.success) {
        await updateUser({
          receive_email: newEmail,
          receive_sms: newSms
        });
        setSaveStatus('Preferences saved');
        setTimeout(() => setSaveStatus(''), 2000);
      }
    } catch (e) {
      console.log('Failed to update notifications preferences', e);
      // Revert local state
      if (type === 'email') setEmailNotif(!val);
      if (type === 'sms') setSmsNotif(!val);
      setSaveStatus('Failed to save preferences');
      setTimeout(() => setSaveStatus(''), 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header showBack={true} title="Notification Settings" subtitle="Configure notice updates" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.card}
        >
          <Text style={styles.sectionTitle}>Primary Channels</Text>
          
          {/* Email Notifications */}
          <View style={styles.settingRow}>
            <View style={[styles.iconWrapper, { backgroundColor: '#eff6ff' }]}>
              <Mail size={20} color="#2563eb" />
            </View>
            <View style={styles.infoWrapper}>
              <Text style={styles.settingTitle}>Email Alerts</Text>
              <Text style={styles.settingDesc}>Receive announcements and grade sheets via email</Text>
            </View>
            <Switch
              value={emailNotif}
              onValueChange={(val) => handleToggle('email', val)}
              trackColor={{ false: '#cbd5e1', true: COLORS.primary }}
              thumbColor={Platform.OS === 'ios' ? undefined : '#f8fafc'}
            />
          </View>

          {/* SMS Notifications */}
          <View style={[styles.settingRow, styles.borderTop]}>
            <View style={[styles.iconWrapper, { backgroundColor: '#ecfdf5' }]}>
              <MessageSquare size={20} color="#059669" />
            </View>
            <View style={styles.infoWrapper}>
              <Text style={styles.settingTitle}>SMS Alerts</Text>
              <Text style={styles.settingDesc}>Get urgent notice and fee updates on your phone</Text>
            </View>
            <Switch
              value={smsNotif}
              onValueChange={(val) => handleToggle('sms', val)}
              trackColor={{ false: '#cbd5e1', true: COLORS.primary }}
              thumbColor={Platform.OS === 'ios' ? undefined : '#f8fafc'}
            />
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 100 }}
          style={styles.card}
        >
          <Text style={styles.sectionTitle}>Categories</Text>
          
          {/* Academic Alerts */}
          <View style={styles.settingRow}>
            <View style={[styles.iconWrapper, { backgroundColor: '#fef3c7' }]}>
              <BookOpen size={20} color="#d97706" />
            </View>
            <View style={styles.infoWrapper}>
              <Text style={styles.settingTitle}>Academic Updates</Text>
              <Text style={styles.settingDesc}>New grades, assignments releases & exam reports</Text>
            </View>
            <Switch
              value={academicAlerts}
              onValueChange={(val) => handleToggle('academic', val)}
              trackColor={{ false: '#cbd5e1', true: COLORS.primary }}
              thumbColor={Platform.OS === 'ios' ? undefined : '#f8fafc'}
            />
          </View>

          {/* Event Alerts */}
          <View style={[styles.settingRow, styles.borderTop]}>
            <View style={[styles.iconWrapper, { backgroundColor: '#f5f3ff' }]}>
              <Calendar size={20} color="#7c3aed" />
            </View>
            <View style={styles.infoWrapper}>
              <Text style={styles.settingTitle}>School Events</Text>
              <Text style={styles.settingDesc}>PTA meetings, sports days & holiday declarations</Text>
            </View>
            <Switch
              value={eventAlerts}
              onValueChange={(val) => handleToggle('events', val)}
              trackColor={{ false: '#cbd5e1', true: COLORS.primary }}
              thumbColor={Platform.OS === 'ios' ? undefined : '#f8fafc'}
            />
          </View>
        </MotiView>

        {loading || saveStatus ? (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={styles.statusToast}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 8 }} />
            ) : null}
            <Text style={styles.statusText}>
              {loading ? 'Saving preferences...' : saveStatus}
            </Text>
          </MotiView>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fe' },
  scrollContent: { padding: 20, gap: 16 },
  
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.slate[400],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: 6,
    paddingTop: 20,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoWrapper: {
    flex: 1,
    paddingRight: 10,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.slate[800],
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 12,
    color: COLORS.slate[400],
    lineHeight: 16,
    fontWeight: '500',
  },
  statusToast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 100,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.slate[600],
  },
});

export default NotificationsScreen;
