import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Linking
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme';
import Header from '../components/Header';
import { Mail, Phone, MessageSquare, ChevronDown, ChevronUp, FileText, ExternalLink } from 'lucide-react-native';
import { MotiView, AnimatePresence } from 'moti';

const FAQS = [
  {
    q: 'How do I pay school fees?',
    a: 'You can pay fees directly through the web portal using mobile money, bank cards, or bank transfer. The mobile app shows outstanding invoices under the "Fees" tab.'
  },
  {
    q: 'Where do I find my class schedule?',
    a: 'Your schedule can be viewed under the "Schedule" module on the Dashboard. This shows daily break periods, course titles, teachers, and classroom locations.'
  },
  {
    q: 'How are grades calculated?',
    a: 'Grades consist of Classwork (25%), Homework (25%), Midterms (20%), and Final Exams (30%). A cumulative aggregate is shown for each subject in "Grades".'
  },
  {
    q: 'How do I edit my profile information?',
    a: 'Navigate to Profile -> Edit Profile to update your name and phone number. If you need to change your registered email, contact the administration office directly.'
  }
];

const HelpSupportScreen = () => {
  const insets = useSafeAreaInsets();
  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleExpand = (idx) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  const handleContact = (type) => {
    if (type === 'email') {
      Linking.openURL('mailto:support@uhasbasic.edu.gh?subject=App%20Support');
    } else if (type === 'phone') {
      Linking.openURL('tel:+233501234567');
    }
  };

  return (
    <View style={styles.container}>
      <Header showBack={true} title="Help & Support" subtitle="Get assistance" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Contact Cards */}
        <Text style={styles.sectionTitle}>Contact Channels</Text>
        <View style={styles.contactRow}>
          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => handleContact('email')}
            activeOpacity={0.7}
          >
            <View style={[styles.contactIcon, { backgroundColor: '#e0f2fe' }]}>
              <Mail size={22} color="#0284c7" />
            </View>
            <Text style={styles.contactTitle}>Email Support</Text>
            <Text style={styles.contactValue}>support@uhasbasic.edu.gh</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => handleContact('phone')}
            activeOpacity={0.7}
          >
            <View style={[styles.contactIcon, { backgroundColor: '#dcfce7' }]}>
              <Phone size={22} color="#10b981" />
            </View>
            <Text style={styles.contactTitle}>Phone Support</Text>
            <Text style={styles.contactValue}>+233 (50) 123 4567</Text>
          </TouchableOpacity>
        </View>

        {/* FAQs */}
        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Frequently Asked Questions</Text>
        
        {FAQS.map((faq, idx) => {
          const isExpanded = expandedIndex === idx;
          return (
            <View key={idx} style={styles.faqWrapper}>
              <TouchableOpacity
                style={[styles.faqHeader, isExpanded && styles.faqHeaderActive]}
                onPress={() => toggleExpand(idx)}
                activeOpacity={0.8}
              >
                <Text style={styles.faqQuestion}>{faq.q}</Text>
                {isExpanded ? (
                  <ChevronUp size={18} color={COLORS.slate[600]} />
                ) : (
                  <ChevronDown size={18} color={COLORS.slate[400]} />
                )}
              </TouchableOpacity>
              
              <AnimatePresence>
                {isExpanded && (
                  <MotiView
                    from={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: 'timing', duration: 250 }}
                    style={styles.faqAnswerWrapper}
                  >
                    <Text style={styles.faqAnswer}>{faq.a}</Text>
                  </MotiView>
                )}
              </AnimatePresence>
            </View>
          );
        })}

        {/* App Version Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>UHAS School Management System</Text>
          <Text style={styles.footerVersion}>Mobile Portal v1.2.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fe' },
  scrollContent: { padding: 20, gap: 16, paddingBottom: 40 },
  
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.slate[400],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  
  // Contact Channels
  contactRow: {
    flexDirection: 'row',
    gap: 12,
  },
  contactCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    alignItems: 'center',
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.slate[800],
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 11,
    color: COLORS.slate[400],
    fontWeight: '600',
    textAlign: 'center',
  },

  // FAQ Accordion
  faqWrapper: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#fff',
  },
  faqHeaderActive: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.slate[800],
    flex: 1,
    paddingRight: 10,
  },
  faqAnswerWrapper: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
  },
  faqAnswer: {
    fontSize: 13,
    color: COLORS.slate[600],
    lineHeight: 18,
    fontWeight: '500',
  },

  // Footer
  footer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.slate[400],
  },
  footerVersion: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.slate[400],
    marginTop: 2,
  },
});

export default HelpSupportScreen;
