import React from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback
} from 'react-native';
import { MotiView } from 'moti';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react-native';
import { COLORS } from '../theme';

const TYPE_CONFIG = {
  success: {
    icon: CheckCircle,
    iconColor: '#059669',
    iconBg:   '#ecfdf5',
    btnColor: '#059669',
    btnShadow: 'rgba(5,150,105,0.3)',
  },
  error: {
    icon: XCircle,
    iconColor: '#dc2626',
    iconBg:   '#fef2f2',
    btnColor: '#dc2626',
    btnShadow: 'rgba(220,38,38,0.3)',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: '#d97706',
    iconBg:   '#fffbeb',
    btnColor: '#d97706',
    btnShadow: 'rgba(217,119,6,0.3)',
  },
  confirm: {
    icon: AlertTriangle,
    iconColor: '#d97706',
    iconBg:   '#fffbeb',
    btnColor: '#0f172a',
    btnShadow: 'rgba(15,23,42,0.3)',
  },
  info: {
    icon: Info,
    iconColor: '#2563eb',
    iconBg:   '#eff6ff',
    btnColor: '#0f172a',
    btnShadow: 'rgba(15,23,42,0.3)',
  },
};

/**
 * PremiumAlert — native mobile equivalent of the web PremiumAlert component.
 *
 * Props:
 *   isOpen        boolean
 *   title         string
 *   message       string
 *   type          'info' | 'success' | 'warning' | 'error' | 'confirm'
 *   onConfirm     () => void
 *   onCancel      () => void   (only required for confirm/warning)
 *   confirmText   string  (default: 'Understood' or 'Confirm')
 *   cancelText    string  (default: 'Cancel')
 */
const PremiumAlert = ({
  isOpen,
  title,
  message,
  type = 'info',
  onConfirm,
  onCancel,
  confirmText,
  cancelText = 'Cancel',
}) => {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.info;
  const Icon = cfg.icon;
  const isConfirmType = type === 'confirm' || type === 'warning';
  const btnLabel = confirmText || (isConfirmType ? 'Confirm' : 'Understood');

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel || onConfirm}
    >
      <TouchableWithoutFeedback onPress={isConfirmType ? undefined : onConfirm}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <MotiView
              from={{ opacity: 0, translateY: 40, scale: 0.93 }}
              animate={{ opacity: 1, translateY: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 18, stiffness: 200 }}
              style={styles.modal}
            >
              {/* Close (X) button top-right */}
              {(onCancel || onConfirm) && (
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={onCancel || onConfirm}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={16} color={COLORS.slate[400]} />
                </TouchableOpacity>
              )}

              {/* Icon */}
              <View style={[styles.iconBox, { backgroundColor: cfg.iconBg }]}>
                <Icon size={32} color={cfg.iconColor} />
              </View>

              {/* Text */}
              <Text style={styles.title}>{title}</Text>
              {message ? <Text style={styles.message}>{message}</Text> : null}

              {/* Actions */}
              <View style={styles.actions}>
                {isConfirmType && (
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={onCancel}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.secondaryBtnText}>{cancelText}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.primaryBtn, {
                    backgroundColor: cfg.btnColor,
                    shadowColor: cfg.btnShadow,
                  }]}
                  onPress={onConfirm}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryBtnText}>{btnLabel}</Text>
                </TouchableOpacity>
              </View>
            </MotiView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.18,
    shadowRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute', top: 16, right: 16,
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center', alignItems: 'center',
  },
  iconBox: {
    width: 72, height: 72, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22, fontWeight: '900', color: '#0f172a',
    letterSpacing: -0.5, textAlign: 'center', marginBottom: 10,
  },
  message: {
    fontSize: 15, color: '#64748b', fontWeight: '600',
    lineHeight: 22, textAlign: 'center', marginBottom: 28,
  },
  actions: {
    flexDirection: 'row', gap: 10, width: '100%',
  },
  secondaryBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#f1f5f9', alignItems: 'center',
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '800', color: '#475569' },
  primaryBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '900', color: '#fff' },
});

export default PremiumAlert;
