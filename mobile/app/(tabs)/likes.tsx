import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { Heart } from '@expo/vector-icons/build/Feather';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { useTheme } from '@/lib/theme-context';
import { fetchLikes } from '@/services/matches';
import { LikeCard } from '@/components/MatchCard';
import { EmptyState, LoadingScreen } from '@/components/Feedback';
import type { Profile, Photo } from '@/types';

export default function LikesScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const [likes, setLikes] = useState<{ liker: Profile; photos: Photo[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const data = await fetchLikes(user.id);
    setLikes(data);
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>{t('likes.title')}</Text>
      </View>
      {loading ? (
        <LoadingScreen />
      ) : likes.length === 0 ? (
        <EmptyState icon={<Heart size={32} color={colors.primary} />} title={t('likes.empty')} description={t('likes.emptyDesc')} />
      ) : (
        <FlatList
          data={likes}
          keyExtractor={(_, i) => i.toString()}
          numColumns={2}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          columnWrapperStyle={{ gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <LikeCard liker={item.liker} photos={item.photos} onPress={() => {}} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
});
