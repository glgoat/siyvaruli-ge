import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
import { calculateAge, isOnline, timeAgo } from '@/constants';
import { UserAvatar } from './UserAvatar';
import type { Conversation } from '@/types';

export function MatchCard({ conversation, onPress }: {
  conversation: Conversation;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { t, lang } = useLanguage();
  const profile = conversation.other_profile;
  const age = calculateAge(profile.date_of_birth);

  return (
    <Pressable onPress={onPress} style={[styles.container, { borderBottomColor: colors.border }]}>
      <View style={styles.avatarWrap}>
        <UserAvatar name={profile.first_name} photo={conversation.other_photos?.[0]} size={56} />
        {isOnline(profile.last_active) && <View style={[styles.onlineDot, { borderColor: colors.card }]} />}
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {profile.first_name}{age !== null && ` ${age}`}
          </Text>
          {conversation.unread_count > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{conversation.unread_count}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.preview, { color: conversation.unread_count > 0 ? colors.text : colors.textMuted }]} numberOfLines={1}>
          {conversation.last_message?.content || t('messages.noMessages')}
        </Text>
      </View>
    </Pressable>
  );
}

export function NewMatchCard({ conversation, onPress }: {
  conversation: Conversation;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { lang } = useLanguage();
  const profile = conversation.other_profile;

  return (
    <Pressable onPress={onPress} style={styles.newMatchWrap}>
      <View style={[styles.newMatchRing, { borderColor: colors.primary }]}>
        <UserAvatar name={profile.first_name} photo={conversation.other_photos?.[0]} size={72} />
      </View>
      <Text style={[styles.newMatchName, { color: colors.text }]} numberOfLines={1}>{profile.first_name}</Text>
    </Pressable>
  );
}

export function LikeCard({ liker, photos, onPress }: {
  liker: Conversation['other_profile'];
  photos: Conversation['other_photos'];
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { lang } = useLanguage();
  const age = calculateAge(liker.date_of_birth);

  return (
    <Pressable onPress={onPress} style={[styles.likeCard, { backgroundColor: colors.card }]}>
      <View style={styles.likePhotoWrap}>
        <UserAvatar name={liker.first_name} photo={photos?.[0]} size={120} borderRadius={0} />
      </View>
      <View style={[styles.likeInfo, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
        <Text style={styles.likeName}>{liker.first_name}{age !== null && ` ${age}`}</Text>
        <Text style={styles.likeCity}>{liker.city}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
  avatarWrap: { position: 'relative' },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#22c55e', borderWidth: 2.5 },
  content: { flex: 1, gap: 2 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 15, fontWeight: '600' },
  badge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  preview: { fontSize: 14 },
  newMatchWrap: { alignItems: 'center', gap: 6, marginRight: 14 },
  newMatchRing: { padding: 3, borderRadius: 42 },
  newMatchName: { fontSize: 12, fontWeight: '500', maxWidth: 84 },
  likeCard: { flex: 1, borderRadius: 16, overflow: 'hidden', aspectRatio: 0.85 },
  likePhotoWrap: { flex: 1 },
  likeInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 12, paddingVertical: 10 },
  likeName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  likeCity: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
});
