import React from 'react';
import { Tabs } from 'expo-router';
import { Compass, Heart, MessageCircle, ThumbsUp, User } from '@expo/vector-icons/build/Feather';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
import type { TranslationKey } from '@/constants/i18n';

export default function TabLayout() {
  const { colors } = useTheme();
  const { t } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border, borderTopWidth: 1, paddingBottom: 4, height: 60 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tabs.Screen name="discover" options={{ title: t('nav.discover'), tabBarIcon: ({ color }) => <Compass size={24} color={color} /> }} />
      <Tabs.Screen name="likes" options={{ title: t('nav.likes'), tabBarIcon: ({ color }) => <ThumbsUp size={24} color={color} /> }} />
      <Tabs.Screen name="matches" options={{ title: t('nav.matches'), tabBarIcon: ({ color }) => <Heart size={24} color={color} /> }} />
      <Tabs.Screen name="messages" options={{ title: t('nav.messages'), tabBarIcon: ({ color }) => <MessageCircle size={24} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: t('nav.profile'), tabBarIcon: ({ color }) => <User size={24} color={color} /> }} />
    </Tabs>
  );
}
