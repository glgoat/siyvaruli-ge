export const colors = {
  primary: {
    50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af',
    400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c',
    800: '#9f1239', 900: '#881337', 950: '#4c0519',
  },
  accent: {
    50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74',
    400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c',
  },
  success: { 50: '#f0fdf4', 100: '#dcfce7', 500: '#22c55e', 600: '#16a34a', 700: '#15803d' },
  warning: { 50: '#fffbeb', 100: '#fef3c7', 500: '#f59e0b', 600: '#d97706' },
  error: { 50: '#fef2f2', 100: '#fee2e2', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c' },
  gray: {
    50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db',
    400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151',
    800: '#1f2937', 900: '#111827', 950: '#030712',
  },
  white: '#ffffff',
  black: '#000000',
};

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  bg: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  success: string;
  warning: string;
  error: string;
  inputBg: string;
  inputBorder: string;
  overlay: string;
}

export const lightColors: ThemeColors = {
  bg: colors.gray[50],
  card: colors.white,
  text: colors.gray[900],
  textSecondary: colors.gray[600],
  textMuted: colors.gray[400],
  border: colors.gray[200],
  primary: colors.primary[500],
  primaryLight: colors.primary[50],
  primaryDark: colors.primary[700],
  success: colors.success[500],
  warning: colors.warning[500],
  error: colors.error[500],
  inputBg: colors.white,
  inputBorder: colors.gray[200],
  overlay: 'rgba(0,0,0,0.5)',
};

export const darkColors: ThemeColors = {
  bg: colors.gray[950],
  card: colors.gray[900],
  text: colors.gray[100],
  textSecondary: colors.gray[400],
  textMuted: colors.gray[500],
  border: colors.gray[800],
  primary: colors.primary[500],
  primaryLight: colors.primary[950],
  primaryDark: colors.primary[400],
  success: colors.success[500],
  warning: colors.warning[500],
  error: colors.error[500],
  inputBg: colors.gray[800],
  inputBorder: colors.gray[700],
  overlay: 'rgba(0,0,0,0.7)',
};
