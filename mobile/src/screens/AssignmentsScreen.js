import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  RefreshControl, TouchableOpacity
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme';
import { parentAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import { MotiView } from 'moti';
import { FileText, Clock, CheckCircle, AlertTriangle, Filter, Calendar } from 'lucide-react-native';

const TABS = ['All', 'Pending', 'Submitted', 'Graded'];
const TAB_COLORS = {
  All: COLORS.primary,
  Pending: '#f59e0b',
  Submitted: '#0ea5e9',
  Graded: '#10b981',
};

const STATUS_CONFIG = {
  pending: { color: '#f59e0b', bg: '#fffbeb', label: 'Pending', icon: Clock },
  submitted: { color: '#0ea5e9', bg: '#f0f9ff', label: 'Submitted', icon: CheckCircle },
  graded: { color: '#10b981', bg: '#ecfdf5', label: 'Graded', icon: CheckCircle },
  overdue: { color: '#ef4444', bg: '#fef2f2', label: 'Overdue', icon: AlertTriangle },
  default: { color: COLORS.slate[500], bg: '#f8fafc', label: 'Unknown', icon: FileText },
};

const getRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const due = new Date(dateStr);
  const diffMs = due - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} overdue`;
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  if (diffDays <= 7) return `Due in ${diffDays} days`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'No due date';
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const SUBJECT_COLORS = ['#6366f1', '#ec4899', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const AssignmentsScreen = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('All');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await parentAPI.getMyChildrenAssignments().catch(() => null);
      const results = res?.data?.data || res?.data || [];
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

  // Determine status for each assignment
  const enrichedData = data.map(item => {
    let status = (item.status || '').toLowerCase();
    if (!status) {
      const due = new Date(item.dueDate || item.due_date);
      if (due < new Date()) status = 'overdue';
      else status = 'pending';
    }
    return { ...item, computedStatus: status };
  });

  // Filter by active tab
  const filteredData = activeTab === 'All'
    ? enrichedData
    : enrichedData.filter(d => d.computedStatus === activeTab.toLowerCase());

  // Stats
  const pendingCount = enrichedData.filter(d => d.computedStatus === 'pending').length;
  const submittedCount = enrichedData.filter(d => d.computedStatus === 'submitted').length;
  const gradedCount = enrichedData.filter(d => d.computedStatus === 'graded').length;
  const overdueCount = enrichedData.filter(d => d.computedStatus === 'overdue').length;

  return (
    <View style={styles.container}>
      <Header showBack={true} title="Assignments" subtitle="Homework & projects" />

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <>
          {/* Filter Tabs */}
          <View style={styles.tabsRow}>
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab,
                  activeTab === tab && [styles.tabActive, { backgroundColor: TAB_COLORS[tab] }]
                ]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab}
                </Text>
                {tab !== 'All' && (
                  <View style={[
                    styles.tabBadge,
                    activeTab === tab ? { backgroundColor: 'rgba(255,255,255,0.3)' } : { backgroundColor: `${TAB_COLORS[tab]}15` }
                  ]}>
                    <Text style={[
                      styles.tabBadgeText,
                      activeTab === tab ? { color: '#fff' } : { color: TAB_COLORS[tab] }
                    ]}>
                      {tab === 'Pending' ? pendingCount : tab === 'Submitted' ? submittedCount : gradedCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          >
            {filteredData.length === 0 ? (
              <View style={styles.emptyState}>
                <MotiView
                  from={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', delay: 100 }}
                >
                  <View style={styles.emptyIcon}>
                    <FileText size={48} color={COLORS.slate[300]} />
                  </View>
                </MotiView>
                <Text style={styles.emptyTitle}>No Assignments</Text>
                <Text style={styles.emptyText}>
                  {activeTab === 'All'
                    ? 'No assignments have been posted yet.'
                    : `No ${activeTab.toLowerCase()} assignments found.`}
                </Text>
              </View>
            ) : (
              filteredData.map((item, idx) => {
                const title = item.title || item.name || 'Untitled Assignment';
                const subject = item.subject || item.subject_name || item.course || '';
                const dueDate = item.dueDate || item.due_date || '';
                const status = item.computedStatus;
                const config = STATUS_CONFIG[status] || STATUS_CONFIG.default;
                const StatusIcon = config.icon;
                const color = SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
                const relativeTime = getRelativeTime(dueDate);
                const description = item.description || '';

                return (
                  <MotiView
                    key={item.id || idx}
                    from={{ opacity: 0, translateX: -20 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{ type: 'timing', duration: 350, delay: idx * 60 }}
                  >
                    <View style={[styles.card, { borderLeftColor: color, borderLeftWidth: 4 }]}>
                      <View style={styles.cardTop}>
                        <View style={[styles.subjectIcon, { backgroundColor: `${color}12` }]}>
                          <FileText size={18} color={color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
                          {subject ? <Text style={styles.subjectText}>{subject}</Text> : null}
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                          <StatusIcon size={12} color={config.color} />
                          <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                        </View>
                      </View>

                      {description ? (
                        <Text style={styles.description} numberOfLines={2}>{description}</Text>
                      ) : null}

                      <View style={styles.cardFooter}>
                        <View style={styles.dueDateRow}>
                          <Calendar size={12} color={status === 'overdue' ? '#ef4444' : COLORS.slate[400]} />
                          <Text style={[
                            styles.dueText,
                            status === 'overdue' && { color: '#ef4444', fontWeight: '800' }
                          ]}>
                            {formatDate(dueDate)}
                          </Text>
                        </View>
                        {relativeTime ? (
                          <View style={[styles.relTimeBadge, {
                            backgroundColor: status === 'overdue' ? '#fef2f2' : '#f0f9ff'
                          }]}>
                            <Text style={[styles.relTimeText, {
                              color: status === 'overdue' ? '#ef4444' : '#0ea5e9'
                            }]}>
                              {relativeTime}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </MotiView>
                );
              })
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fe' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 16 },

  // Tabs
  tabsRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 9, borderRadius: 12, backgroundColor: '#f8fafc',
    borderWidth: 1, borderColor: COLORS.slate[100], gap: 4,
  },
  tabActive: { borderColor: 'transparent' },
  tabText: { fontSize: 12, fontWeight: '800', color: COLORS.slate[400] },
  tabTextActive: { color: '#fff' },
  tabBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 },
  tabBadgeText: { fontSize: 10, fontWeight: '900' },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 14,
    borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  subjectIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.slate[900], lineHeight: 20 },
  subjectText: { fontSize: 12, color: COLORS.slate[400], fontWeight: '600', marginTop: 3 },
  description: { fontSize: 13, color: COLORS.slate[500], fontWeight: '500', marginTop: 12, lineHeight: 20 },

  // Status
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },

  // Footer
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#f1f5f9',
  },
  dueDateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dueText: { fontSize: 12, color: COLORS.slate[500], fontWeight: '600' },
  relTimeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  relTimeText: { fontSize: 11, fontWeight: '800' },

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

export default AssignmentsScreen;
