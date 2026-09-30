import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Heart, X, Undo, SlidersHorizontal, Navigation } from '@expo/vector-icons/build/Feather';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { useTheme } from '@/lib/theme-context';
import { useDiscovery } from '@/hooks/useDiscovery';
import { SwipeDeck } from '@/components/SwipeDeck';
import { FullProfileCard } from '@/components/FullProfileCard';
import { EmptyState, LoadingScreen, ErrorState } from '@/components/Feedback';
import { AppModal } from '@/components/Modal';
import { GEORGIAN_CITIES, INTENTIONS } from '@/constants';
import type { DiscoveryProfile } from '@/types';
import type { TranslationKey } from '@/constants/i18n';
import { Button } from '@/components/Button';
import { getNearestCity } from '@/constants';

export default function DiscoverScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const { t, lang } = useLanguage();
  const { colors } = useTheme();
  const { profiles, loading, load, handleSwipe, handleUndo, lastSwipe, matchData, setMatchData, filters, setFilters, userLocation, setUserLocation } = useDiscovery();
  const [showFilters, setShowFilters] = useState(false);
  const [showProfile, setShowProfile] = useState<DiscoveryProfile | null>(null);
  const [locating, setLocating] = useState(false);

  const handleUseLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        if (user) {
          const nearest = getNearestCity(latitude, longitude);
          await import('@/lib/supabase').then(({ supabase }) =>
            supabase.from('profiles').update({ latitude, longitude, ...(nearest ? { city: nearest } : {}) }).eq('id', user.id)
          );
          await refreshProfile();
        }
        setLocating(false);
        load();
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 20000 }
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header colors={colors} title={t('discover.title')} onFilters={() => setShowFilters(true)} onLocation={handleUseLocation} locating={locating} />

      {loading ? (
        <LoadingScreen />
      ) : profiles.length === 0 ? (
        <EmptyState icon={<Heart size={32} color={colors.primary} />} title={t('discover.noMore')} description={t('discover.noMoreDesc')} />
      ) : (
        <View style={{ flex: 1 }}>
          <SwipeDeck profiles={profiles} onSwipe={handleSwipe} onInfo={(p) => setShowProfile(p)} />

          <View style={styles.actions}>
            <Pressable onPress={handleUndo} disabled={!lastSwipe} style={[styles.actionBtn, { backgroundColor: colors.card, opacity: !lastSwipe ? 0.4 : 1 }]}>
              <Undo size={22} color="#f59e0b" />
            </Pressable>
            <Pressable onPress={() => profiles[0] && handleSwipe('left', profiles[0])} style={[styles.actionBtn, styles.passBtn, { backgroundColor: colors.card }]}>
              <X size={28} color={colors.error} />
            </Pressable>
            <Pressable onPress={() => profiles[0] && handleSwipe('right', profiles[0])} style={[styles.actionBtn, styles.likeBtn, { backgroundColor: colors.card }]}>
              <Heart size={28} color={colors.success} fill={colors.success} />
            </Pressable>
            <Pressable onPress={() => profiles[0] && setShowProfile(profiles[0])} style={[styles.actionBtn, { backgroundColor: colors.card }]}>
              <SlidersHorizontal size={20} color="#3b82f6" />
            </Pressable>
          </View>
        </View>
      )}

      {/* Full profile modal */}
      <AppModal visible={!!showProfile} onClose={() => setShowProfile(null)}>
        {showProfile && <FullProfileCard profile={showProfile} />}
      </AppModal>

      {/* Filters modal */}
      <AppModal visible={showFilters} onClose={() => setShowFilters(false)} title={t('discover.filters')}>
        <View style={{ padding: 20, gap: 16 }}>
          <View>
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textSecondary, marginBottom: 8 }}>
              {t('discover.ageRange')}: {filters.ageMin} - {filters.ageMax}
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Text style={{ color: colors.text }}>Min: {filters.ageMin}</Text>
              <Text style={{ color: colors.text }}>Max: {filters.ageMax}</Text>
            </View>
          </View>
          <View>
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textSecondary, marginBottom: 8 }}>{t('discover.city')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <TouchableOpacity onPress={() => setFilters({ ...filters, city: '' })} style={[styles.cityPill, { borderColor: !filters.city ? colors.primary : colors.border, backgroundColor: !filters.city ? colors.primaryLight : 'transparent' }]}>
                <Text style={{ color: !filters.city ? colors.primary : colors.textSecondary, fontSize: 13 }}>{t('discover.allCities')}</Text>
              </TouchableOpacity>
              {GEORGIAN_CITIES.map((c) => (
                <TouchableOpacity key={c} onPress={() => setFilters({ ...filters, city: c })} style={[styles.cityPill, { borderColor: filters.city === c ? colors.primary : colors.border, backgroundColor: filters.city === c ? colors.primaryLight : 'transparent' }]}>
                  <Text style={{ color: filters.city === c ? colors.primary : colors.textSecondary, fontSize: 13 }}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View>
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textSecondary, marginBottom: 8 }}>{t('discover.intention')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <TouchableOpacity onPress={() => setFilters({ ...filters, intention: '' })} style={[styles.cityPill, { borderColor: !filters.intention ? colors.primary : colors.border, backgroundColor: !filters.intention ? colors.primaryLight : 'transparent' }]}>
                <Text style={{ color: !filters.intention ? colors.primary : colors.textSecondary, fontSize: 13 }}>{t('discover.allIntentions')}</Text>
              </TouchableOpacity>
              {INTENTIONS.map((i) => (
                <TouchableOpacity key={i.value} onPress={() => setFilters({ ...filters, intention: i.value })} style={[styles.cityPill, { borderColor: filters.intention === i.value ? colors.primary : colors.border, backgroundColor: filters.intention === i.value ? colors.primaryLight : 'transparent' }]}>
                  <Text style={{ color: filters.intention === i.value ? colors.primary : colors.textSecondary, fontSize: 13 }}>{t(i.labelKey as TranslationKey)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <Button title={t('discover.apply')} onPress={() => { setShowFilters(false); load(); }} />
        </View>
      </AppModal>

      {/* Match modal */}
      {matchData && (
        <View style={[styles.matchOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.matchCard, { backgroundColor: colors.primary }]}>
            <Heart size={48} color="#fff" fill="#fff" />
            <Text style={styles.matchTitle}>{t('matches.newMatch')}</Text>
            <Text style={styles.matchSub}>{t('matches.youMatched')} {matchData.name}!</Text>
            {matchData.photo ? (
              <View style={{ width: 120, height: 120, borderRadius: 60, overflow: 'hidden', marginVertical: 20, borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)' }}>
                <View style={{ width: '100%', height: '100%', backgroundColor: 'rgba(255,255,255,0.2)' }} />
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <Button title={t('matches.sendMessage')} variant="secondary" onPress={() => { setMatchData(null); router.push('/(tabs)/messages'); }} />
              <Button title={t('common.close')} onPress={() => setMatchData(null)} />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

function Header({ colors, title, onFilters, onLocation, locating }: {
  colors: ReturnType<typeof useTheme>['colors']; title: string;
  onFilters: () => void; onLocation: () => void; locating: boolean;
}) {
  return (
    <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>{title}</Text>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        <Pressable onPress={onLocation} style={{ padding: 8 }}>
          <Navigation size={18} color={colors.textSecondary} />
        </Pressable>
        <Pressable onPress={onFilters} style={{ padding: 8 }}>
          <SlidersHorizontal size={18} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 16, paddingBottom: 24 },
  actionBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  passBtn: { width: 56, height: 56, borderRadius: 28 },
  likeBtn: { width: 56, height: 56, borderRadius: 28 },
  cityPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  matchOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  matchCard: { borderRadius: 24, padding: 32, alignItems: 'center', width: '85%' },
  matchTitle: { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 12 },
  matchSub: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
});
