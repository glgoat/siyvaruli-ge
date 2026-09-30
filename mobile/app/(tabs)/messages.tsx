import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { MessageCircle } from '@expo/vector-icons/build/Feather';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { useTheme } from '@/lib/theme-context';
import { fetchConversations } from '@/services/matches';
import { MatchCard } from '@/components/MatchCard';
import { EmptyState, LoadingScreen } from '@/components/Feedback';
import { Button } from '@/components/Button';
import type { Conversation } from '@/types';

export default function MessagesScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const data = await fetchConversations(user.id);
    setConversations(data);
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>{t('messages.title')}</Text>
      </View>
      {loading ? (
        <LoadingScreen />
      ) : conversations.length === 0 ? (
        <EmptyState
          icon={<MessageCircle size={32} color={colors.primary} />}
          title={t('messages.empty')}
          description={t('messages.emptyDesc')}
          action={<Button title={t('matches.goDiscover')} onPress={() => router.push('/(tabs)/discover')} />}
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <MatchCard conversation={item} onPress={() => router.push(`/chat/${item.id}`)} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
});
