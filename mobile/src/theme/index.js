import { COLORS } from './colors';
import { StyleSheet } from 'react-native';

export { COLORS };

export const theme = {
  colors: COLORS,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 999,
  },
};

export const commonStyles = StyleSheet.create({
  glassCard: {
    backgroundColor: COLORS.glass,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 5,
  },
  premiumCard: {
    backgroundColor: COLORS.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: COLORS.slate[100],
    shadowColor: COLORS.slate[900],
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.03,
    shadowRadius: 24,
    elevation: 3,
  },
  premiumBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
  },
  premiumBtnPrimary: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
  premiumBtnSecondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    shadowColor: COLORS.slate[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  btnTextSecondary: {
    color: COLORS.slate[700],
  },
  input: {
    width: '100%',
    padding: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    borderRadius: 16,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.slate[900],
    backgroundColor: COLORS.slate[50],
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.slate[500],
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
