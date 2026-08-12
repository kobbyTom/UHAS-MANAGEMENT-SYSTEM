import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TouchableWithoutFeedback
} from 'react-native';
import { MotiView } from 'moti';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { COLORS } from '../theme';
import PremiumSelect from './PremiumSelect';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

/**
 * PremiumCalendar — native mobile equivalent of the web PremiumCalendar.
 *
 * Props:
 *   value       string | null   — ISO date string 'YYYY-MM-DD'
 *   onChange    (isoString) => void
 *   isOpen      boolean
 *   onClose     () => void
 */
const PremiumCalendar = ({ value, onChange, isOpen, onClose }) => {
  const today = new Date();
  const initDate = value ? new Date(value) : today;
  const [current, setCurrent] = useState(initDate);

  const year  = current.getFullYear();
  const month = current.getMonth();

  const currentYear = today.getFullYear();
  const years = Array.from({ length: currentYear - 1940 + 11 }, (_, i) => ({ value: 1940 + i, label: String(1940 + i) }));
  const months = MONTH_NAMES.map((n, i) => ({ value: i, label: n }));

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = new Date(year, month, 1).getDay(); // 0=Sun

  const isToday    = (d) => today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
  const isSelected = (d) => {
    if (!value) return false;
    const v = new Date(value);
    return v.getDate() === d && v.getMonth() === month && v.getFullYear() === year;
  };

  const handleDayPress = (d) => {
    const selected = new Date(year, month, d);
    const iso = selected.toISOString().split('T')[0];
    onChange(iso);
    if (onClose) onClose();
  };

  const jumpToday = () => {
    const d = today.getDate();
    const iso = new Date(today.getFullYear(), today.getMonth(), d).toISOString().split('T')[0];
    onChange(iso);
    setCurrent(new Date(today.getFullYear(), today.getMonth(), 1));
    if (onClose) onClose();
  };

  // Build grid cells
  const cells = [];
  for (let i = 0; i < startOffset; i++) {
    cells.push(<View key={`pad-${i}`} style={styles.dayCell} />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const sel = isSelected(d);
    const tod = isToday(d);
    cells.push(
      <TouchableOpacity
        key={d}
        style={[
          styles.dayCell,
          sel && styles.dayCellSelected,
          !sel && tod && styles.dayCellToday,
        ]}
        onPress={() => handleDayPress(d)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.dayText,
          sel && styles.dayTextSelected,
          !sel && tod && styles.dayTextToday,
        ]}>
          {d}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <Modal visible={isOpen} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <MotiView
              from={{ opacity: 0, translateY: 30, scale: 0.94 }}
              animate={{ opacity: 1, translateY: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 220 }}
              style={styles.card}
            >
              {/* Close */}
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <X size={16} color={COLORS.slate[400]} />
              </TouchableOpacity>

              {/* Month/Year header */}
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.navBtn}
                  onPress={() => setCurrent(new Date(year, month - 1, 1))}
                >
                  <ChevronLeft size={18} color={COLORS.slate[600]} />
                </TouchableOpacity>

                <View style={styles.headerSelects}>
                  <View style={{ flex: 1.4 }}>
                    <PremiumSelect
                      value={month}
                      onChange={(v) => setCurrent(new Date(year, v, 1))}
                      options={months}
                      placeholder="Month"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <PremiumSelect
                      value={year}
                      onChange={(v) => setCurrent(new Date(v, month, 1))}
                      options={years}
                      placeholder="Year"
                      searchable
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.navBtn}
                  onPress={() => setCurrent(new Date(year, month + 1, 1))}
                >
                  <ChevronRight size={18} color={COLORS.slate[600]} />
                </TouchableOpacity>
              </View>

              {/* Day labels */}
              <View style={styles.dayLabels}>
                {DAY_LABELS.map(d => (
                  <Text key={d} style={styles.dayLabelText}>{d}</Text>
                ))}
              </View>

              {/* Calendar grid */}
              <View style={styles.grid}>
                {cells}
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <TouchableOpacity onPress={jumpToday}>
                  <Text style={styles.todayBtn}>Jump to Today</Text>
                </TouchableOpacity>
              </View>
            </MotiView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const CELL_SIZE = 42;

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(15,23,42,0.4)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  card: {
    width: '100%', maxWidth: 360, backgroundColor: '#fff',
    borderRadius: 24, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.18, shadowRadius: 40,
    borderWidth: 1, borderColor: '#f1f5f9',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute', top: 14, right: 14,
    width: 28, height: 28, borderRadius: 9,
    backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center',
  },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 16, gap: 8,
  },
  navBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center',
  },
  headerSelects: { flex: 1, flexDirection: 'row', gap: 6 },

  // Day labels
  dayLabels: {
    flexDirection: 'row', marginBottom: 6,
  },
  dayLabelText: {
    width: `${100/7}%`, textAlign: 'center',
    fontSize: 10, fontWeight: '900', color: COLORS.slate[400],
    textTransform: 'uppercase', letterSpacing: 0.8,
  },

  // Grid
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100/7}%`, height: CELL_SIZE,
    alignItems: 'center', justifyContent: 'center', borderRadius: 12,
  },
  dayCellSelected: {
    backgroundColor: '#facc15',
    shadowColor: 'rgba(250,204,21,0.4)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1, shadowRadius: 12,
  },
  dayCellToday: {
    borderWidth: 2, borderColor: COLORS.primary,
  },
  dayText: {
    fontSize: 14, fontWeight: '700', color: '#1e293b',
  },
  dayTextSelected: { color: '#0f172a', fontWeight: '900' },
  dayTextToday: { color: COLORS.primary, fontWeight: '900' },

  // Footer
  footer: {
    marginTop: 14, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: '#f1f5f9',
    alignItems: 'center',
  },
  todayBtn: {
    fontSize: 13, fontWeight: '800', color: COLORS.primary,
  },
});

export default PremiumCalendar;
