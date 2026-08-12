import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import Header from '../components/Header';
import { User, Phone, Mail, CheckCircle2 } from 'lucide-react-native';
import { MotiView } from 'moti';

const EditProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();
  
  const [firstName, setFirstName] = useState(user?.firstName || user?.first_name || '');
  const [lastName, setLastName] = useState(user?.lastName || user?.last_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required.');
      return;
    }
    
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.updateProfile({
        first_name: firstName,
        last_name: lastName,
        phone: phone
      });
      
      if (res.data?.success) {
        await updateUser({
          first_name: firstName,
          firstName: firstName,
          last_name: lastName,
          lastName: lastName,
          phone: phone
        });
        setSuccess(true);
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        setError(res.data?.message || 'Failed to update profile.');
      }
    } catch (e) {
      setError(e.response?.data?.message || 'An error occurred during update.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Header showBack={true} title="Edit Profile" subtitle="Update personal details" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {success ? (
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={styles.successContainer}
          >
            <CheckCircle2 size={64} color="#10b981" />
            <Text style={styles.successTitle}>Profile Updated!</Text>
            <Text style={styles.successSubtitle}>Your changes have been saved successfully.</Text>
          </MotiView>
        ) : (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
            style={styles.formCard}
          >
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* First Name */}
            <Text style={styles.label}>First Name</Text>
            <View style={styles.inputWrapper}>
              <User size={18} color={COLORS.slate[400]} style={styles.inputIcon} />
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter first name"
                placeholderTextColor={COLORS.slate[400]}
                style={styles.input}
              />
            </View>

            {/* Last Name */}
            <Text style={styles.label}>Last Name</Text>
            <View style={styles.inputWrapper}>
              <User size={18} color={COLORS.slate[400]} style={styles.inputIcon} />
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter last name"
                placeholderTextColor={COLORS.slate[400]}
                style={styles.input}
              />
            </View>

            {/* Phone */}
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Phone size={18} color={COLORS.slate[400]} style={styles.inputIcon} />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter phone number"
                placeholderTextColor={COLORS.slate[400]}
                keyboardType="phone-pad"
                style={styles.input}
              />
            </View>

            {/* Email (Read Only) */}
            <Text style={styles.label}>Email Address (Read Only)</Text>
            <View style={[styles.inputWrapper, styles.disabledInputWrapper]}>
              <Mail size={18} color={COLORS.slate[300]} style={styles.inputIcon} />
              <TextInput
                value={user?.email || ''}
                editable={false}
                style={[styles.input, styles.disabledInput]}
              />
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
                <Text style={styles.saveButtonText}>Save Changes</Text>
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
  disabledInputWrapper: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.slate[800],
    fontWeight: '600',
  },
  disabledInput: {
    color: COLORS.slate[400],
  },
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

export default EditProfileScreen;
