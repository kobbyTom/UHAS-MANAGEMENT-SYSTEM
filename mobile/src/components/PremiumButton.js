import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, commonStyles } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';

export const PremiumButton = ({ 
  title, 
  onPress, 
  type = 'primary', 
  loading = false, 
  icon: Icon,
  style,
  textStyle 
}) => {
  const isPrimary = type === 'primary';
  
  const content = (
    <>
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#fff' : COLORS.slate[900]} size="small" />
      ) : (
        <>
          {Icon && <Icon size={18} color={isPrimary ? '#fff' : COLORS.slate[900]} />}
          <Text style={[
            commonStyles.btnText, 
            !isPrimary && commonStyles.btnTextSecondary,
            textStyle
          ]}>
            {title}
          </Text>
        </>
      )}
    </>
  );

  if (isPrimary) {
    return (
      <TouchableOpacity 
        onPress={onPress} 
        disabled={loading}
        activeOpacity={0.8}
        style={[styles.shadow, style]}
      >
        <LinearGradient
          colors={[COLORS.primary, '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={commonStyles.premiumBtn}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={loading}
      activeOpacity={0.8}
      style={[commonStyles.premiumBtn, commonStyles.premiumBtnSecondary, style]}
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  shadow: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    borderRadius: 14,
  }
});
