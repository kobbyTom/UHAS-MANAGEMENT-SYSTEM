import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  RefreshControl, TouchableOpacity
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme';
import { parentAPI, gradeAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import { MotiView } from 'moti';
import { GraduationCap, TrendingUp, Award, BookOpen, BarChart3 } from 'lucide-react-native';

const SUBJECT_COLORS = ['#6366f1', '#ec4899', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const getScoreColor = (score) => {
  const s = parseFloat(score);
  if (isNaN(s)) return COLORS.slate[500];
  if (s >= 80) return '#10b981';
  if (s >= 70) return '#0ea5e9';
  if (s >= 60) return '#f59e0b';
  if (s >= 50) return '#f97316';
  return '#ef4444';
};

const getScoreGrade = (score) => {
  const s = parseFloat(score);
  if (isNaN(s)) return '-';
  if (s >= 80) return 'A';
  if (s >= 70) return 'B';
  if (s >= 60) return 'C';
  if (s >= 50) return 'D';
  return 'F';
};

const getScoreLabel = (score) => {
  const s = parseFloat(score);
  if (isNaN(s)) return 'N/A';
  if (s >= 80) return 'Excellent';
  if (s >= 70) return 'Very Good';
  if (s >= 60) return 'Good';
  if (s >= 50) return 'Satisfactory';
  return 'Needs Improvement';
};

const GradesScreen = () => {
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
        const res = await parentAPI.getMyChildrenGrades().catch(() => null);
        results = res?.data?.data || res?.data || [];
      } else {
        const res = await gradeAPI.getAll().catch(() => null);
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
  const scores = data.map(d => parseFloat(d.score || d.marks || d.grade_score || 0)).filter(s => !isNaN(s));
  const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '--';
  const highestScore = scores.length > 0 ? Math.max(...scores) : '--';
  const totalSubjects = data.length;

  return (
    <View style={styles.container}>
      <Header showBack={true} title="Grades & Results" subtitle="Academic performance" />

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
                  <GraduationCap size={48} color={COLORS.slate[300]} />
                </View>
              </MotiView>
              <Text style={styles.emptyTitle}>No Grades Yet</Text>
              <Text style={styles.emptyText}>
                Your academic results will appear here once grades are published.
              </Text>
            </View>
          ) : (
            <>
              {/* Summary Stats */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500 }}
                style={styles.statsRow}
              >
                <View style={[styles.statCard, { borderTopColor: '#10b981' }]}>
                  <View style={[styles.statIcon, { backgroundColor: '#ecfdf5' }]}>
                    <TrendingUp size={16} color="#10b981" />
                  </View>
                  <Text style={styles.statValue}>{avgScore}</Text>
                  <Text style={styles.statLabel}>Average</Text>
                </View>
                <View style={[styles.statCard, { borderTopColor: '#6366f1' }]}>
                  <View style={[styles.statIcon, { backgroundColor: '#eef2ff' }]}>
                    <Award size={16} color="#6366f1" />
                  </View>
                  <Text style={styles.statValue}>{highestScore}</Text>
                  <Text style={styles.statLabel}>Highest</Text>
                </View>
                <View style={[styles.statCard, { borderTopColor: '#0ea5e9' }]}>
                  <View style={[styles.statIcon, { backgroundColor: '#f0f9ff' }]}>
                    <BookOpen size={16} color="#0ea5e9" />
                  </View>
                  <Text style={styles.statValue}>{totalSubjects}</Text>
                  <Text style={styles.statLabel}>Subjects</Text>
                </View>
              </MotiView>

              {/* Grade Cards */}
              <Text style={styles.sectionTitle}>All Subjects</Text>
              {data.map((item, idx) => {
                const subject = item.subject || item.subject_name || item.course || 'Subject';
                const score = item.score || item.marks || item.grade_score || '--';
                const scoreNum = parseFloat(score);
                const color = SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
                const scoreColor = getScoreColor(score);
                const grade = getScoreGrade(score);
                const label = getScoreLabel(score);
                const term = item.term || item.semester || item.period || '';
                const teacher = item.teacher || item.teacher_name || '';

                return (
                  <MotiView
                    key={item.id || idx}
                    from={{ opacity: 0, translateX: -20 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{ type: 'timing', duration: 350, delay: idx * 60 }}
                  >
                    <View style={[styles.gradeCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
                      <View style={styles.gradeCardTop}>
                        <View style={[styles.subjectIcon, { backgroundColor: `${color}12` }]}>
                          <BookOpen size={18} color={color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.subjectName}>{subject}</Text>
                          {term ? <Text style={styles.termText}>{term}</Text> : null}
                          {teacher ? <Text style={styles.teacherText}>{teacher}</Text> : null}
                        </View>
                        <View style={styles.scoreSection}>
                          <View style={[styles.gradeBadge, { backgroundColor: `${scoreColor}15` }]}>
                            <Text style={[styles.gradeText, { color: scoreColor }]}>{grade}</Text>
                          </View>
                          <Text style={[styles.scoreValue, { color: scoreColor }]}>{score}%</Text>
                          <Text style={[styles.scoreLabel, { color: scoreColor }]}>{label}</Text>
                        </View>
                      </View>

                      {/* Score Bar */}
                      <View style={styles.barContainer}>
                        <View style={styles.barBg}>
                          <MotiView
                            from={{ width: '0%' }}
                            animate={{ width: `${Math.min(isNaN(scoreNum) ? 0 : scoreNum, 100)}%` }}
                            transition={{ type: 'timing', duration: 800, delay: idx * 60 + 300 }}
                            style={[styles.barFill, { backgroundColor: scoreColor }]}
                          />
                        </View>
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

  // Stats Row
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: '#f1f5f9', borderTopWidth: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12,
  },
  statIcon: {
    width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  statValue: { fontSize: 20, fontWeight: '900', color: COLORS.slate[900] },
  statLabel: { fontSize: 10, fontWeight: '800', color: COLORS.slate[400], textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },

  // Section
  sectionTitle: { fontSize: 16, fontWeight: '900', color: COLORS.slate[900], marginBottom: 14, letterSpacing: -0.3 },

  // Grade Card
  gradeCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 14,
    borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12,
  },
  gradeCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  subjectIcon: {
    width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
  },
  subjectName: { fontSize: 15, fontWeight: '800', color: COLORS.slate[900] },
  termText: { fontSize: 12, color: COLORS.slate[400], fontWeight: '600', marginTop: 2 },
  teacherText: { fontSize: 11, color: COLORS.slate[400], fontWeight: '500', marginTop: 1 },

  // Score
  scoreSection: { alignItems: 'center' },
  gradeBadge: {
    width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  gradeText: { fontSize: 16, fontWeight: '900' },
  scoreValue: { fontSize: 13, fontWeight: '800' },
  scoreLabel: { fontSize: 9, fontWeight: '700', marginTop: 1 },

  // Bar
  barContainer: { marginTop: 14 },
  barBg: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },

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

export default GradesScreen;
