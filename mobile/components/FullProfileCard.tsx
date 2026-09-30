import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { MapPin, Briefcase, GraduationCap, Ruler, Heart, Languages as LangIcon, BadgeCheck, Navigation } from '@expo/vector-icons/build/Feather';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
import { calculateAge, formatLastActive, formatDistance } from '@/constants';
import type { DiscoveryProfile } from '@/types';
import type { TranslationKey } from '@/constants/i18n';

export function FullProfileCard({ profile }: { profile: DiscoveryProfile }) {
  const { colors } = useTheme();
  const { t, lang } = useLanguage();
  const age = calculateAge(profile.date_of_birth);
  const photos = profile.photos || [];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} showsVerticalScrollIndicator={false}>
      {/* Main photo */}
      <View style={styles.photoWrap}>
        {photos.length > 0 ? (
          <Image source={{ uri: photos[0].url }} style={styles.photo} contentFit="cover" cachePolicy="memory-disk" />
        ) : (
          <View style={[styles.photo, { backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 80, fontWeight: '800', color: colors.primary }}>{profile.first_name.charAt(0)}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        {/* Name */}
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.text }]}>{profile.first_name}</Text>
          {age !== null && <Text style={[styles.age, { color: colors.textMuted }]}>{age}</Text>}
          {profile.is_verified && <BadgeCheck size={20} color={colors.primary} />}
        </View>
        <Text style={[styles.lastActive, { color: colors.textMuted }]}>{formatLastActive(profile.last_active, lang)}</Text>

        {/* Info grid */}
        <View style={styles.infoGrid}>
          {profile.city && <InfoItem icon={<MapPin size={16} color={colors.primary} />} label={t('profile.basicInfo')} value={profile.city} colors={colors} />}
          {profile.distance !== null && <InfoItem icon={<Navigation size={16} color={colors.primary} />} label={t('discover.distance')} value={formatDistance(profile.distance, lang)} colors={colors} />}
          {profile.occupation && <InfoItem icon={<Briefcase size={16} color={colors.primary} />} label={t('profile.occupation')} value={profile.occupation} colors={colors} />}
          {profile.education && <InfoItem icon={<GraduationCap size={16} color={colors.primary} />} label={t('profile.education')} value={profile.education} colors={colors} />}
          {profile.height && <InfoItem icon={<Ruler size={16} color={colors.primary} />} label={t('profile.height')} value={`${profile.height} cm`} colors={colors} />}
          {profile.relationship_intention && <InfoItem icon={<Heart size={16} color={colors.primary} />} label={t('profile.intention')} value={t(`intention.${profile.relationship_intention}` as TranslationKey)} colors={colors} />}
          {profile.languages?.length > 0 && <InfoItem icon={<LangIcon size={16} color={colors.primary} />} label={t('profile.languages')} value={profile.languages.join(', ')} colors={colors} />}
        </View>

        {/* Bio */}
        {profile.bio && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.about')}</Text>
            <Text style={[styles.bio, { color: colors.textSecondary }]}>{profile.bio}</Text>
          </View>
        )}

        {/* Interests */}
        {profile.user_interests?.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.interests')}</Text>
            <View style={styles.interestsWrap}>
              {profile.user_interests.map((ui) => (
                <View key={ui.interest_id} style={[styles.interestTag, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.interestText, { color: colors.primary }]}>
                    {t(`interest.${ui.interest_id}` as TranslationKey)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function InfoItem({ icon, label, value, colors }: {
  icon: React.ReactNode; label: string; value: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={[styles.infoItem, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      {icon}
      <View style={styles.infoText}>
        <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  photoWrap: { width: '100%', height: 360 },
  photo: { width: '100%', height: '100%' },
  content: { padding: 20, gap: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 26, fontWeight: '800' },
  age: { fontSize: 22 },
  lastActive: { fontSize: 13, marginTop: 2 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  infoItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, minWidth: '47%',
  },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 11 },
  infoValue: { fontSize: 14, fontWeight: '600', marginTop: 1 },
  section: { gap: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  bio: { fontSize: 14, lineHeight: 22 },
  interestsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestTag: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  interestText: { fontSize: 13, fontWeight: '500' },
});
