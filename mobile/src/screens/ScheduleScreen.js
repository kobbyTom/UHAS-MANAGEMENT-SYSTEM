import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, Clock, BookOpen, User, MapPin, Calendar } from 'lucide-react-native';
import { MotiView } from 'moti';
import { timetableAPI, studentAPI, teacherAPI } from '../api';
import Header from '../components/Header';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const FULL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const DAY_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

const ScheduleScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date().getDay(); // 0=Sun, 1=Mon...
    const idx = today >= 1 && today <= 5 ? today - 1 : 0;
    return idx;
  });
  const insets = useSafeAreaInsets();

  const role = user?.role || 'student';

  useEffect(() => { fetchTimetable(); }, []);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      let data = [];

      if (role === 'teacher') {
        // Get teacher profile first to get their DB id
        const profileRes = await teacherAPI.getAll({ limit: 1 }).catch(() => null);
        // Try fetching by teacher user id - backend resolves profile automatically
        const res = await timetableAPI.getByTeacher(user?.id || '').catch(() => null);
        data = res?.data?.data || res?.data || [];
      } else {
        // For student/parent: fetch by grade
        let grade = user?.grade;
        if (!grade) {
          const stuRes = await studentAPI.getAll({ limit: 1 }).catch(() => null);
          const stu = stuRes?.data?.data?.[0];
          grade = stu?.grade;
        }
        if (grade) {
          const res = await timetableAPI.getByGrade(grade).catch(() => null);
          data = res?.data?.data || res?.data || [];
        } else {
          const res = await timetableAPI.getAll().catch(() => null);
          data = res?.data?.data || res?.data || [];
        }
      }

      // Normalize: each timetable entry may have a `periods` array
      setTimetables(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Timetable fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTimetable();
    setRefreshing(false);
  }, []);

  // Flatten all periods across all timetable entries and filter by selected day
  const getPeriodsForDay = () => {
    const dayName = FULL_DAYS[selectedDay];
    const allPeriods = [];

    timetables.forEach(tt => {
      const periods = tt.periods || tt.schedule || [];
      periods.forEach(p => {
        const pDay = (p.day || p.day_of_week || '').toLowerCase();
        if (pDay === dayName.toLowerCase() || pDay === DAYS[selectedDay].toLowerCase()) {
          allPeriods.push({
            ...p,
            className: tt.class_name || tt.grade || tt.name || '',
            section: tt.section || '',
          });
        }
      });
    });

    // Sort by start time
    return allPeriods.sort((a, b) => {
      const ta = a.start_time || a.startTime || '00:00';
      const tb = b.start_time || b.startTime || '00:00';
      return ta.localeCompare(tb);
    });
  };

  const periods = getPeriodsForDay();

  const formatTime = (t) => {
    if (!t) return '--:--';
    return t.length > 5 ? t.slice(0, 5) : t;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header showBack={true} title="Schedule" subtitle="Daily classes & events" />

      {/* Day Selector */}
      <View style={styles.daySelector}>
        {DAYS.map((day, idx) => (
          <TouchableOpacity
            key={day}
            style={[
              styles.dayBtn,
              selectedDay === idx && [styles.dayBtnActive, { backgroundColor: DAY_COLORS[idx] }]
            ]}
            onPress={() => setSelectedDay(idx)}
            activeOpacity={0.7}
          >
            <Text style={[styles.dayBtnText, selectedDay === idx && styles.dayBtnTextActive]}>
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {timetables.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={56} color={COLORS.slate[200]} />
            <Text style={styles.emptyTitle}>No Timetable Found</Text>
            <Text style={styles.emptyText}>
              {role === 'teacher'
                ? 'Your schedule has not been set up yet. Contact the admin.'
                : 'Your class schedule has not been set up yet.'}
            </Text>
          </View>
        ) : periods.length === 0 ? (
          <View style={styles.emptyState}>
            <Clock size={56} color={COLORS.slate[200]} />
            <Text style={styles.emptyTitle}>No Classes Today</Text>
            <Text style={styles.emptyText}>
              No periods scheduled for {FULL_DAYS[selectedDay]}. Enjoy the day!
            </Text>
          </View>
        ) : (
          <>
            {/* Period count pill */}
            <View style={styles.periodCount}>
              <Text style={styles.periodCountText}>{periods.length} period{periods.length !== 1 ? 's' : ''}</Text>
            </View>

            {periods.map((period, idx) => {
              const color = DAY_COLORS[idx % DAY_COLORS.length];
              const subject = period.subject_name || period.subject || period.title || 'Class';
              const teacher = period.teacher_name || period.teacher || '';
              const room = period.room || period.venue || period.location || '';
              const startTime = formatTime(period.start_time || period.startTime);
              const endTime = formatTime(period.end_time || period.endTime);

              return (
                <MotiView
                  key={`${period.id || idx}-${idx}`}
                  from={{ opacity: 0, translateX: -20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: 'timing', duration: 350, delay: idx * 60 }}
                  style={styles.periodRow}
                >
                  {/* Time Column */}
                  <View style={styles.timeCol}>
                    <Text style={styles.timeText}>{startTime}</Text>
                    <View style={[styles.timeLine, { backgroundColor: `${color}30` }]} />
                    <Text style={[styles.timeEnd, { color: color }]}>{endTime}</Text>
                  </View>

                  {/* Card */}
                  <View style={[styles.periodCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
                    <View style={[styles.periodIconBox, { backgroundColor: `${color}12` }]}>
                      <BookOpen size={18} color={color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.periodSubject} numberOfLines={1}>{subject}</Text>
                      {teacher ? (
                        <View style={styles.periodMeta}>
                          <User size={11} color={COLORS.slate[400]} style={{ marginRight: 4 }} />
                          <Text style={styles.periodMetaText} numberOfLines={1}>{teacher}</Text>
                        </View>
                      ) : null}
                      {room ? (
                        <View style={styles.periodMeta}>
                          <MapPin size={11} color={COLORS.slate[400]} style={{ marginRight: 4 }} />
                          <Text style={styles.periodMetaText}>{room}</Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={[styles.periodBadge, { backgroundColor: `${color}12` }]}>
                      <Text style={[styles.periodBadgeText, { color }]}>
                        {period.duration || `${startTime}–${endTime}`}
                      </Text>
                    </View>
                  </View>
                </MotiView>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fe' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: COLORS.slate[100],
  },
  backBtn: { padding: 8, marginLeft: -8, marginRight: 8 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.slate[900], letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: COLORS.slate[500], fontWeight: '600', marginTop: 2 },
  calendarIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#ecfdf5', justifyContent: 'center', alignItems: 'center',
  },

  // Day Selector
  daySelector: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: COLORS.slate[100],
  },
  dayBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 12,
    backgroundColor: '#f8fafc', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.slate[100],
  },
  dayBtnActive: { borderColor: 'transparent' },
  dayBtnText: { fontSize: 13, fontWeight: '800', color: COLORS.slate[400] },
  dayBtnTextActive: { color: '#fff' },

  // Period count
  periodCount: {
    alignSelf: 'flex-start', marginBottom: 14,
    backgroundColor: '#ecfdf5', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  periodCountText: { fontSize: 12, fontWeight: '800', color: COLORS.primary },

  // Period Row
  periodRow: { flexDirection: 'row', gap: 12, marginBottom: 16, alignItems: 'stretch' },
  timeCol: { width: 48, alignItems: 'center', paddingTop: 14 },
  timeText: { fontSize: 11, fontWeight: '800', color: COLORS.slate[600] },
  timeLine: { flex: 1, width: 2, marginVertical: 4, borderRadius: 2 },
  timeEnd: { fontSize: 10, fontWeight: '700' },

  // Period Card
  periodCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8,
  },
  periodIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  periodSubject: { fontSize: 15, fontWeight: '800', color: COLORS.slate[900] },
  periodMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  periodMetaText: { fontSize: 12, color: COLORS.slate[400], fontWeight: '600' },
  periodBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 },
  periodBadgeText: { fontSize: 10, fontWeight: '900' },

  // Empty
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: COLORS.slate[800], marginTop: 18 },
  emptyText: { fontSize: 14, color: COLORS.slate[500], fontWeight: '600', marginTop: 8, textAlign: 'center', paddingHorizontal: 30, lineHeight: 22 },
});

export default ScheduleScreen;
