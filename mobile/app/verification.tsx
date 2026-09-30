import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import { Shield, Camera, CheckCircle2, Clock, XCircle } from '@expo/vector-icons/build/Feather';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { useTheme } from '@/lib/theme-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/Button';

export default function VerificationScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pickPhoto = async () => {
    if (!user) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (result.canceled || !result.assets?.[0]) return;
    const file = result.assets[0];
    const ext = file.uri.split('.').pop() || 'jpg';
    const path = `${user.id}/verification-${Date.now()}.${ext}`;
    const formData = new FormData();
    formData.append('file', { uri: file.uri, name: path.split('/').pop() || 'photo.jpg', type: `image/${ext}` } as unknown as Blob);
    const { error } = await supabase.storage.from('verification-photos').upload(path, formData);
    if (error) return;
    const { data: { publicUrl } } = supabase.storage.from('verification-photos').getPublicUrl(path);
    setSelfieUrl(publicUrl);
  };

  const submit = async () => {
    if (!user || !selfieUrl) return;
    setSubmitting(true);
    await supabase.from('verification_requests').insert({ user_id: user.id, selfie_photo_url: selfieUrl, notes });
    await supabase.from('profiles').update({ verification_status: 'pending' }).eq('id', user.id);
    await refreshProfile();
    setSubmitting(false);
    router.back();
  };

  const status = profile?.verification_status || 'unverified';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}><Text style={{ color: colors.primary, fontSize: 16 }}>{t('common.back')}</Text></Pressable>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>{t('verification.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Status banner */}
        <View style={[styles.statusBanner, { backgroundColor: colors.card, borderColor: status === 'verified' ? colors.success : status === 'pending' ? colors.warning : colors.border }]}>
          <View style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: status === 'verified' ? colors.success + '20' : status === 'pending' ? colors.warning + '20' : colors.border }}>
            {status === 'verified' ? <CheckCircle2 size={32} color={colors.success} /> : status === 'pending' ? <Clock size={32} color={colors.warning} /> : status === 'rejected' ? <XCircle size={32} color={colors.error} /> : <Shield size={32} color={colors.textMuted} />}
          </View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 12 }}>
            {status === 'verified' ? t('verification.approved') : status === 'pending' ? t('verification.pending') : status === 'rejected' ? t('verification.rejected') : t('profile.unverified')}
          </Text>
          <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 4 }}>{t('verification.desc')}</Text>
        </View>

        {/* Form */}
        {(status === 'unverified' || status === 'rejected') && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textSecondary, marginBottom: 8 }}>{t('verification.selfie')}</Text>
            <Pressable onPress={pickPhoto} style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border, borderRadius: 20, padding: 32, alignItems: 'center', gap: 12 }}>
              {selfieUrl ? (
                <View style={{ width: 120, height: 120, borderRadius: 60, overflow: 'hidden' }}>
                  <View style={{ width: '100%', height: '100%', backgroundColor: colors.primaryLight }} />
                </View>
              ) : (
                <>
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={28} color={colors.primary} />
                  </View>
                  <Text style={{ fontWeight: '600', color: colors.textSecondary }}>{t('verification.uploadSelfie')}</Text>
                </>
              )}
            </Pressable>
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textSecondary, marginTop: 16, marginBottom: 6 }}>{t('report.description')}</Text>
            <TextInput style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.inputBg, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: colors.text, minHeight: 80, textAlignVertical: 'top' }} value={notes} onChangeText={setNotes} multiline maxLength={500} />
            <Button title={submitting ? t('common.loading') : t('verification.submit')} onPress={submit} disabled={!selfieUrl || submitting} style={{ marginTop: 16 }} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, paddingTop: 50 },
  statusBanner: { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: 'center' },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
});
