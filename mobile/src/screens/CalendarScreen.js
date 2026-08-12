import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalIcon, Trash2 } from 'lucide-react-native';
import { MotiView } from 'moti';
import { eventAPI, academicCalendarAPI } from '../api';
import Header from '../components/Header';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EVENT_COLORS = { event: '#00843e', meeting: '#3b82f6', holiday: '#facc15', exam: '#ef4444', announcement: '#8b5cf6' };

const CalendarScreen = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [academicInfo, setAcademicInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const insets = useSafeAreaInsets();

  const role = user?.role || 'student';
  const isAdmin = role === 'admin' || role === 'staff' || role === 'ITSupport' || role === 'teacher';

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const [res, acaRes] = await Promise.all([
        eventAPI.getAll(),
        academicCalendarAPI.getAll()
      ]);
      
      if (res.data?.success) {
        setEvents(res.data.data.map(e => ({
          id: e.id,
          title: e.title,
          date: e.startDate || e.date,
          type: e.eventType || e.type || 'event',
          color: e.color || EVENT_COLORS[e.eventType || e.type] || '#00843e',
          description: e.description,
          time: e.time,
        })));
      }
      
      if (acaRes.data?.success) {
        setAcademicInfo(acaRes.data.data || []);
      }
    } catch (e) { console.log('Calendar fetch error:', e); }
    finally { setLoading(false); }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }, []);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const { firstDay, daysInMonth } = getDaysInMonth(currentDate);

  const getEventsForDay = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const today = new Date();
  const isToday = (day) => today.getDate() === day && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  // Upcoming events (sorted by date)
  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date(today.toISOString().split('T')[0]))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 6);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header showBack={true} title="School Calendar" subtitle="View events & academic schedule" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >

        {/* Calendar Card */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          style={styles.calendarCard}
        >
          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
              <ChevronLeft color={COLORS.slate[600]} size={20} />
            </TouchableOpacity>
            <Text style={styles.monthText}>
              {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
              <ChevronRight color={COLORS.slate[600]} size={20} />
            </TouchableOpacity>
          </View>

          {/* Day Names */}
          <View style={styles.dayNamesRow}>
            {DAY_NAMES.map(d => (
              <Text key={d} style={styles.dayName}>{d}</Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {[...Array(firstDay)].map((_, i) => (
              <View key={`e-${i}`} style={styles.dayCell} />
            ))}
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const todayFlag = isToday(day);
              const selected = selectedDay === day;
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayCell,
                    todayFlag && styles.todayCell,
                    selected && styles.selectedCell,
                  ]}
                  onPress={() => setSelectedDay(selected ? null : day)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.dayNumber,
                    todayFlag && styles.todayNumber,
                    selected && styles.selectedNumber,
                  ]}>
                    {day}
                  </Text>
                  {dayEvents.length > 0 && (
                    <View style={styles.dotRow}>
                      {dayEvents.slice(0, 3).map((ev, idx) => (
                        <View key={idx} style={[styles.eventDot, { backgroundColor: ev.color }]} />
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </MotiView>

        {/* Selected Day Events */}
        {selectedDay && selectedDayEvents.length > 0 && (
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 300 }}
          >
            <Text style={styles.sectionTitle}>
              Events on {MONTH_NAMES[currentDate.getMonth()]} {selectedDay}
            </Text>
            <View style={styles.eventListCard}>
              {selectedDayEvents.map((ev, idx) => (
                <View key={ev.id || idx} style={[styles.eventRow, idx < selectedDayEvents.length - 1 && styles.eventRowBorder]}>
                  <View style={[styles.eventTypeBar, { backgroundColor: ev.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.eventRowTitle}>{ev.title}</Text>
                    <Text style={styles.eventRowSub}>{ev.description || ev.type} • {ev.time || 'All Day'}</Text>
                  </View>
                </View>
              ))}
            </View>
          </MotiView>
        )}

        {/* Legend */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 200 }}
        >
          <Text style={styles.sectionTitle}>Event Legend</Text>
          <View style={styles.legendCard}>
            {Object.entries(EVENT_COLORS).map(([type, color]) => (
              <View key={type} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: color }]} />
                <Text style={styles.legendText}>{type.charAt(0).toUpperCase() + type.slice(1)}s</Text>
              </View>
            ))}
          </View>
        </MotiView>

        {/* Upcoming Events */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 300 }}
        >
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <View style={styles.eventListCard}>
            {upcomingEvents.length > 0 ? upcomingEvents.map((ev, idx) => (
              <View key={ev.id || idx} style={[styles.eventRow, idx < upcomingEvents.length - 1 && styles.eventRowBorder]}>
                <View style={[styles.eventIconBox, { backgroundColor: `${ev.color}15` }]}>
                  <CalIcon color={ev.color} size={18} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventRowTitle}>{ev.title}</Text>
                  <Text style={styles.eventRowSub}>{formatDate(ev.date)} • {ev.time || 'All Day'}</Text>
                </View>
              </View>
            )) : (
              <Text style={styles.emptyText}>No upcoming events</Text>
            )}
          </View>
        </MotiView>

        {/* Academic Calendar Section */}
        {academicInfo.length > 0 && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 400 }}
          >
            <Text style={styles.sectionTitle}>Academic Calendar Info</Text>
            <View style={styles.eventListCard}>
              {academicInfo.map((info, idx) => (
                <View key={info.id || idx} style={[styles.eventRow, idx < academicInfo.length - 1 && styles.eventRowBorder]}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.eventRowTitle}>{info.term} - {info.week}</Text>
                      <Text style={[styles.eventRowSub, { color: COLORS.primary, fontWeight: '800' }]}>{info.dateRange}</Text>
                    </View>
                    <Text style={[styles.eventRowSub, { marginTop: 4, color: COLORS.slate[700] }]}>{info.activity}</Text>
                    {info.status && (
                      <View style={{ marginTop: 6, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#f1f5f9', borderRadius: 6 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: COLORS.slate[500] }}>{info.status}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </MotiView>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fe' },
  scrollContent: { paddingBottom: 30 },

  header: {
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 10 : 20, paddingBottom: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  pageTitle: { fontSize: 26, fontWeight: '900', color: COLORS.slate[900], letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 13, color: COLORS.slate[400], fontWeight: '600', marginTop: 2 },

  // Calendar Card
  calendarCard: {
    marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12,
  },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  navBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  monthText: { fontSize: 17, fontWeight: '800', color: COLORS.slate[900] },
  dayNamesRow: { flexDirection: 'row', marginBottom: 8 },
  dayName: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: COLORS.slate[400], textTransform: 'uppercase' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%`, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 12, marginBottom: 2 },
  todayCell: { backgroundColor: '#dcfce7', borderWidth: 1.5, borderColor: COLORS.primary },
  selectedCell: { backgroundColor: COLORS.primary },
  dayNumber: { fontSize: 13, fontWeight: '600', color: COLORS.slate[800] },
  todayNumber: { color: COLORS.primary, fontWeight: '800' },
  selectedNumber: { color: '#fff', fontWeight: '800' },
  dotRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  eventDot: { width: 5, height: 5, borderRadius: 3 },

  // Sections
  sectionTitle: { fontSize: 16, fontWeight: '900', color: COLORS.slate[900], letterSpacing: -0.3, paddingHorizontal: 20, marginTop: 24, marginBottom: 12 },

  // Legend
  legendCard: {
    marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 16, padding: 16,
    flexDirection: 'row', flexWrap: 'wrap', gap: 16,
    borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 12, height: 12, borderRadius: 4 },
  legendText: { fontSize: 13, color: COLORS.slate[600], fontWeight: '600' },

  // Event List
  eventListCard: {
    marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 20, padding: 4,
    borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12,
  },
  eventRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 },
  eventRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  eventTypeBar: { width: 3, height: 32, borderRadius: 2 },
  eventIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  eventRowTitle: { fontSize: 14, fontWeight: '800', color: COLORS.slate[900] },
  eventRowSub: { fontSize: 12, color: COLORS.slate[400], fontWeight: '600', marginTop: 2 },
  emptyText: { textAlign: 'center', color: COLORS.slate[400], padding: 30, fontSize: 13, fontWeight: '600' },
});

export default CalendarScreen;
