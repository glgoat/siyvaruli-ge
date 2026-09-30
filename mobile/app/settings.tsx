import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Switch } from 'react-native';
import { User, Lock, Globe, Moon, Bell, Eye, Heart, Pause, Trash2, LogOut, ChevronRight, Shield, Navigation } from '@expo/vector-icons/build/Feather';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { useTheme } from '@/lib/theme-context';
import { supabase } from '@/lib/supabase';
import { getNearestCity } from '@/constants';
import { updateSetting, togglePause } from '@/services/profile';
import { AppModal } from '@/components/Modal';
import { Button } from '@/components/Button';

export default function SettingsScreen() {
  const { user, profile, settings, refreshProfile, refreshSettings, signOut } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const { theme, toggleTheme, colors } = useTheme();
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [locating, setLocating] = useState(false);

  const handleSetting = async (key: string, value: boolean | string) => {
    if (!user) return;
    await updateSetting(user.id, key, value);
    await refreshSettings();
  };

  const handleDelete = async () => {
    if (!user) return;
    await supabase.from('profiles').delete().eq('id', user.id);
    await signOut();
    router.replace('/');
  };

  const handleChangePassword = async () => {
    if (!user || !newPassword) return;
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return;
    setShowPassword(false);
    setNewPassword('');
  };

  const handlePause = async () => {
    if (!user || !profile) return;
    await togglePause(user.id, profile.is_paused);
    await refreshProfile();
  };

  const handleLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        if (user) {
          const nearest = getNearestCity(latitude, longitude);
          await supabase.from('profiles').update({ latitude, longitude, ...(nearest ? { city: nearest } : {}) }).eq('id', user.id);
          await refreshProfile();
        }
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 20000 }
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}><Text style={{ color: colors.primary, fontSize: 16 }}>{t('common.back')}</Text></Pressable>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>{t('settings.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 24 }} showsVerticalScrollIndicator={false}>
        {/* Account */}
        <Section title={t('settings.account')} colors={colors}>
          <Row icon={<User size={20} color={colors.textMuted} />} label={t('settings.editProfile')} colors={colors} onPress={() => router.push('/(tabs)/profile')} />
          <Row icon={<Lock size={20} color={colors.textMuted} />} label={t('settings.changePassword')} colors={colors} onPress={() => setShowPassword(true)} />
          <Row icon={<Shield size={20} color={colors.textMuted} />} label={t('profile.verify')} colors={colors} onPress={() => router.push('/verification')} />
        </Section>

        {/* Preferences */}
        <Section title={t('settings.preferences')} colors={colors}>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Globe size={20} color={colors.textMuted} /><Text style={{ fontSize: 15, fontWeight: '500', color: colors.text }}>{t('settings.language')}</Text></View>
            <View style={{ flexDirection: 'row', backgroundColor: colors.border, borderRadius: 20, padding: 3 }}>
              <Pressable onPress={() => setLang('ka')} style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 18, backgroundColor: lang === 'ka' ? colors.card : 'transparent' }}><Text style={{ color: lang === 'ka' ? colors.primary : colors.textMuted, fontSize: 13, fontWeight: '600' }}>ქართული</Text></Pressable>
              <Pressable onPress={() => setLang('en')} style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 18, backgroundColor: lang === 'en' ? colors.card : 'transparent' }}><Text style={{ color: lang === 'en' ? colors.primary : colors.textMuted, fontSize: 13, fontWeight: '600' }}>EN</Text></Pressable>
            </View>
          </View>
          <ToggleRow icon={<Moon size={20} color={colors.textMuted} />} label={t('settings.darkMode')} value={theme === 'dark'} onChange={toggleTheme} colors={colors} />
        </Section>

        {/* Notifications */}
        <Section title={t('settings.notifications')} colors={colors}>
          <ToggleRow icon={<Bell size={20} color={colors.textMuted} />} label={t('settings.matchNotifications')} value={settings?.match_notifications ?? true} onChange={(v) => handleSetting('match_notifications', v)} colors={colors} />
          <ToggleRow icon={<Bell size={20} color={colors.textMuted} />} label={t('settings.messageNotifications')} value={settings?.message_notifications ?? true} onChange={(v) => handleSetting('message_notifications', v)} colors={colors} />
          <ToggleRow icon={<Heart size={20} color={colors.textMuted} />} label={t('settings.likeNotifications')} value={settings?.like_notifications ?? true} onChange={(v) => handleSetting('like_notifications', v)} colors={colors} />
        </Section>

        {/* Discovery */}
        <Section title={t('settings.discovery')} colors={colors}>
          <Row icon={<Navigation size={20} color={locating ? colors.primary : colors.textMuted} />} label={t('discover.useMyLocation')} colors={colors} onPress={handleLocation} />
        </Section>

        {/* Privacy */}
        <Section title={t('settings.privacy')} colors={colors}>
          <ToggleRow icon={<Eye size={20} color={colors.textMuted} />} label={t('settings.showOnlineStatus')} value={settings?.show_online_status ?? true} onChange={(v) => handleSetting('show_online_status', v)} colors={colors} />
          <ToggleRow icon={<Eye size={20} color={colors.textMuted} />} label={t('settings.showInDiscovery')} value={settings?.show_in_discovery ?? true} onChange={(v) => handleSetting('show_in_discovery', v)} colors={colors} />
        </Section>

        {/* Account actions */}
        <Section title={t('settings.account')} colors={colors}>
          <Row icon={<Pause size={20} color={colors.textMuted} />} label={profile?.is_paused ? t('settings.resumeAccount') : t('settings.pauseAccount')} desc={t('settings.pauseAccountDesc')} colors={colors} onPress={handlePause} />
          <Row icon={<LogOut size={20} color={colors.textMuted} />} label={t('settings.logout')} colors={colors} onPress={signOut} />
          <Row icon={<Trash2 size={20} color={colors.error} />} label={t('settings.deleteAccount')} desc={t('settings.deleteAccountDesc')} colors={colors} danger onPress={() => setShowDelete(true)} />
        </Section>
      </ScrollView>

      <AppModal visible={showDelete} onClose={() => setShowDelete(false)} title={t('settings.deleteAccount')}>
        <View style={{ padding: 20, gap: 16 }}>
          <Text style={{ fontSize: 14, color: colors.textMuted }}>{t('settings.deleteWarning')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button title={t('common.cancel')} variant="secondary" onPress={() => setShowDelete(false)} />
            <Button title={t('settings.deleteConfirm')} variant="danger" onPress={handleDelete} />
          </View>
        </View>
      </AppModal>

      <AppModal visible={showPassword} onClose={() => setShowPassword(false)} title={t('settings.changePassword')}>
        <View style={{ padding: 20, gap: 12 }}>
          <TextInput style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.inputBg, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: colors.text }} value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder={t('settings.newPassword')} placeholderTextColor={colors.textMuted} />
          <Button title={t('settings.changePassword')} onPress={handleChangePassword} disabled={newPassword.length < 6} />
        </View>
      </AppModal>
    </View>
  );
}

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View>
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 8, paddingHorizontal: 4, textTransform: 'uppercase' }}>{title}</Text>
      <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>{children}</View>
    </View>
  );
}

function Row({ icon, label, desc, onPress, danger, colors }: { icon: React.ReactNode; label: string; desc?: string; onPress: () => void; danger?: boolean; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <Pressable onPress={onPress} style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
        {icon}
        <View>
          <Text style={{ fontSize: 15, fontWeight: '500', color: danger ? colors.error : colors.text }}>{label}</Text>
          {desc && <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{desc}</Text>}
        </View>
      </View>
      <ChevronRight size={18} color={colors.textMuted} />
    </Pressable>
  );
}

function ToggleRow({ icon, label, value, onChange, colors }: { icon: React.ReactNode; label: string; value: boolean; onChange: (v: boolean) => void; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
        {icon}
        <Text style={{ fontSize: 15, fontWeight: '500', color: colors.text }}>{label}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#fff" />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, paddingTop: 50 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
});
