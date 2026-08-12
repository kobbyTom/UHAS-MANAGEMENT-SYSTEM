import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { COLORS, commonStyles } from '../theme';

export const PremiumInput = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  secureTextEntry,
  keyboardType = 'default',
  error,
  style
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={commonStyles.label}>{label}</Text>}
      <TextInput
        style={[
          commonStyles.input,
          isFocused && styles.inputFocused,
          error && styles.inputError
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.slate[400]}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoCapitalize="none"
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    width: '100%',
  },
  inputFocused: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  }
});
