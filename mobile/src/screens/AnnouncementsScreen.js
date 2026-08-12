import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  RefreshControl, TouchableOpacity, TextInput
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme';
import { parentAPI, eventAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import { MotiView } from 'moti';
import { Bell, Megaphone, Calendar, User, Search, AlertCircle, Info, Flame, ChevronRight } from 'lucide-react-native';

const PRIORITY_COLORS = {
  high: { bg: '#fee2e2', text: '#ef4444', icon: Flame },
  urgent: { bg: '#fee2e2', text: '#ef4444', icon: AlertCircle },
  normal: { bg: '#e0f2fe', text: '#0284c7', icon: Info },
  general: { bg: '#f1f5f9', text: '#64748b', icon: Info }
};

const AnnouncementsScreen = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const role = user?.role || 'student';

  const fetchData = async () => {
    try {
      setLoading(true);
      let results = [];
      if (role === 'parent') {
        const res = await parentAPI.getMyChildrenAnnouncements().catch(() => null);
        results = res?.data?.data || res?.data || [];
      } else {
        const res = await eventAPI.getUpcoming().catch(() => null);
        results = res?.data?.data || res?.data || [];
      }
      setData(Array.isArray(results) ? results : []);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const filteredAnnouncements = data.filter(item => {
    const title = (item.title || '').toLowerCase();
    const content = (item.content || item.description || '').toLowerCase();
    const matchesSearch = title.includes(searchTerm.toLowerCase()) || content.includes(searchTerm.toLowerCase());
    
    if (filterType === 'all') return matchesSearch;
    if (filterType === 'urgent') return matchesSearch && (item.priority === 'urgent' || item.priority === 'high');
    if (filterType === 'school') return matchesSearch && (item.audience === 'all' || item.target === 'school');
    return matchesSearch;
  });

  return (
    <View style={styles.container}>
      <Header showBack={true} title="Announcements" subtitle="School news & updates" />
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Search size={18} color={COLORS.slate[400]} style={styles.searchIcon} />
          <TextInput
            placeholder="Search announcements..."
            placeholderTextColor={COLORS.slate[400]}
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          {['all', 'urgent', 'school'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.tab, filterType === type && styles.activeTab]}
              onPress={() => setFilterType(type)}
            >
              <Text style={[styles.tabText, filterType === type && styles.activeTabText]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        >
          {filteredAnnouncements.length === 0 ? (
            <View style={styles.emptyState}>
              <MotiView
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', delay: 100 }}
              >
                <View style={styles.emptyIcon}>
                  <Bell size={48} color={COLORS.slate[300]} />
                </View>
              </MotiView>
              <Text style={styles.emptyTitle}>No Announcements</Text>
              <Text style={styles.emptyText}>
                There are no announcements currently matching your filters or search criteria.
              </Text>
            </View>
          ) : (
            filteredAnnouncements.map((item, idx) => {
              const priority = item.priority || 'normal';
              const config = PRIORITY_COLORS[priority] || PRIORITY_COLORS.general;
              const Icon = config.icon;
              
              const title = item.title || 'Announcement';
              const content = item.content || item.description || '';
              const dateStr = item.publishedAt || item.published_at || item.createdAt || item.created_at || '';
              const date = dateStr ? new Date(dateStr).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              }) : 'Recent';
              const author = item.author || 'Administration';

              return (
                <MotiView
                  key={item.id || idx}
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 350, delay: idx * 60 }}
                >
                  <View style={[styles.card, priority === 'urgent' && styles.urgentCard]}>
                    <View style={styles.cardHeader}>
                      <View style={[styles.priorityBadge, { backgroundColor: config.bg }]}>
                        <Icon size={14} color={config.text} style={{ marginRight: 4 }} />
                        <Text style={[styles.priorityText, { color: config.text }]}>
                          {priority.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.dateText}>{date}</Text>
                    </View>

                    <Text style={styles.cardTitle}>{title}</Text>
                    <Text style={styles.cardContent}>{content}</Text>

                    <View style={styles.cardFooter}>
                      <View style={styles.authorWrapper}>
                        <View style={styles.avatarMini}>
                          <User size={12} color={COLORS.slate[600]} />
                        </View>
                        <Text style={styles.authorText}>{author}</Text>
                      </View>
                      <ChevronRight size={16} color={COLORS.slate[400]} />
                    </View>
                  </View>
                </MotiView>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fe' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 },
  
  // Search
  searchContainer: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10 },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 15,
    height: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.slate[800],
    fontWeight: '500',
  },

  // Tabs
  tabsWrapper: { paddingBottom: 10 },
  tabsContainer: { paddingHorizontal: 20, gap: 10, flexDirection: 'row' },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeTab: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: { fontSize: 13, fontWeight: '700', color: COLORS.slate[600] },
  activeTabText: { color: '#fff' },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
  },
  urgentCard: {
    borderColor: '#fca5a5',
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.slate[400],
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.slate[900],
    marginBottom: 8,
  },
  cardContent: {
    fontSize: 14,
    color: COLORS.slate[600],
    lineHeight: 20,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 14,
  },
  authorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarMini: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  authorText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.slate[500],
  },

  // Empty state
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: COLORS.slate[800] },
  emptyText: {
    fontSize: 14,
    color: COLORS.slate[500],
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
});

export default AnnouncementsScreen;
