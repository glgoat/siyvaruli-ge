import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@/lib/theme-context';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: object;
}

export function Button({ title, onPress, variant = 'primary', size = 'md', disabled, loading, icon, style }: ButtonProps) {
  const { colors } = useTheme();

  const variantStyles = {
    primary: { bg: colors.primary, text: '#fff' },
    secondary: { bg: colors.card, text: colors.text, border: colors.border },
    ghost: { bg: 'transparent', text: colors.textSecondary },
    danger: { bg: colors.error, text: '#fff' },
  };

  const sizeStyles = {
    sm: { px: 12, py: 6, fontSize: 13 },
    md: { px: 20, py: 12, fontSize: 15 },
    lg: { px: 28, py: 16, fontSize: 17 },
  };

  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.base,
        { backgroundColor: v.bg, paddingHorizontal: s.px, paddingVertical: s.py },
        variant === 'secondary' && { borderWidth: 1, borderColor: v.border },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: v.text, fontSize: s.fontSize }]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
  },
  text: { fontWeight: '600' },
});
