import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator, Image, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../theme';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen, Calendar, ChevronRight, LogOut, GraduationCap, FileText, Banknote, Clock, BarChart3, Bell, UserCheck
} from 'lucide-react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import PremiumAlert from '../components/PremiumAlert';
import { eventAPI, parentAPI } from '../api';

const displayGrade = (g) => {
  if (!g) return '';
  const str = g.toString().trim();
  if (str.toUpperCase() === 'JHS 1') return 'Basic 7';
  if (str.toUpperCase() === 'JHS 2') return 'Basic 8';
  if (str.toUpperCase() === 'JHS 3') return 'Basic 9';
  return str.replace(/Primary|Basic/i, 'Basic');
};

const DashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState([]);
  const [myChildren, setMyChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [comingSoon, setComingSoon] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  const role = user?.role || 'student';

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch calendar events
      const calRes = await eventAPI.getUpcoming().catch(() => null);
      if (calRes?.data?.success) setEvents(calRes.data.data.slice(0, 4));

      if (role === 'parent') {
        const childRes = await parentAPI.getMyChildren().catch(() => null);
        setMyChildren(childRes?.data?.data || []);
      }
    } catch (e) {
      console.log('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [role]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleModulePress = (route, title) => {
    if (route) {
      navigation.navigate(route);
    } else {
      setAlertConfig({ title: `${title} Coming Soon`, message: `The ${title} module is currently under development for mobile.` });
      setComingSoon(true);
    }
  };

  const ALL_MODULES = [
    { id: 'academic', title: 'Academics', icon: BookOpen, color: '#ec4899', route: 'Academics' },
    { id: 'schedule', title: 'Schedule', icon: Clock, color: '#8b5cf6', route: 'Schedule' },
    { id: 'exams', title: 'Grades', icon: GraduationCap, color: '#f59e0b', route: 'Grades' },
    { id: 'assignments', title: 'Assignments', icon: FileText, color: '#3b82f6', route: 'Assignments' },
    { id: 'attendance', title: 'Attendance', icon: UserCheck, color: '#14b8a6', route: 'Attendance' },
    { id: 'fees', title: 'Fees', icon: Banknote, color: '#10b981', route: 'Fees' },
  ];

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== HEADER ===== */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
        >
          <LinearGradient
            colors={['#00843e', '#006b32', '#0f4a2e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.headerGradient, { paddingTop: insets.top + 24 }]}
          >
            <View style={styles.headerContent}>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerGreeting}>Welcome back,</Text>
                <Text style={styles.headerName}>
                  {user?.firstName || user?.first_name
                    ? `${user.firstName || user.first_name} ${user.lastName || user.last_name || ''}`.trim()
                    : user?.name || user?.username || user?.email?.split('@')[0] || 'Welcome'}
                </Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{role.toUpperCase()}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity onPress={() => navigation.navigate('Announcements')} style={styles.logoutBtn}>
                  <Bell color="#fff" size={20} />
                </TouchableOpacity>
                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                  <LogOut color="#fff" size={20} />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </MotiView>

        {/* ===== MODULES GRID ===== */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 200 }}
          style={styles.sectionContainer}
        >
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.modulesGrid}>
            {ALL_MODULES.map((mod, index) => (
              <TouchableOpacity 
                key={mod.id} 
                style={styles.moduleCard} 
                activeOpacity={0.7}
                onPress={() => handleModulePress(mod.route, mod.title)}
              >
                <View style={[styles.moduleIconBox, { backgroundColor: `${mod.color}15` }]}>
                  <mod.icon color={mod.color} size={28} />
                </View>
                <Text style={styles.moduleCardText}>{mod.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </MotiView>

        {/* ===== PARENT: MY CHILDREN ===== */}
        {role === 'parent' && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 300 }}
            style={styles.sectionContainer}
          >
            <Text style={styles.sectionTitle}>My Children</Text>
            {myChildren.length > 0 ? myChildren.map((child, idx) => {
              const name = `${child.firstName || child.first_name || ''} ${child.lastName || child.last_name || ''}`.trim();
              const childColors = [COLORS.primary, '#6366f1', '#f59e0b', '#ef4444'];
              const cc = childColors[idx % childColors.length];
              return (
                <MotiView
                  key={child.id || idx}
                  from={{ opacity: 0, translateX: -20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ delay: idx * 80 + 300 }}
                  style={[styles.childCard, { borderLeftColor: cc, borderLeftWidth: 4 }]}
                >
                  <View style={[styles.childAvatar, { backgroundColor: `${cc}20` }]}>
                    <Text style={[styles.childAvatarText, { color: cc }]}>{getInitials(name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.childName}>{name}</Text>
                    <Text style={styles.childMeta}>{displayGrade(child.grade) || 'No grade'} {child.section ? `• Section ${child.section}` : ''}</Text>
                    <View style={[styles.childStatusBadge, { backgroundColor: child.status === 'active' ? '#ecfdf5' : '#fef2f2' }]}>
                      <Text style={[styles.childStatusText, { color: child.status === 'active' ? '#10b981' : '#ef4444' }]}>
                        {child.status || 'active'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.childActions}>
                    <TouchableOpacity
                      style={styles.childActionBtn}
                      onPress={() => navigation.navigate('Academics')}
                    >
                      <BarChart3 size={16} color={cc} />
                      <Text style={[styles.childActionText, { color: cc }]}>Grades</Text>
                    </TouchableOpacity>
                  </View>
                </MotiView>
              );
            }) : (
              <View style={styles.card}>
                <Text style={styles.emptyText}>No children linked to your account yet. Contact the school admin.</Text>
              </View>
            )}
          </MotiView>
        )}

        {/* ===== UPCOMING EVENTS ===== */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 400 }}
          style={styles.sectionContainer}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Calendar')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            {events.length > 0 ? events.map((event, idx) => (
              <View key={event.id || idx} style={[styles.eventItem, idx < events.length - 1 && styles.eventItemBorder]}>
                <View style={[styles.eventDateBox, { backgroundColor: event.isSchoolHoliday ? '#fef2f2' : '#ecfdf5' }]}>
                  <Text style={[styles.eventDateText, { color: event.isSchoolHoliday ? '#ef4444' : COLORS.primary }]}>
                    {formatDate(event.startDate)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                  <Text style={styles.eventDesc} numberOfLines={1}>{event.description || 'No description'}</Text>
                </View>
                <ChevronRight color={COLORS.slate[400]} size={16} />
              </View>
            )) : (
              <Text style={styles.emptyText}>No upcoming events</Text>
            )}
          </View>
        </MotiView>

      </ScrollView>

      <PremiumAlert
        isOpen={comingSoon}
        title={alertConfig.title}
        message={alertConfig.message}
        onCancel={() => setComingSoon(false)}
        type="info"
        confirmText="Got it"
        onConfirm={() => setComingSoon(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 40 },
  sectionContainer: { marginTop: 24 },

  // Header
  headerGradient: {
    padding: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerGreeting: { fontSize: 15, color: 'rgba(255,255,255,0.85)', fontWeight: '600', letterSpacing: 0.5 },
  headerName: { fontSize: 32, fontWeight: '900', color: '#fff', marginTop: 4, letterSpacing: -0.5 },
  roleBadge: {
    alignSelf: 'flex-start', marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'
  },
  roleText: { fontSize: 12, fontWeight: '800', color: COLORS.secondary, letterSpacing: 1.5 },
  logoutBtn: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },

  // Modules Grid
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 16,
  },
  moduleCard: {
    width: '30%',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.slate[100],
    shadowColor: COLORS.slate[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    marginBottom: 8,
  },
  moduleIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  moduleCardText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.slate[700],
    textAlign: 'center',
  },

  // Section
  sectionTitle: { fontSize: 20, fontWeight: '800', color: COLORS.slate[900], letterSpacing: -0.5, paddingHorizontal: 24, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 24, marginBottom: 16 },
  seeAll: { fontSize: 14, fontWeight: '700', color: COLORS.primary },

  // Card
  card: {
    marginHorizontal: 20, backgroundColor: COLORS.surface, borderRadius: 24, padding: 8,
    borderWidth: 1, borderColor: COLORS.slate[100],
    shadowColor: COLORS.slate[900], shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.04, shadowRadius: 16,
  },

  // Events
  eventItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  eventItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.slate[100] },
  eventDateBox: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, alignItems: 'center' },
  eventDateText: { fontSize: 13, fontWeight: '800' },
  eventTitle: { fontSize: 15, fontWeight: '700', color: COLORS.slate[900] },
  eventDesc: { fontSize: 13, color: COLORS.slate[500], fontWeight: '500', marginTop: 4 },
  emptyText: { textAlign: 'center', color: COLORS.slate[400], padding: 40, fontSize: 14, fontWeight: '600' },

  // Parent Children Cards
  childCard: {
    marginHorizontal: 20, marginBottom: 16, backgroundColor: COLORS.surface, borderRadius: 24,
    flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16,
    borderWidth: 1, borderColor: COLORS.slate[100],
    shadowColor: COLORS.slate[900], shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16,
  },
  childAvatar: {
    width: 56, height: 56, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  childAvatarText: { fontSize: 20, fontWeight: '800' },
  childName: { fontSize: 17, fontWeight: '800', color: COLORS.slate[900] },
  childMeta: { fontSize: 14, color: COLORS.slate[500], fontWeight: '500', marginTop: 4 },
  childStatusBadge: {
    alignSelf: 'flex-start', marginTop: 8,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
  },
  childStatusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  childActions: { alignItems: 'center' },
  childActionBtn: {
    alignItems: 'center', gap: 6, backgroundColor: COLORS.slate[50],
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16,
  },
  childActionText: { fontSize: 11, fontWeight: '700' },
});

export default DashboardScreen;
