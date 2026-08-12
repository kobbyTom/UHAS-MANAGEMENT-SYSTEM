import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme';
import { parentAPI, attendanceAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import { MotiView } from 'moti';
import { UserCheck, UserX, Clock, CalendarDays, TrendingUp } from 'lucide-react-native';

const STATUS_CONFIG = {
  present: { color: '#10b981', bg: '#ecfdf5', icon: UserCheck, label: 'Present' },
  absent: { color: '#ef4444', bg: '#fef2f2', icon: UserX, label: 'Absent' },
  late: { color: '#f59e0b', bg: '#fffbeb', icon: Clock, label: 'Late' },
  excused: { color: '#8b5cf6', bg: '#f5f3ff', icon: CalendarDays, label: 'Excused' },
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'Unknown';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const AttendanceScreen = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const role = user?.role || 'student';

  const fetchData = async () => {
    try {
      setLoading(true);
      let results = [];
      if (role === 'parent') {
        const res = await parentAPI.getMyChildrenAttendance().catch(() => null);
        results = res?.data?.data || res?.data || [];
      } else {
        const res = await attendanceAPI.getAll().catch(() => null);
        results = res?.data?.data || res?.data || [];
      }
      setData(Array.isArray(results) ? results : []);
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  // Compute summary stats
  const totalDays = data.length;
  const presentDays = data.filter(d => (d.status || '').toLowerCase() === 'present').length;
  const absentDays = data.filter(d => (d.status || '').toLowerCase() === 'absent').length;
  const lateDays = data.filter(d => (d.status || '').toLowerCase() === 'late').length;
  const attendanceRate = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : '--';

  return (
    <View style={styles.container}>
      <Header showBack={true} title="Attendance" subtitle="Presence records" />

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        >
          {data.length === 0 ? (
            <View style={styles.emptyState}>
              <MotiView
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', delay: 100 }}
              >
                <View style={styles.emptyIcon}>
                  <UserCheck size={48} color={COLORS.slate[300]} />
                </View>
              </MotiView>
              <Text style={styles.emptyTitle}>No Attendance Records</Text>
              <Text style={styles.emptyText}>
                Attendance records will appear here once they are recorded.
              </Text>
            </View>
          ) : (
            <>
              {/* Attendance Rate Card */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500 }}
              >
                <View style={styles.rateCard}>
                  <View style={styles.rateLeft}>
                    <View style={styles.rateCircle}>
                      <Text style={styles.rateValue}>{attendanceRate}%</Text>
                    </View>
                    <Text style={styles.rateLabel}>Attendance Rate</Text>
                  </View>
                  <View style={styles.rateStats}>
                    <View style={styles.rateStat}>
                      <View style={[styles.rateStatDot, { backgroundColor: '#10b981' }]} />
                      <Text style={styles.rateStatValue}>{presentDays}</Text>
                      <Text style={styles.rateStatLabel}>Present</Text>
                    </View>
                    <View style={styles.rateStat}>
                      <View style={[styles.rateStatDot, { backgroundColor: '#ef4444' }]} />
                      <Text style={styles.rateStatValue}>{absentDays}</Text>
                      <Text style={styles.rateStatLabel}>Absent</Text>
                    </View>
                    <View style={styles.rateStat}>
                      <View style={[styles.rateStatDot, { backgroundColor: '#f59e0b' }]} />
                      <Text style={styles.rateStatValue}>{lateDays}</Text>
                      <Text style={styles.rateStatLabel}>Late</Text>
                    </View>
                    <View style={styles.rateStat}>
                      <View style={[styles.rateStatDot, { backgroundColor: '#0ea5e9' }]} />
                      <Text style={styles.rateStatValue}>{totalDays}</Text>
                      <Text style={styles.rateStatLabel}>Total</Text>
                    </View>
                  </View>
                </View>
              </MotiView>

              {/* Attendance Progress Bar */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500, delay: 100 }}
              >
                <View style={styles.progressCard}>
                  <View style={styles.progressHeader}>
                    <TrendingUp size={16} color={COLORS.primary} />
                    <Text style={styles.progressTitle}>Overall Progress</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <MotiView
                      from={{ width: '0%' }}
                      animate={{ width: `${Math.min(parseFloat(attendanceRate) || 0, 100)}%` }}
                      transition={{ type: 'timing', duration: 1000, delay: 300 }}
                      style={[styles.progressFill, {
                        backgroundColor: parseFloat(attendanceRate) >= 80 ? '#10b981' :
                          parseFloat(attendanceRate) >= 60 ? '#f59e0b' : '#ef4444'
                      }]}
                    />
                  </View>
                  <Text style={styles.progressHint}>
                    {parseFloat(attendanceRate) >= 90 ? '🌟 Excellent attendance!' :
                      parseFloat(attendanceRate) >= 80 ? '👍 Good attendance' :
                        parseFloat(attendanceRate) >= 60 ? '⚠️ Could be better' : '🚨 Needs attention'}
                  </Text>
                </View>
              </MotiView>

              {/* Records List */}
              <Text style={styles.sectionTitle}>Recent Records</Text>
              {data.map((item, idx) => {
                const dateStr = item.date || item.created_at || '';
                const statusKey = (item.status || 'present').toLowerCase();
                const config = STATUS_CONFIG[statusKey] || STATUS_CONFIG.present;
                const StatusIcon = config.icon;
                const childName = item.student_name || item.child_name || '';

                return (
                  <MotiView
                    key={item.id || idx}
                    from={{ opacity: 0, translateX: -20 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{ type: 'timing', duration: 350, delay: idx * 50 }}
                  >
                    <View style={styles.recordCard}>
                      <View style={[styles.recordIcon, { backgroundColor: config.bg }]}>
                        <StatusIcon size={18} color={config.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.recordDate}>{formatDate(dateStr)}</Text>
                        {childName ? <Text style={styles.recordChild}>{childName}</Text> : null}
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                        <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                      </View>
                    </View>
                  </MotiView>
                );
              })}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fe' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20 },

  // Rate Card
  rateCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: 22, marginBottom: 14,
    flexDirection: 'row', alignItems: 'center', gap: 20,
    borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16,
  },
  rateLeft: { alignItems: 'center' },
  rateCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#ecfdf5', borderWidth: 4, borderColor: '#10b981',
    justifyContent: 'center', alignItems: 'center',
  },
  rateValue: { fontSize: 18, fontWeight: '900', color: '#10b981' },
  rateLabel: { fontSize: 10, fontWeight: '800', color: COLORS.slate[400], marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  rateStats: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  rateStat: { alignItems: 'center', width: '42%' },
  rateStatDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
  rateStatValue: { fontSize: 18, fontWeight: '900', color: COLORS.slate[900] },
  rateStatLabel: { fontSize: 10, fontWeight: '700', color: COLORS.slate[400], textTransform: 'uppercase', letterSpacing: 0.3 },

  // Progress Card
  progressCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 24,
    borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12,
  },
  progressHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  progressTitle: { fontSize: 14, fontWeight: '800', color: COLORS.slate[900] },
  progressBar: { height: 10, backgroundColor: '#f1f5f9', borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 6 },
  progressHint: { fontSize: 12, fontWeight: '700', color: COLORS.slate[500], marginTop: 10 },

  // Section
  sectionTitle: { fontSize: 16, fontWeight: '900', color: COLORS.slate[900], marginBottom: 14, letterSpacing: -0.3 },

  // Record Card
  recordCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8,
  },
  recordIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  recordDate: { fontSize: 14, fontWeight: '800', color: COLORS.slate[900] },
  recordChild: { fontSize: 12, color: COLORS.slate[400], fontWeight: '600', marginTop: 2 },

  // Status Badge
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },

  // Empty
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyIcon: {
    width: 96, height: 96, borderRadius: 32, backgroundColor: '#f1f5f9',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: COLORS.slate[800] },
  emptyText: {
    fontSize: 14, color: COLORS.slate[500], fontWeight: '600', marginTop: 8,
    textAlign: 'center', paddingHorizontal: 40, lineHeight: 22,
  },
});

export default AttendanceScreen;
