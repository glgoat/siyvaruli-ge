import { useState } from 'react';
import { Heart, ArrowLeft, Mail } from 'lucide-react';
import { Link, useRouter } from '@/lib/router';
import { useLanguage } from '@/lib/language-context';
import { useToast } from '@/lib/toast-context';
import { supabase } from '@/lib/supabase';
import { GEORGIAN_CITIES, is18Plus } from '@/lib/constants';
import type { TranslationKey } from '@/lib/i18n';

export function AuthPage({ mode }: { mode: 'login' | 'signup' | 'reset' }) {
  const { t } = useLanguage();
  const { navigate } = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [interestedIn, setInterestedIn] = useState('');
  const [city, setCity] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup') {
      if (!email || !password || !firstName || !dob || !gender || !interestedIn || !city) {
        setError(t('auth.required'));
        return;
      }
      if (!is18Plus(dob)) {
        setError(t('auth.mustBe18'));
        return;
      }
      if (password.length < 6) {
        setError(t('auth.passwordMinLength'));
        return;
      }
      if (password !== confirmPassword) {
        setError(t('auth.passwordMismatch'));
        return;
    }

      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { first_name: firstName, city },
        },
      });

      if (error) {
        setError(error.message.includes('already') ? t('auth.emailExists') : error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').update({
          first_name: firstName,
          date_of_birth: dob,
          gender,
          interested_in: interestedIn,
          city,
        }).eq('id', data.user.id);

        if (profileError) console.error('Profile update error:', profileError);
      }

      showToast(mode === 'signup' ? t('auth.createAccount') : '', 'success');
      navigate('/onboarding');
      return;
    }

    if (mode === 'login') {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(t('auth.loginError'));
        setLoading(false);
        return;
      }
      navigate('/discover');
      return;
    }

    if (mode === 'reset') {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      showToast(t('auth.resetLinkSent'), 'success');
      navigate('/login');
      return;
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const inputClass = 'input';
  const labelClass = 'label';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-primary-50/30 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
              <Heart size={22} className="text-white" fill="white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">siyvaruli<span className="text-primary-500">.ge</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {mode === 'login' ? t('auth.login') : mode === 'signup' ? t('auth.signup') : t('auth.resetPassword')}
          </h1>
        </div>

        <div className="card p-6 md:p-8">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-error-50 dark:bg-error-900/30 text-error-600 dark:text-error-400 text-sm font-medium animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className={labelClass}>{t('auth.firstName')}</label>
                  <input className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} type="text" required />
                </div>
                <div>
                  <label className={labelClass}>{t('auth.dob')}</label>
                  <input className={inputClass} value={dob} onChange={(e) => setDob(e.target.value)} type="date" required />
                </div>
                <div>
                  <label className={labelClass}>{t('auth.gender')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: 'male', label: t('auth.male') },
                      { value: 'female', label: t('auth.female') },
                      { value: 'other', label: t('auth.other') },
                    ] as const).map((g) => (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => setGender(g.value)}
                        className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${gender === g.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{t('auth.interestedIn')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: 'men', label: t('auth.men') },
                      { value: 'women', label: t('auth.women') },
                      { value: 'everyone', label: t('auth.everyone') },
                    ] as const).map((g) => (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => setInterestedIn(g.value)}
                        className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${interestedIn === g.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{t('auth.city')}</label>
                  <select className={inputClass} value={city} onChange={(e) => setCity(e.target.value)} required>
                    <option value="">{t('auth.selectCity')}</option>
                    {GEORGIAN_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className={labelClass}>{t('auth.email')}</label>
              <input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="email" />
            </div>

            {mode !== 'reset' && (
              <div>
                <label className={labelClass}>{t('auth.password')}</label>
                <input className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} type="password" required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className={labelClass}>{t('auth.confirmPassword')}</label>
                <input className={inputClass} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" required />
              </div>
            )}

            {mode === 'signup' && (
              <p className="text-xs text-gray-400">{t('auth.mustBe18')}</p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? t('common.loading') : mode === 'login' ? t('auth.signIn') : mode === 'signup' ? t('auth.createAccount') : t('auth.resetPassword')}
            </button>
          </form>

          {mode === 'login' && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                <span className="text-xs text-gray-400">OR</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              </div>
              <button onClick={handleGoogleLogin} className="btn-secondary w-full">
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                {t('auth.googleLogin')}
              </button>
            </>
          )}

          {mode === 'login' && (
            <p className="text-center mt-4 text-sm">
              <Link to="/reset" className="text-primary-500 hover:underline">{t('auth.forgotPassword')}</Link>
            </p>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
          {mode === 'login' ? (
            <>{t('auth.noAccount')} <Link to="/signup" className="text-primary-500 font-semibold hover:underline">{t('auth.signup')}</Link></>
          ) : mode === 'signup' ? (
            <>{t('auth.haveAccount')} <Link to="/login" className="text-primary-500 font-semibold hover:underline">{t('auth.login')}</Link></>
          ) : (
            <Link to="/login" className="text-primary-500 font-semibold hover:underline inline-flex items-center gap-1"><ArrowLeft size={16} /> {t('auth.backToLogin')}</Link>
          )}
        </p>
      </div>
    </div>
  );
}

export { type TranslationKey };
