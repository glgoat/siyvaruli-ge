import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/lib/theme-context';
import { initials } from '@/constants';
import type { Photo } from '@/types';

interface UserAvatarProps {
  name: string;
  photo?: Photo | null;
  url?: string | null;
  size?: number;
  borderRadius?: number;
}

export function UserAvatar({ name, photo, url, size = 48, borderRadius }: UserAvatarProps) {
  const { colors } = useTheme();
  const source = photo?.url || url;
  const r = borderRadius ?? size / 2;

  if (source) {
    return (
      <Image
        source={{ uri: source }}
        style={{ width: size, height: size, borderRadius: r }}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
    );
  }

  return (
    <View style={[styles.fallback, {
      width: size, height: size, borderRadius: r,
      backgroundColor: colors.primaryLight,
    }]}>
      <Text style={[styles.fallbackText, { color: colors.primary, fontSize: size * 0.4 }]}>
        {initials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  fallbackText: { fontWeight: '700' },
});
