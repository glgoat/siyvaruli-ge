import React, { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  runOnJS, interpolate, Extrapolate, FadeOut, FadeIn,
} from 'react-native-reanimated';
import { MapPin, Navigation, Info, BadgeCheck } from '@expo/vector-icons/build/Feather';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
import { calculateAge, isOnline, formatDistance, formatLastActive } from '@/constants';
import type { DiscoveryProfile } from '@/types';
import type { TranslationKey } from '@/constants/i18n';

const SCREEN_W = Dimensions.get('window').width;
const SCREEN_H = Dimensions.get('window').height;
const SWIPE_THRESHOLD = SCREEN_W * 0.25;

interface SwipeDeckProps {
  profiles: DiscoveryProfile[];
  onSwipe: (direction: 'left' | 'right', profile: DiscoveryProfile) => void;
  onInfo: (profile: DiscoveryProfile) => void;
}

export function SwipeDeck({ profiles, onSwipe, onInfo }: SwipeDeckProps) {
  const { colors } = useTheme();
  const { lang } = useLanguage();
  const [index, setIndex] = useState(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const current = profiles[index];
  const next = profiles[index + 1];

  const triggerSwipe = useCallback((direction: 'left' | 'right', profile: DiscoveryProfile) => {
    onSwipe(direction, profile);
    setIndex((prev) => prev + 1);
    translateX.value = 0;
    translateY.value = 0;
  }, [onSwipe, translateX, translateY]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        translateX.value = withSpring(SCREEN_W * 1.5);
        runOnJS(triggerSwipe)('right', current);
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withSpring(-SCREEN_W * 1.5);
        runOnJS(triggerSwipe)('left', current);
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotation = interpolate(translateX.value, [-SCREEN_W / 2, SCREEN_W / 2], [-15, 15], Extrapolate.CLAMP);
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation}deg` },
      ],
    };
  });

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolate.CLAMP),
  }));

  const nopeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolate.CLAMP),
  }));

  if (!current) return null;

  return (
    <View style={styles.deck}>
      {/* Next card (background) */}
      {next && (
        <Animated.View style={[styles.card, styles.nextCard, { backgroundColor: colors.card }]}>
          <SwipeCardContent profile={next} colors={colors} lang={lang} />
        </Animated.View>
      )}

      {/* Current card */}
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.card, { backgroundColor: colors.card }, cardStyle]}>
          <SwipeCardContent profile={current} colors={colors} lang={lang} onInfo={() => onInfo(current)} />

          {/* Like overlay */}
          <Animated.View style={[styles.overlay, styles.likeOverlay, likeOpacity]}>
            <View style={[styles.badge, { borderColor: colors.success }]}>
              <Text style={[styles.badgeText, { color: colors.success }]}>LIKE</Text>
            </View>
          </Animated.View>

          {/* Nope overlay */}
          <Animated.View style={[styles.overlay, styles.nopeOverlay, nopeOpacity]}>
            <View style={[styles.badge, { borderColor: colors.error }]}>
              <Text style={[styles.badgeText, { color: colors.error }]}>NOPE</Text>
            </View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

function SwipeCardContent({ profile, colors, lang, onInfo }: {
  profile: DiscoveryProfile;
  colors: ReturnType<typeof useTheme>['colors'];
  lang: 'ka' | 'en';
  onInfo?: () => void;
}) {
  const { t } = useLanguage();
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = profile.photos || [];
  const age = calculateAge(profile.date_of_birth);

  const handlePhotoTap = (x: number) => {
    if (x < SCREEN_W / 3 && photoIndex > 0) setPhotoIndex(photoIndex - 1);
    else if (x > (SCREEN_W * 2) / 3 && photoIndex < photos.length - 1) setPhotoIndex(photoIndex + 1);
  };

  return (
    <View style={styles.cardInner}>
      {photos.length > 0 ? (
        <Pressable onPress={(e) => handlePhotoTap(e.nativeEvent.locationX)} style={styles.imageWrap}>
          <Image
            source={{ uri: photos[photoIndex]?.url }}
            style={styles.image}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
          {/* Photo indicators */}
          {photos.length > 1 && (
            <View style={styles.indicators}>
              {photos.map((_, i) => (
                <View key={i} style={[styles.indicator, { flex: 1 }, i === photoIndex && { backgroundColor: '#fff' }]} />
              ))}
            </View>
          )}
        </Pressable>
      ) : (
        <View style={[styles.imageWrap, { backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ fontSize: 64, fontWeight: '800', color: colors.primary }}>
            {profile.first_name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      {/* Gradient overlay with info */}
      <View style={styles.infoOverlay}>
        <View style={styles.infoRow}>
          <Text style={styles.name}>{profile.first_name}</Text>
          {age !== null && <Text style={styles.age}>{age}</Text>}
          {profile.is_verified && (
            <BadgeCheck size={20} color={colors.primary} />
          )}
        </View>
        <View style={styles.subInfoRow}>
          {profile.city && (
            <View style={styles.subInfoItem}>
              <MapPin size={13} color="rgba(255,255,255,0.8)" />
              <Text style={styles.subInfoText}>{profile.city}</Text>
            </View>
          )}
          {profile.distance !== null && (
            <View style={styles.subInfoItem}>
              <Navigation size={11} color={colors.primary} />
              <Text style={[styles.subInfoText, { color: colors.primary }]}>{formatDistance(profile.distance, lang)}</Text>
            </View>
          )}
          {isOnline(profile.last_active) && (
            <View style={styles.subInfoItem}>
              <View style={styles.onlineDot} />
              <Text style={[styles.subInfoText, { color: colors.success }]}>{lang === 'ka' ? 'ონლაინ' : 'Online'}</Text>
            </View>
          )}
        </View>
        {profile.occupation && <Text style={styles.occupation}>{profile.occupation}</Text>}
        {profile.bio && <Text style={styles.bio} numberOfLines={2}>{profile.bio}</Text>}
      </View>

      {onInfo && (
        <Pressable style={styles.infoBtn} onPress={onInfo}>
          <Info size={20} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}

const CARD_W = SCREEN_W - 32;
const CARD_H = SCREEN_H * 0.62;

const styles = StyleSheet.create({
  deck: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    width: CARD_W, height: CARD_H, borderRadius: 24, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12,
    elevation: 8, position: 'absolute',
  },
  nextCard: { transform: [{ scale: 0.95 }], opacity: 0.5 },
  cardInner: { flex: 1 },
  imageWrap: { flex: 1 },
  image: { width: '100%', height: '100%' },
  indicators: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', gap: 4 },
  indicator: { height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)' },
  infoOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 18, paddingVertical: 16,
  paddingBottom: 20,
  paddingTop: 60,
  borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  gap: 4,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 24, fontWeight: '800', color: '#fff' },
  age: { fontSize: 20, color: 'rgba(255,255,255,0.8)' },
  subInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 },
  subInfoItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  subInfoText: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22c55e' },
  occupation: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  bio: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4, lineHeight: 18 },
  infoBtn: {
    position: 'absolute', top: 14, right: 14, width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center',
  },
  overlay: { position: 'absolute', top: 50, alignItems: 'center', zIndex: 10 },
  likeOverlay: { left: 30, transform: [{ rotate: '-15deg' }] },
  nopeOverlay: { right: 30, transform: [{ rotate: '15deg' }] },
  badge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 3 },
  badgeText: { fontSize: 22, fontWeight: '800' },
});
