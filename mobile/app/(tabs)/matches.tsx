import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { Heart } from '@expo/vector-icons/build/Feather';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { useTheme } from '@/lib/theme-context';
import { fetchConversations } from '@/services/matches';
import { MatchCard, NewMatchCard } from '@/components/MatchCard';
import { EmptyState, LoadingScreen } from '@/components/Feedback';
import { Button } from '@/components/Button';
import type { Conversation } from '@/types';

export default function MatchesScreen() {
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

  const newMatches = conversations.filter((m) => !m.last_message);
  const withMessages = conversations.filter((m) => m.last_message);

  if (loading) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>{t('matches.title')}</Text>
      </View>

      {conversations.length === 0 ? (
        <EmptyState
          icon={<Heart size={32} color={colors.primary} />}
          title={t('matches.empty')}
          description={t('matches.emptyDesc')}
          action={<Button title={t('matches.goDiscover')} onPress={() => router.push('/(tabs)/discover')} />}
        />
      ) : (
        <FlatList
          data={withMessages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.primary} />}
          ListHeaderComponent={
            newMatches.length > 0 ? (
              <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 10, textTransform: 'uppercase' }}>{t('matches.new')}</Text>
                <FlatList
                  data={newMatches}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <NewMatchCard conversation={item} onPress={() => router.push(`/chat/${item.id}`)} />
                  )}
                />
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textMuted, marginTop: 16, marginBottom: 4, textTransform: 'uppercase' }}>{t('messages.title')}</Text>
              </View>
            ) : null
          }
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
