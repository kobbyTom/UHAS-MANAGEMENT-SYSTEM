import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TouchableWithoutFeedback, ScrollView, TextInput
} from 'react-native';
import { MotiView } from 'moti';
import { ChevronDown, Check, Search } from 'lucide-react-native';
import { COLORS } from '../theme';

/**
 * PremiumSelect — native mobile equivalent of the web PremiumSelect component.
 *
 * Props:
 *   value         any              — currently selected value
 *   onChange      (value) => void  — called with the raw value (not an event)
 *   options       { value, label }[]
 *   placeholder   string
 *   label         string           — optional label above the field
 *   disabled      boolean
 *   icon          React element    — optional leading icon
 *   searchable    boolean          — enables a search box inside the dropdown
 */
const PremiumSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select Option',
  label = '',
  disabled = false,
  icon = null,
  searchable = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedOption = options.find(o => o.value === value);

  const filtered = searchable && query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const handleSelect = (optVal) => {
    onChange(optVal);
    setIsOpen(false);
    setQuery('');
  };

  const open = () => { if (!disabled) setIsOpen(true); };
  const close = () => { setIsOpen(false); setQuery(''); };

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      {/* Trigger */}
      <TouchableOpacity
        style={[styles.trigger, disabled && styles.triggerDisabled, isOpen && styles.triggerOpen]}
        onPress={open}
        activeOpacity={0.8}
        disabled={disabled}
      >
        {icon ? <View style={styles.triggerIcon}>{icon}</View> : null}
        <Text style={[styles.triggerText, !selectedOption && styles.placeholderText]} numberOfLines={1}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <MotiView
          animate={{ rotate: isOpen ? '180deg' : '0deg' }}
          transition={{ type: 'timing', duration: 200 }}
        >
          <ChevronDown size={16} color={COLORS.slate[400]} />
        </MotiView>
      </TouchableOpacity>

      {/* Dropdown Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={close}
      >
        <TouchableWithoutFeedback onPress={close}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <MotiView
                from={{ opacity: 0, translateY: -10, scale: 0.97 }}
                animate={{ opacity: 1, translateY: 0, scale: 1 }}
                transition={{ type: 'timing', duration: 180 }}
                style={styles.dropdown}
              >
                {/* Search */}
                {searchable && (
                  <View style={styles.searchBox}>
                    <Search size={14} color={COLORS.slate[400]} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search..."
                      placeholderTextColor={COLORS.slate[400]}
                      value={query}
                      onChangeText={setQuery}
                      autoFocus
                    />
                  </View>
                )}

                <ScrollView
                  style={{ maxHeight: 300 }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {filtered.length === 0 ? (
                    <Text style={styles.emptyText}>No options available</Text>
                  ) : (
                    filtered.map((opt) => {
                      const isSelected = opt.value === value;
                      return (
                        <TouchableOpacity
                          key={String(opt.value)}
                          style={[styles.option, isSelected && styles.optionSelected]}
                          onPress={() => handleSelect(opt.value)}
                          activeOpacity={0.7}
                        >
                          {isSelected
                            ? <Check size={14} color="#fff" style={{ marginRight: 8 }} />
                            : <View style={{ width: 22 }} />
                          }
                          <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              </MotiView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  label: {
    fontSize: 11, fontWeight: '800', color: COLORS.slate[500],
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
  },

  // Trigger
  trigger: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
    borderWidth: 1.5, borderColor: COLORS.slate[200],
    gap: 10,
  },
  triggerDisabled: { opacity: 0.6 },
  triggerOpen: { borderColor: COLORS.primary, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.12, shadowRadius: 8 },
  triggerIcon: { marginRight: 2 },
  triggerText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#0f172a' },
  placeholderText: { color: COLORS.slate[400] },

  // Overlay
  overlay: {
    flex: 1, backgroundColor: 'rgba(15,23,42,0.25)',
    justifyContent: 'center', paddingHorizontal: 24,
  },

  // Dropdown card
  dropdown: {
    backgroundColor: '#fff', borderRadius: 18, padding: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.14, shadowRadius: 30,
    borderWidth: 1, borderColor: '#f1f5f9',
  },

  // Search
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, backgroundColor: '#f8fafc',
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 6,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600', color: '#0f172a' },

  // Option
  option: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10,
  },
  optionSelected: { backgroundColor: COLORS.primary },
  optionText: { fontSize: 14, fontWeight: '700', color: '#475569' },
  optionTextSelected: { color: '#fff' },
  emptyText: { textAlign: 'center', color: COLORS.slate[400], fontSize: 13, padding: 16, fontWeight: '600' },
});

export default PremiumSelect;
