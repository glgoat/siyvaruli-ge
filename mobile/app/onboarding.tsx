import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image as RnImage } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Check, Camera, X } from '@expo/vector-icons/build/Feather';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { useTheme } from '@/lib/theme-context';
import { supabase } from '@/lib/supabase';
import { INTEREST_KEYS } from '@/constants';
import type { TranslationKey } from '@/constants/i18n';
import { Button } from '@/components/Button';

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const [step, setStep] = useState(0);
  const [bio, setBio] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const steps = [
    { title: t('onboarding.welcome'), desc: t('onboarding.welcomeDesc') },
    { title: t('onboarding.photos'), desc: t('onboarding.addPhotosDesc') },
    { title: t('onboarding.interests'), desc: t('onboarding.selectInterestsDesc') },
  ];

  const pickPhoto = async () => {
    if (!user || photos.length >= 6) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setUploading(true);
    try {
      const file = result.assets[0];
      const ext = file.uri.split('.').pop() || 'jpg';
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const formData = new FormData();
      formData.append('file', { uri: file.uri, name: path.split('/').pop() || 'photo.jpg', type: `image/${ext}` } as unknown as Blob);
      const { error: uploadError } = await supabase.storage.from('profile-photos').upload(path, formData);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('profile-photos').getPublicUrl(path);
      setPhotos((prev) => [...prev, publicUrl]);
    } catch {
      // ignore
    }
    setUploading(false);
  };

  const toggleInterest = (key: string) => {
    setInterests((prev) => prev.includes(key) ? prev.filter((i) => i !== key) : prev.length < 8 ? [...prev, key] : prev);
  };

  const finish = async () => {
    if (!user) return;
    try {
      for (let i = 0; i < photos.length; i++) {
        await supabase.from('photos').insert({ user_id: user.id, url: photos[i], position: i });
      }
      await supabase.from('profiles').update({ bio, profile_completed: true }).eq('id', user.id);
      if (interests.length > 0) {
        const { data: interestRows } = await supabase.from('interests').select('id, key').in('key', interests);
        if (interestRows) {
          await supabase.from('user_interests').insert(interestRows.map((r) => ({ user_id: user.id, interest_id: r.id })));
        }
      }
      await refreshProfile();
      router.replace('/(tabs)/discover');
    } catch {
      // ignore
    }
  };

  const canProceed = step === 0 || (step === 1 && photos.length > 0) || (step === 2 && interests.length >= 3);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          {steps.map((_, i) => (
            <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i <= step ? colors.primary : colors.border }} />
          ))}
        </View>
        <Text style={{ color: colors.textMuted, fontSize: 13 }}>{t('auth.step')} {step + 1} {t('auth.of')} {steps.length}</Text>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 8 }}>{steps[step].title}</Text>
        <Text style={{ fontSize: 15, color: colors.textMuted, marginBottom: 24, textAlign: 'center' }}>{steps[step].desc}</Text>

        {step === 0 && (
          <View>
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textSecondary, marginBottom: 6 }}>{t('auth.bio')}</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.inputBg, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: colors.text, minHeight: 120, textAlignVertical: 'top' }}
              value={bio}
              onChangeText={setBio}
              maxLength={500}
              multiline
              placeholder="..."
              placeholderTextColor={colors.textMuted}
            />
            <Text style={{ textAlign: 'right', fontSize: 12, color: colors.textMuted, marginTop: 4 }}>{bio.length}/500</Text>
          </View>
        )}

        {step === 1 && (
          <View>
            <TouchableOpacity onPress={pickPhoto} disabled={uploading || photos.length >= 6}
              style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border, borderRadius: 20, padding: 32, alignItems: 'center', gap: 12 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                <Camera size={28} color={colors.primary} />
              </View>
              <Text style={{ fontWeight: '600', color: colors.textSecondary }}>{uploading ? t('common.loading') : t('onboarding.uploadPhoto')}</Text>
            </TouchableOpacity>
            {photos.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
                {photos.map((url, i) => (
                  <View key={url} style={{ width: 100, height: 100, borderRadius: 14, overflow: 'hidden' }}>
                    <RnImage source={{ uri: url }} style={{ width: '100%', height: '100%' }} />
                    <TouchableOpacity onPress={() => setPhotos((prev) => prev.filter((p) => p !== url))}
                      style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={14} color="#fff" />
                    </TouchableOpacity>
                    {i === 0 && <Text style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 10, textAlign: 'center', paddingVertical: 2 }}>Main</Text>}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {step === 2 && (
          <View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {INTEREST_KEYS.map((key) => {
                const selected = interests.includes(key);
                return (
                  <TouchableOpacity key={key} onPress={() => toggleInterest(key)}
                    style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: selected ? colors.primary : colors.border }}>
                    <Text style={{ color: selected ? '#fff' : colors.textSecondary, fontSize: 14, fontWeight: '500' }}>
                      {t(`interest.${key}` as TranslationKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={{ textAlign: 'center', fontSize: 13, color: colors.textMuted, marginTop: 16 }}>{interests.length}/8</Text>
          </View>
        )}
      </ScrollView>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12 }}>
        {step > 0 ? (
          <Button title={t('common.back')} variant="ghost" onPress={() => setStep(step - 1)} icon={<ArrowLeft size={18} color={colors.textSecondary} />} />
        ) : <View />}
        {step < steps.length - 1 ? (
          <Button title={t('auth.continue')} onPress={() => canProceed() && setStep(step + 1)} disabled={!canProceed} icon={<ArrowRight size={18} color="#fff" />} />
        ) : (
          <Button title={t('onboarding.finish')} onPress={finish} disabled={!canProceed} icon={<Check size={18} color="#fff" />} />
        )}
      </View>
    </View>
  );
}
