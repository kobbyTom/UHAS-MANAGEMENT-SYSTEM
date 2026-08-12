import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme';
import { useAuth } from '../context/AuthContext';
import {
  LogOut, User, Mail, Phone, Shield, Calendar,
  ChevronRight, Settings, Bell, Lock, HelpCircle, Info
} from 'lucide-react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import PremiumAlert from '../components/PremiumAlert';

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [showLogout, setShowLogout] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const navigation = useNavigation();

  const role = user?.role || 'student';
  const name = user?.firstName || user?.first_name
    ? `${user.firstName || user.first_name} ${user.lastName || user.last_name || ''}`.trim()
    : user?.name || user?.username || user?.email?.split('@')[0] || 'User';
  const email = user?.email || 'N/A';

  const getInitials = (n) => {
    if (!n) return '?';
    return n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleLogout = () => setShowLogout(true);

  const MenuItem = ({ icon: Icon, title, subtitle, color = COLORS.slate[600], onPress, danger }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, { backgroundColor: danger ? '#fef2f2' : `${color}10` }]}>
        <Icon size={18} color={danger ? '#ef4444' : color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuTitle, danger && { color: '#ef4444' }]}>{title}</Text>
        {subtitle && <Text style={styles.menuSub}>{subtitle}</Text>}
      </View>
      <ChevronRight size={16} color={COLORS.slate[300]} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
        >
          <LinearGradient
            colors={['#00843e', '#006b32', '#0f4a2e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.profileHeader, { paddingTop: insets.top + 20 }]}
          >
            {/* Decorative */}
            <View style={[styles.decorCircle, { top: -20, right: -20, width: 100, height: 100 }]} />
            <View style={[styles.decorCircle, { bottom: -15, left: -15, width: 70, height: 70 }]} />

            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(name)}</Text>
              </View>
              <View style={styles.onlineDot} />
            </View>

            <Text style={styles.profileName}>{name}</Text>
            <Text style={styles.profileEmail}>{email}</Text>

            <View style={styles.rolePill}>
              <Shield size={12} color="#facc15" />
              <Text style={styles.rolePillText}>{role.toUpperCase()}</Text>
            </View>
          </LinearGradient>
        </MotiView>

        {/* Info Cards */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 200 }}
        >
          <View style={styles.infoRow}>
            <View style={styles.infoCard}>
              <Mail size={18} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{email}</Text>
            </View>
            <View style={styles.infoCard}>
              <Calendar size={18} color="#3b82f6" />
              <Text style={styles.infoLabel}>Joined</Text>
              <Text style={styles.infoValue}>
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '2026'}
              </Text>
            </View>
          </View>
        </MotiView>

        {/* Menu Sections */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 300 }}
        >
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.menuCard}>
            <MenuItem icon={User} title="Edit Profile" subtitle="Update your personal info" color={COLORS.primary} onPress={() => navigation.navigate('EditProfile')} />
            <View style={styles.menuDivider} />
            <MenuItem icon={Lock} title="Change Password" subtitle="Update your security" color="#8b5cf6" onPress={() => navigation.navigate('ChangePassword')} />
            <View style={styles.menuDivider} />
            <MenuItem icon={Bell} title="Notifications" subtitle="Manage alert preferences" color="#f59e0b" onPress={() => navigation.navigate('Notifications')} />
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 400 }}
        >
          <Text style={styles.sectionLabel}>SUPPORT</Text>
          <View style={styles.menuCard}>
            <MenuItem icon={HelpCircle} title="Help & Support" subtitle="FAQs and contact info" color="#06b6d4" onPress={() => navigation.navigate('HelpSupport')} />
            <View style={styles.menuDivider} />
            <MenuItem icon={Info} title="About" subtitle="App version & info" color={COLORS.slate[600]} onPress={() => setShowAbout(true)} />
          </View>
        </MotiView>

        {/* Logout */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 500 }}
          style={{ paddingHorizontal: 20, marginTop: 8 }}
        >
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <LogOut size={18} color="#ef4444" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </MotiView>

        {/* Footer */}
        <Text style={styles.footerText}>UHAS Basic School • v1.0.0</Text>
      </ScrollView>

      <PremiumAlert
        isOpen={showLogout}
        type="warning"
        title="Sign Out"
        message="Are you sure you want to sign out of your account?"
        confirmText="Sign Out"
        cancelText="Cancel"
        onConfirm={() => { setShowLogout(false); logout(); }}
        onCancel={() => setShowLogout(false)}
      />

      <PremiumAlert
        isOpen={showAbout}
        type="info"
        title="About School App"
        message="Version 1.0.0\n\nBuilt to connect students, parents, and teachers securely. All rights reserved."
        confirmText="Got it"
        onConfirm={() => setShowAbout(false)}
        onCancel={() => setShowAbout(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fe' },
  scrollContent: { paddingBottom: 30 },

  // Profile Header
  profileHeader: {
    alignItems: 'center',
    paddingBottom: 30, borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    overflow: 'hidden', position: 'relative',
  },
  decorCircle: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.06)' },
  avatarContainer: { position: 'relative', marginBottom: 14 },
  avatar: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: { fontSize: 28, fontWeight: '900', color: '#fff' },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 16, height: 16, borderRadius: 8, backgroundColor: '#22c55e',
    borderWidth: 3, borderColor: '#006b32',
  },
  profileName: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  profileEmail: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginTop: 2 },
  rolePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 12, backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
  },
  rolePillText: { fontSize: 10, fontWeight: '900', color: '#facc15', letterSpacing: 1.2 },

  // Info Cards
  infoRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginTop: -16 },
  infoCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12,
  },
  infoLabel: { fontSize: 10, fontWeight: '800', color: COLORS.slate[400], marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 },
  infoValue: { fontSize: 13, fontWeight: '800', color: COLORS.slate[900], marginTop: 2 },

  // Menu
  sectionLabel: {
    fontSize: 11, fontWeight: '900', color: COLORS.slate[400],
    letterSpacing: 1.2, paddingHorizontal: 24, marginTop: 28, marginBottom: 10,
  },
  menuCard: {
    marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 18, padding: 4,
    borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 },
  menuDivider: { height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 14 },
  menuIcon: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuTitle: { fontSize: 14, fontWeight: '800', color: COLORS.slate[900] },
  menuSub: { fontSize: 11, color: COLORS.slate[400], fontWeight: '600', marginTop: 1 },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 14, paddingVertical: 16,
    borderWidth: 1.5, borderColor: '#fecaca',
  },
  logoutText: { fontSize: 15, fontWeight: '800', color: '#ef4444' },

  // Footer
  footerText: {
    textAlign: 'center', color: COLORS.slate[400], fontSize: 11, fontWeight: '600',
    marginTop: 24,
  },
});

export default ProfileScreen;
