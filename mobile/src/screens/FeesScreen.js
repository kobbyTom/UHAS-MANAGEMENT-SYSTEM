import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme';
import { parentAPI, feeAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { Banknote, CheckCircle, AlertTriangle, Clock, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react-native';

const STATUS_CONFIG = {
  paid: { color: '#10b981', bg: '#ecfdf5', label: 'Paid', icon: CheckCircle },
  partial: { color: '#f59e0b', bg: '#fffbeb', label: 'Partial', icon: Clock },
  unpaid: { color: '#ef4444', bg: '#fef2f2', label: 'Unpaid', icon: AlertTriangle },
  overdue: { color: '#ef4444', bg: '#fef2f2', label: 'Overdue', icon: AlertTriangle },
};

const formatAmount = (amount) => {
  if (!amount && amount !== 0) return 'GHS 0.00';
  const num = parseFloat(amount);
  if (isNaN(num)) return `GHS ${amount}`;
  return `GHS ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const FeesScreen = () => {
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
        const res = await parentAPI.getMyChildrenFees().catch(() => null);
        results = res?.data?.data || res?.data || [];
      } else {
        const res = await feeAPI.getAll().catch(() => null);
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

  // Compute summary
  const totalFees = data.reduce((sum, d) => sum + (parseFloat(d.amount || d.total || 0) || 0), 0);
  const paidAmount = data.reduce((sum, d) => {
    const status = (d.status || '').toLowerCase();
    if (status === 'paid') return sum + (parseFloat(d.amount || d.total || 0) || 0);
    return sum + (parseFloat(d.paid || d.amount_paid || 0) || 0);
  }, 0);
  const outstanding = Math.max(totalFees - paidAmount, 0);

  return (
    <View style={styles.container}>
      <Header showBack={true} title="Fees & Payments" subtitle="Financial records" />

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
                  <Banknote size={48} color={COLORS.slate[300]} />
                </View>
              </MotiView>
              <Text style={styles.emptyTitle}>No Fee Records</Text>
              <Text style={styles.emptyText}>
                Fee records will appear here once billing information is available.
              </Text>
            </View>
          ) : (
            <>
              {/* Summary Card */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500 }}
              >
                <LinearGradient
                  colors={['#00843e', '#006b32', '#0f4a2e']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.summaryCard}
                >
                  <View style={styles.summaryDecor} />
                  <View style={styles.summaryTop}>
                    <View style={styles.summaryIconBox}>
                      <Wallet size={22} color="#fff" />
                    </View>
                    <Text style={styles.summaryLabel}>Total Fees</Text>
                  </View>
                  <Text style={styles.summaryAmount}>{formatAmount(totalFees)}</Text>

                  <View style={styles.summaryRow}>
                    <View style={styles.summaryStatBox}>
                      <View style={styles.summaryStatIconRow}>
                        <ArrowUpRight size={14} color="#4ade80" />
                        <Text style={styles.summaryStatLabel}>Paid</Text>
                      </View>
                      <Text style={styles.summaryStatValue}>{formatAmount(paidAmount)}</Text>
                    </View>
                    <View style={[styles.summaryDivider]} />
                    <View style={styles.summaryStatBox}>
                      <View style={styles.summaryStatIconRow}>
                        <ArrowDownRight size={14} color="#fbbf24" />
                        <Text style={styles.summaryStatLabel}>Outstanding</Text>
                      </View>
                      <Text style={styles.summaryStatValue}>{formatAmount(outstanding)}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </MotiView>

              {/* Fee Records */}
              <Text style={styles.sectionTitle}>Fee Breakdown</Text>
              {data.map((item, idx) => {
                const term = item.term || item.period || item.name || item.fee_type || `Fee ${idx + 1}`;
                const amount = item.amount || item.total || 0;
                const statusKey = (item.status || 'unpaid').toLowerCase();
                const config = STATUS_CONFIG[statusKey] || STATUS_CONFIG.unpaid;
                const StatusIcon = config.icon;
                const dueDate = item.due_date || item.dueDate || '';
                const childName = item.student_name || item.child_name || '';
                const description = item.description || '';

                return (
                  <MotiView
                    key={item.id || idx}
                    from={{ opacity: 0, translateX: -20 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{ type: 'timing', duration: 350, delay: idx * 60 }}
                  >
                    <View style={styles.feeCard}>
                      <View style={styles.feeTop}>
                        <View style={[styles.feeIcon, { backgroundColor: config.bg }]}>
                          <StatusIcon size={18} color={config.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.feeTerm}>{term}</Text>
                          {childName ? <Text style={styles.feeChild}>{childName}</Text> : null}
                          {description ? <Text style={styles.feeDesc} numberOfLines={1}>{description}</Text> : null}
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.feeAmount}>{formatAmount(amount)}</Text>
                          <View style={[styles.feeBadge, { backgroundColor: config.bg }]}>
                            <Text style={[styles.feeBadgeText, { color: config.color }]}>{config.label}</Text>
                          </View>
                        </View>
                      </View>

                      {dueDate ? (
                        <View style={styles.feeFooter}>
                          <Clock size={12} color={COLORS.slate[400]} />
                          <Text style={styles.feeDue}>
                            Due: {new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Text>
                        </View>
                      ) : null}
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

  // Summary Card
  summaryCard: {
    borderRadius: 24, padding: 24, marginBottom: 24, overflow: 'hidden', position: 'relative',
  },
  summaryDecor: {
    position: 'absolute', top: -30, right: -30,
    width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.08)',
  },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  summaryIconBox: {
    width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  summaryLabel: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  summaryAmount: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -1, marginBottom: 20 },
  summaryRow: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16, padding: 16, gap: 0,
  },
  summaryStatBox: { flex: 1, alignItems: 'center' },
  summaryStatIconRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  summaryStatLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  summaryStatValue: { fontSize: 15, fontWeight: '900', color: '#fff' },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 4 },

  // Section
  sectionTitle: { fontSize: 16, fontWeight: '900', color: COLORS.slate[900], marginBottom: 14, letterSpacing: -0.3 },

  // Fee Card
  feeCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 14,
    borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12,
  },
  feeTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  feeIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  feeTerm: { fontSize: 15, fontWeight: '800', color: COLORS.slate[900] },
  feeChild: { fontSize: 12, color: COLORS.slate[400], fontWeight: '600', marginTop: 2 },
  feeDesc: { fontSize: 12, color: COLORS.slate[400], fontWeight: '500', marginTop: 2 },
  feeAmount: { fontSize: 17, fontWeight: '900', color: COLORS.slate[900], marginBottom: 6 },
  feeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  feeBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },

  // Footer
  feeFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9',
  },
  feeDue: { fontSize: 12, color: COLORS.slate[400], fontWeight: '600' },

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

export default FeesScreen;
