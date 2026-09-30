import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { LoadingScreen } from '@/components/Feedback';

export default function Index() {
  const { session, profile, loading } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace('/auth');
    } else if (profile && !profile.profile_completed) {
      router.replace('/onboarding');
    } else {
      router.replace('/(tabs)/discover');
    }
  }, [session, profile, loading, router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <LoadingScreen />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
