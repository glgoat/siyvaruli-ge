import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, ArrowLeft } from '@expo/vector-icons/build/Feather';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { useTheme } from '@/lib/theme-context';
import { supabase } from '@/lib/supabase';
import { GEORGIAN_CITIES, is18Plus, getCityCoordinates, INTENTIONS } from '@/constants';
import type { TranslationKey } from '@/constants/i18n';
import type { Gender, InterestedIn, RelationshipIntention } from '@/types';
import { Button } from '@/components/Button';

export default function AuthScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { refreshProfile } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [interestedIn, setInterestedIn] = useState<InterestedIn | ''>('');
  const [intention, setIntention] = useState<RelationshipIntention | ''>('');
  const [city, setCity] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (mode === 'signup') {
      if (!email || !password || !firstName || !dob || !gender || !interestedIn || !city || !intention) {
        setError(t('auth.required'));
        return;
      }
      if (!is18Plus(dob)) { setError(t('auth.mustBe18')); return; }
      if (password.length < 6) { setError(t('auth.passwordMinLength')); return; }
      if (password !== confirmPassword) { setError(t('auth.passwordMismatch')); return; }

      setLoading(true);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email, password,
        options: { data: { first_name: firstName, city } },
      });
      if (signUpError) {
        setError(signUpError.message.includes('already') ? t('auth.emailExists') : signUpError.message);
        setLoading(false);
        return;
      }
      if (data.user) {
        const coords = getCityCoordinates(city);
        await supabase.from('profiles').update({
          first_name: firstName, date_of_birth: dob, gender,
          interested_in: interestedIn, relationship_intention: intention,
          city, latitude: coords?.lat ?? null, longitude: coords?.lng ?? null,
        }).eq('id', data.user.id);
      }
      await refreshProfile();
      router.replace('/onboarding');
      return;
    }

    if (mode === 'login') {
      setLoading(true);
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) { setError(t('auth.loginError')); setLoading(false); return; }
      router.replace('/');
      return;
    }

    if (mode === 'reset') {
      setLoading(true);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
      if (resetError) { setError(resetError.message); setLoading(false); return; }
      setMode('login');
      setError(t('auth.resetLinkSent'));
      setLoading(false);
      return;
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 }}>
        <View style={styles.logoWrap}>
          <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
            <Heart size={24} color="#fff" fill="#fff" />
          </View>
          <Text style={[styles.logoText, { color: colors.text }]}>
            siyvaruli<Text style={{ color: colors.primary }}>.ge</Text>
          </Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          {mode === 'login' ? t('auth.login') : mode === 'signup' ? t('auth.signup') : t('auth.resetPassword')}
        </Text>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.error + '15', borderColor: colors.error }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          {mode === 'signup' && (
            <>
              <Input label={t('auth.firstName')} value={firstName} onChange={setFirstName} colors={colors} />
              <Input label={t('auth.dob')} value={dob} onChange={setDob} colors={colors} placeholder="YYYY-MM-DD" />
              <ChoiceGroup label={t('auth.gender')} options={[{v:'male',l:t('auth.male')},{v:'female',l:t('auth.female')},{v:'other',l:t('auth.other')}]} value={gender} onChange={(v) => setGender(v as Gender)} colors={colors} />
              <ChoiceGroup label={t('auth.interestedIn')} options={[{v:'men',l:t('auth.men')},{v:'women',l:t('auth.women')},{v:'everyone',l:t('auth.everyone')}]} value={interestedIn} onChange={(v) => setInterestedIn(v as InterestedIn)} colors={colors} />
              <ChoiceGroup label={t('auth.intention')} options={INTENTIONS.map((i) => ({ v: i.value, l: t(i.labelKey as TranslationKey) }))} value={intention} onChange={(v) => setIntention(v as RelationshipIntention)} colors={colors} columns={2} />
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('auth.city')}</Text>
                <View style={[styles.selectWrap, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
                  <TextInput style={[styles.selectFake, { color: city ? colors.text : colors.textMuted }]} pointerEvents="none" value={city || t('auth.selectCity')} />
                  {GEORGIAN_CITIES.map((c) => (
                    <TouchableOpacity key={c} onPress={() => setCity(c)} style={[styles.cityPill, { borderColor: city === c ? colors.primary : colors.border, backgroundColor: city === c ? colors.primaryLight : 'transparent' }]}>
                      <Text style={{ color: city === c ? colors.primary : colors.textSecondary, fontSize: 13 }}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          <Input label={t('auth.email')} value={email} onChange={setEmail} colors={colors} keyboardType="email-address" />
          {mode !== 'reset' && <Input label={t('auth.password')} value={password} onChange={setPassword} colors={colors} secure />}
          {mode === 'signup' && <Input label={t('auth.confirmPassword')} value={confirmPassword} onChange={setConfirmPassword} colors={colors} secure />}

          {mode === 'signup' && <Text style={[styles.hint, { color: colors.textMuted }]}>{t('auth.mustBe18')}</Text>}

          <Button title={loading ? t('common.loading') : mode === 'login' ? t('auth.signIn') : mode === 'signup' ? t('auth.createAccount') : t('auth.resetPassword')} onPress={handleSubmit} loading={loading} style={{ marginTop: 8 }} />
        </View>

        <View style={styles.footer}>
          {mode === 'login' && (
            <TouchableOpacity onPress={() => { setMode('reset'); setError(''); }}>
              <Text style={[styles.link, { color: colors.primary }]}>{t('auth.forgotPassword')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}>
            <Text style={[styles.link, { color: colors.primary }]}>
              {mode === 'login' ? t('auth.noAccount') + ' ' + t('auth.signup') : mode === 'signup' ? t('auth.haveAccount') + ' ' + t('auth.login') : ''}
            </Text>
          </TouchableOpacity>
          {mode === 'reset' && (
            <TouchableOpacity onPress={() => { setMode('login'); setError(''); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <ArrowLeft size={16} color={colors.primary} />
              <Text style={[styles.link, { color: colors.primary }]}>{t('auth.backToLogin')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Input({ label, value, onChange, colors, secure, keyboardType, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  colors: ReturnType<typeof useTheme>['colors']; secure?: boolean; keyboardType?: 'default' | 'email-address'; placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}
        value={value}
        onChangeText={onChange}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
      />
    </View>
  );
}

function ChoiceGroup({ label, options, value, onChange, colors, columns = 3 }: {
  label: string; options: { v: string; l: string }[]; value: string;
  onChange: (v: string) => void; colors: ReturnType<typeof useTheme>['colors']; columns?: number;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((o) => (
          <TouchableOpacity
            key={o.v}
            onPress={() => onChange(o.v)}
            style={[styles.choiceBtn, { borderColor: value === o.v ? colors.primary : colors.border, backgroundColor: value === o.v ? colors.primaryLight : 'transparent', minWidth: columns === 2 ? '47%' : undefined }]}
          >
            <Text style={{ color: value === o.v ? colors.primary : colors.textSecondary, fontSize: 14, fontWeight: '500' }}>{o.l}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText: { fontSize: 24, fontWeight: '800' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  errorBox: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  errorText: { fontSize: 14, fontWeight: '500' },
  form: { gap: 12 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '500' },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  selectWrap: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  selectFake: { position: 'absolute', top: 10, left: 16, fontSize: 16, opacity: 0 },
  cityPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  choiceBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  hint: { fontSize: 12 },
  footer: { alignItems: 'center', gap: 12, marginTop: 24 },
  link: { fontSize: 14, fontWeight: '600' },
});
