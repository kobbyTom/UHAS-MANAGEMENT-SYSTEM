import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme';
import { authAPI } from '../api';
import Header from '../components/Header';
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react-native';
import { MotiView } from 'moti';

const ChangePasswordScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.updatePassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      
      if (res.data?.success) {
        setSuccess(true);
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        setError(res.data?.message || 'Failed to update password.');
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Incorrect current password or other error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Header showBack={true} title="Change Password" subtitle="Update security settings" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {success ? (
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={styles.successContainer}
          >
            <CheckCircle2 size={64} color="#10b981" />
            <Text style={styles.successTitle}>Password Changed!</Text>
            <Text style={styles.successSubtitle}>Your security password has been updated.</Text>
          </MotiView>
        ) : (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
            style={styles.formCard}
          >
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Current Password */}
            <Text style={styles.label}>Current Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color={COLORS.slate[400]} style={styles.inputIcon} />
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor={COLORS.slate[400]}
                secureTextEntry={!showCurrent}
                style={styles.input}
              />
              <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={styles.eyeIcon}>
                {showCurrent ? (
                  <EyeOff size={18} color={COLORS.slate[400]} />
                ) : (
                  <Eye size={18} color={COLORS.slate[400]} />
                )}
              </TouchableOpacity>
            </View>

            {/* New Password */}
            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color={COLORS.slate[400]} style={styles.inputIcon} />
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password (min. 6 chars)"
                placeholderTextColor={COLORS.slate[400]}
                secureTextEntry={!showNew}
                style={styles.input}
              />
              <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeIcon}>
                {showNew ? (
                  <EyeOff size={18} color={COLORS.slate[400]} />
                ) : (
                  <Eye size={18} color={COLORS.slate[400]} />
                )}
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <Text style={styles.label}>Confirm New Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color={COLORS.slate[400]} style={styles.inputIcon} />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor={COLORS.slate[400]}
                secureTextEntry={!showConfirm}
                style={styles.input}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeIcon}>
                {showConfirm ? (
                  <EyeOff size={18} color={COLORS.slate[400]} />
                ) : (
                  <Eye size={18} color={COLORS.slate[400]} />
                )}
              </TouchableOpacity>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Update Password</Text>
              )}
            </TouchableOpacity>
          </MotiView>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fe' },
  scrollContent: { padding: 20, flexGrow: 1, justifyContent: 'center' },
  
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.slate[600],
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 20,
  },
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.slate[800],
    fontWeight: '600',
  },
  eyeIcon: { padding: 4 },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },

  // Success state
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 40,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.slate[900],
    marginTop: 20,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: COLORS.slate[500],
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ChangePasswordScreen;
