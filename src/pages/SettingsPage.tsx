import { useState } from 'react';
import { User, Lock, Globe, Moon, Bell, Eye, Heart, Pause, Trash2, LogOut, ChevronRight, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { useTheme } from '@/lib/theme-context';
import { useToast } from '@/lib/toast-context';
import { useRouter } from '@/lib/router';
import { supabase } from '@/lib/supabase';
import { Modal, ModalBody } from '@/components/ui/Modal';
import type { TranslationKey } from '@/lib/i18n';

export function SettingsPage() {
  const { user, profile, settings, refreshProfile, refreshSettings, signOut } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const { navigate } = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const updateSetting = async (key: string, value: boolean | string) => {
    if (!user) return;
    await supabase.from('user_settings').update({ [key]: value }).eq('user_id', user.id);
    await refreshSettings();
    showToast(t('settings.saved'), 'success');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    await supabase.from('profiles').delete().eq('id', user.id);
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleChangePassword = async () => {
    if (!user || !newPassword) return;
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      showToast(error.message, 'error');
      return;
    }
    setShowPassword(false);
    setCurrentPassword('');
    setNewPassword('');
    showToast(t('settings.passwordChanged'), 'success');
  };

  const togglePause = async () => {
    if (!user || !profile) return;
    await supabase.from('profiles').update({ is_paused: !profile.is_paused }).eq('id', user.id);
    await refreshProfile();
    showToast(t('settings.saved'), 'success');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
        {/* Account */}
        <Section title={t('settings.account')}>
          <SettingRow icon={<User size={20} />} label={t('settings.editProfile')} onClick={() => navigate('/profile')} />
          <SettingRow icon={<Lock size={20} />} label={t('settings.changePassword')} onClick={() => setShowPassword(true)} />
          <SettingRow icon={<Shield size={20} />} label={t('profile.verify')} onClick={() => navigate('/verification')} />
        </Section>

        {/* Preferences */}
        <Section title={t('settings.preferences')}>
          <div className="px-4 py-3">
            <div className="flex items-center gap-3 mb-3">
              <Globe size={20} className="text-gray-400" />
              <span className="flex-1 text-sm font-medium">{t('settings.language')}</span>
            </div>
            <div className="flex items-center rounded-full bg-gray-100 dark:bg-gray-800 p-0.5 text-sm ml-8">
              <button onClick={() => setLang('ka')} className={`px-3 py-1 rounded-full font-medium transition-colors ${lang === 'ka' ? 'bg-white dark:bg-gray-700 text-primary-500 shadow-sm' : 'text-gray-500'}`}>ქართული</button>
              <button onClick={() => setLang('en')} className={`px-3 py-1 rounded-full font-medium transition-colors ${lang === 'en' ? 'bg-white dark:bg-gray-700 text-primary-500 shadow-sm' : 'text-gray-500'}`}>English</button>
            </div>
          </div>
          <ToggleRow icon={<Moon size={20} />} label={t('settings.darkMode')} value={theme === 'dark'} onChange={toggleTheme} />
        </Section>

        {/* Notifications */}
        <Section title={t('settings.notifications')}>
          <ToggleRow icon={<Bell size={20} />} label={t('settings.matchNotifications')} value={settings?.match_notifications ?? true} onChange={(v) => updateSetting('match_notifications', v)} />
          <ToggleRow icon={<Bell size={20} />} label={t('settings.messageNotifications')} value={settings?.message_notifications ?? true} onChange={(v) => updateSetting('message_notifications', v)} />
          <ToggleRow icon={<Heart size={20} />} label={t('settings.likeNotifications')} value={settings?.like_notifications ?? true} onChange={(v) => updateSetting('like_notifications', v)} />
        </Section>

        {/* Privacy */}
        <Section title={t('settings.privacy')}>
          <ToggleRow icon={<Eye size={20} />} label={t('settings.showOnlineStatus')} value={settings?.show_online_status ?? true} onChange={(v) => updateSetting('show_online_status', v)} />
          <ToggleRow icon={<Eye size={20} />} label={t('settings.showInDiscovery')} value={settings?.show_in_discovery ?? true} onChange={(v) => updateSetting('show_in_discovery', v)} />
        </Section>

        {/* Account actions */}
        <Section title={t('settings.account')}>
          <SettingRow icon={<Pause size={20} />} label={profile?.is_paused ? t('settings.resumeAccount') : t('settings.pauseAccount')} desc={t('settings.pauseAccountDesc')} onClick={togglePause} />
          <SettingRow icon={<LogOut size={20} />} label={t('settings.logout')} onClick={signOut} />
          <SettingRow icon={<Trash2 size={20} />} label={t('settings.deleteAccount')} desc={t('settings.deleteAccountDesc')} danger onClick={() => setShowDelete(true)} />
        </Section>
      </div>

      {/* Delete modal */}
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)}>
        <ModalBody className="p-6">
          <h2 className="text-lg font-bold mb-2">{t('settings.deleteAccount')}</h2>
          <p className="text-sm text-gray-500 mb-4">{t('settings.deleteWarning')}</p>
          <div className="flex gap-2">
            <button onClick={() => setShowDelete(false)} className="btn-secondary flex-1">{t('common.cancel')}</button>
            <button onClick={handleDeleteAccount} className="btn-danger flex-1">{t('settings.deleteConfirm')}</button>
          </div>
        </ModalBody>
      </Modal>

      {/* Password modal */}
      <Modal isOpen={showPassword} onClose={() => setShowPassword(false)}>
        <ModalBody className="p-6">
          <h2 className="text-lg font-bold mb-4">{t('settings.changePassword')}</h2>
          <div className="space-y-3">
            <div>
              <label className="label">{t('settings.newPassword')}</label>
              <input type="password" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
          </div>
          <button onClick={handleChangePassword} disabled={newPassword.length < 6} className="btn-primary w-full mt-4">
            {t('settings.changePassword')}
          </button>
        </ModalBody>
      </Modal>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide px-1">{title}</h2>
      <div className="card overflow-hidden">{children}</div>
    </div>
  );
}

function SettingRow({ icon, label, desc, onClick, danger }: { icon: React.ReactNode; label: string; desc?: string; onClick?: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left border-b border-gray-100 dark:border-gray-800 last:border-0 ${danger ? 'text-error-500' : 'text-gray-900 dark:text-gray-100'}`}>
      <span className={danger ? 'text-error-500' : 'text-gray-400'}>{icon}</span>
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
      </div>
      <ChevronRight size={18} className="text-gray-300" />
    </button>
  );
}

function ToggleRow({ icon, label, value, onChange }: { icon: React.ReactNode; label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-gray-400">{icon}</span>
      <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-700'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

export { type TranslationKey };
