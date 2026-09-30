import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, FlatList, Image as RnImage } from 'react-native';
import { Camera, X, Edit2, Check, MapPin, Briefcase, GraduationCap, Ruler, Heart, Languages as LangIcon, BadgeCheck, Settings as SettingsIcon, Shield } from '@expo/vector-icons/build/Feather';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { useTheme } from '@/lib/theme-context';
import { supabase } from '@/lib/supabase';
import { calculateAge, formatLastActive, GEORGIAN_CITIES, INTEREST_KEYS, getCityCoordinates, INTENTIONS } from '@/constants';
import { fetchProfileData, updateProfile, uploadPhoto, deletePhoto, toggleInterest } from '@/services/profile';
import type { Photo, Interest, Gender, RelationshipIntention } from '@/types';
import type { TranslationKey } from '@/constants/i18n';
import { Button } from '@/components/Button';

export default function ProfileScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const { t, lang } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    first_name: '', bio: '', city: '', occupation: '', education: '', height: 0,
    relationship_intention: '' as RelationshipIntention | '', languages: [] as string[],
  });

  const loadData = useCallback(async () => {
    if (!user) return;
    const data = await fetchProfileData(user.id);
    setPhotos(data.photos);
    setInterests(data.interests);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (profile) {
      setEditData({
        first_name: profile.first_name, bio: profile.bio, city: profile.city,
        occupation: profile.occupation || '', education: profile.education || '',
        height: profile.height || 0, relationship_intention: profile.relationship_intention || '',
        languages: profile.languages || [],
      });
    }
  }, [profile]);

  const save = async () => {
    if (!user) return;
    await updateProfile(user.id, {
      first_name: editData.first_name, bio: editData.bio, city: editData.city,
      occupation: editData.occupation || null, education: editData.education || null,
      height: editData.height || null, relationship_intention: editData.relationship_intention || null,
      languages: editData.languages,
    });
    await refreshProfile();
    setEditing(false);
  };

  if (!profile) return null;
  const age = calculateAge(profile.date_of_birth);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>{t('nav.profile')}</Text>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <Pressable onPress={() => router.push('/verification')} style={{ padding: 8 }}><Shield size={20} color={colors.textSecondary} /></Pressable>
          <Pressable onPress={() => router.push('/settings')} style={{ padding: 8 }}><SettingsIcon size={20} color={colors.textSecondary} /></Pressable>
          {!editing ? (
            <Pressable onPress={() => setEditing(true)} style={{ padding: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Edit2 size={18} color={colors.textSecondary} /><Text style={{ color: colors.textSecondary, fontSize: 14 }}>{t('profile.edit')}</Text>
            </Pressable>
          ) : (
            <Pressable onPress={save} style={{ padding: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Check size={18} color={colors.primary} /><Text style={{ color: colors.primary, fontSize: 14 }}>{t('profile.save')}</Text>
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Photos grid */}
        <View style={styles.photoGrid}>
          {Array.from({ length: 6 }).map((_, i) => {
            const photo = photos[i];
            return (
              <View key={i} style={[styles.photoSlot, { backgroundColor: colors.border }]}>
                {photo ? (
                  <>
                    <RnImage source={{ uri: photo.url }} style={{ width: '100%', height: '100%' }} />
                    {i === 0 && <Text style={styles.mainBadge}>Main</Text>}
                    {editing && (
                      <Pressable onPress={async () => { await deletePhoto(photo.id); setPhotos((prev) => prev.filter((p) => p.id !== photo.id)); }} style={styles.deleteBtn}>
                        <X size={14} color="#fff" />
                      </Pressable>
                    )}
                  </>
                ) : editing ? (
                  <Pressable onPress={async () => { const p = await uploadPhoto(user!.id, i); if (p) setPhotos((prev) => [...prev, p].sort((a, b) => a.position - b.position)); }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={20} color={colors.textMuted} />
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>

        {/* Profile info */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {editing ? (
            <View style={{ gap: 12 }}>
              <Field label={t('auth.firstName')} colors={colors}>
                <TextInput style={styles.input(colors)} value={editData.first_name} onChangeText={(v) => setEditData({ ...editData, first_name: v })} />
              </Field>
              <Field label={t('auth.city')} colors={colors}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {GEORGIAN_CITIES.map((c) => (
                    <Pressable key={c} onPress={() => setEditData({ ...editData, city: c })} style={[styles.cityPill, { borderColor: editData.city === c ? colors.primary : colors.border, backgroundColor: editData.city === c ? colors.primaryLight : 'transparent' }]}>
                      <Text style={{ color: editData.city === c ? colors.primary : colors.textSecondary, fontSize: 13 }}>{c}</Text>
                    </Pressable>
                  ))}
                </View>
              </Field>
              <Field label={t('auth.bio')} colors={colors}>
                <TextInput style={[styles.input(colors), { minHeight: 80 }]} value={editData.bio} onChangeText={(v) => setEditData({ ...editData, bio: v })} multiline maxLength={500} />
              </Field>
              <Field label={t('profile.occupation')} colors={colors}>
                <TextInput style={styles.input(colors)} value={editData.occupation} onChangeText={(v) => setEditData({ ...editData, occupation: v })} />
              </Field>
              <Field label={t('profile.education')} colors={colors}>
                <TextInput style={styles.input(colors)} value={editData.education} onChangeText={(v) => setEditData({ ...editData, education: v })} />
              </Field>
              <Field label={`${t('profile.height')} (cm)`} colors={colors}>
                <TextInput style={styles.input(colors)} value={editData.height ? String(editData.height) : ''} onChangeText={(v) => setEditData({ ...editData, height: Number(v) || 0 })} keyboardType="numeric" />
              </Field>
              <Field label={t('profile.intention')} colors={colors}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {INTENTIONS.map((i) => (
                    <Pressable key={i.value} onPress={() => setEditData({ ...editData, relationship_intention: i.value })} style={[styles.cityPill, { borderColor: editData.relationship_intention === i.value ? colors.primary : colors.border, backgroundColor: editData.relationship_intention === i.value ? colors.primaryLight : 'transparent' }]}>
                      <Text style={{ color: editData.relationship_intention === i.value ? colors.primary : colors.textSecondary, fontSize: 13 }}>{t(i.labelKey as TranslationKey)}</Text>
                    </Pressable>
                  ))}
                </View>
              </Field>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>{profile.first_name}</Text>
                {age !== null && <Text style={{ fontSize: 20, color: colors.textMuted }}>{age}</Text>}
                {profile.is_verified && <BadgeCheck size={20} color={colors.primary} />}
              </View>
              <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 12 }}>{formatLastActive(profile.last_active, lang)}</Text>
              {profile.bio ? <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 12 }}>{profile.bio}</Text> : null}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {profile.city && <InfoItem icon={<MapPin size={16} color={colors.primary} />} label={t('profile.basicInfo')} value={profile.city} colors={colors} />}
                {profile.occupation && <InfoItem icon={<Briefcase size={16} color={colors.primary} />} label={t('profile.occupation')} value={profile.occupation} colors={colors} />}
                {profile.education && <InfoItem icon={<GraduationCap size={16} color={colors.primary} />} label={t('profile.education')} value={profile.education} colors={colors} />}
                {profile.height && <InfoItem icon={<Ruler size={16} color={colors.primary} />} label={t('profile.height')} value={`${profile.height} cm`} colors={colors} />}
                {profile.relationship_intention && <InfoItem icon={<Heart size={16} color={colors.primary} />} label={t('profile.intention')} value={t(`intention.${profile.relationship_intention}` as TranslationKey)} colors={colors} />}
                {profile.languages?.length > 0 && <InfoItem icon={<LangIcon size={16} color={colors.primary} />} label={t('profile.languages')} value={profile.languages.join(', ')} colors={colors} />}
              </View>
            </>
          )}
        </View>

        {/* Interests */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 10 }}>{t('profile.interests')}</Text>
          {editing ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {INTEREST_KEYS.map((key) => {
                const selected = interests.some((i) => i.key === key);
                return (
                  <Pressable key={key} onPress={async () => { const updated = await toggleInterest(user!.id, key, interests); setInterests(updated); }} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: selected ? colors.primary : colors.border }}>
                    <Text style={{ color: selected ? '#fff' : colors.textSecondary, fontSize: 13, fontWeight: '500' }}>{t(`interest.${key}` as TranslationKey)}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : interests.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {interests.map((interest) => (
                <View key={interest.id} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.primaryLight }}>
                  <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '500' }}>{t(`interest.${interest.key}` as TranslationKey)}</Text>
                </View>
              ))}
            </View>
          ) : <Text style={{ color: colors.textMuted, fontSize: 14 }}>--</Text>}
        </View>

        {/* Verification */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: profile.verification_status === 'verified' ? colors.success + '20' : colors.border }}>
              <BadgeCheck size={22} color={profile.verification_status === 'verified' ? colors.success : colors.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', color: colors.text }}>
                {profile.verification_status === 'verified' ? t('profile.verified') : profile.verification_status === 'pending' ? t('profile.verificationPending') : t('profile.unverified')}
              </Text>
              {profile.verification_status === 'unverified' && (
                <Pressable onPress={() => router.push('/verification')}><Text style={{ color: colors.primary, fontSize: 14 }}>{t('profile.verify')}</Text></Pressable>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Field({ label, children, colors }: { label: string; children: React.ReactNode; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textSecondary }}>{label}</Text>
      {children}
    </View>
  );
}

function InfoItem({ icon, label, value, colors }: { icon: React.ReactNode; label: string; value: string; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, backgroundColor: colors.bg, minWidth: '47%' }}>
      {icon}
      <View>
        <Text style={{ fontSize: 11, color: colors.textMuted }}>{label}</Text>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoSlot: { width: '31%', aspectRatio: 1, borderRadius: 14, overflow: 'hidden', position: 'relative' },
  mainBadge: { position: 'absolute', top: 4, left: 4, fontSize: 10, fontWeight: '600', color: '#fff', backgroundColor: '#f43f5e', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  deleteBtn: { position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  cityPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
});

function inputStyle(colors: ReturnType<typeof useTheme>['colors']) {
  return { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.inputBg, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: colors.text };
}
