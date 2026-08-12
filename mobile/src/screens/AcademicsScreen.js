import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform
} from 'react-native';
import { COLORS } from '../theme';
import {
  Grid, Layers, BookOpen, Users, Clock, ArrowLeft, Bell
} from 'lucide-react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import PremiumAlert from '../components/PremiumAlert';
import Header from '../components/Header';

const ACADEMIC_MODULES = [
  { id: 'classes', name: 'Classes', icon: Grid, color: '#06b6d4', route: 'AdminClasses' },
  { id: 'sections', name: 'Sections', icon: Layers, color: '#3b82f6', route: 'AdminSections' },
  { id: 'subjects', name: 'Subjects', icon: BookOpen, color: '#ec4899', route: 'AdminSubjects' },
  { id: 'allocation', name: 'Subject Allocation', icon: Users, color: '#8b5cf6', route: 'AdminSubjectAllocation' },
  { id: 'timetable', name: 'Timetable', icon: Clock, color: '#10b981', route: 'Schedule' },
];

const AcademicsScreen = ({ navigation }) => {
  const [comingSoon, setComingSoon] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  const handlePress = (route, title) => {
    if (route) {
      navigation.navigate(route);
    } else {
      setAlertConfig({ title: `${title} Coming Soon`, message: `The ${title} module is currently under development for mobile.` });
      setComingSoon(true);
    }
  };

  return (
    <View style={styles.container}>
      <Header showBack={true} title="Academic Hub" Icon={BookOpen} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <LinearGradient
          colors={['#00843e', '#006b32']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.bannerDecor} />
          <Text style={styles.bannerTitle}>Academics</Text>
          <Text style={styles.bannerSub}>Manage classes, subjects, and timetables.</Text>
        </LinearGradient>

        {/* Modules Grid */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Modules</Text>
          <View style={styles.grid}>
            {ACADEMIC_MODULES.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => handlePress(item.route, item.name)}
              >
                <View style={[styles.iconBox, { backgroundColor: `${item.color}15` }]}>
                  <item.icon color={item.color} size={32} />
                </View>
                <Text style={styles.cardText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
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
  container: { flex: 1, backgroundColor: '#f4f7fe' },
  scrollContent: { paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#f8fafc',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: COLORS.slate[900] },

  // Banner
  banner: {
    margin: 20, borderRadius: 24, padding: 24, overflow: 'hidden',
  },
  bannerDecor: {
    position: 'absolute', top: -40, right: -40,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  bannerTitle: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 6 },
  bannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },

  // Grid
  section: { marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: COLORS.slate[900], paddingHorizontal: 20, marginBottom: 16 },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  card: {
    width: '48%', backgroundColor: '#fff', borderRadius: 20,
    padding: 20, alignItems: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: '#f1f5f9',
  },
  iconBox: {
    width: 60, height: 60, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  cardText: { fontSize: 14, fontWeight: '800', color: COLORS.slate[800], textAlign: 'center' },
});

export default AcademicsScreen;
