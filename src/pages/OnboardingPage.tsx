import { useState, useRef } from 'react';
import { Upload, X, ArrowRight, ArrowLeft, Check, Camera } from 'lucide-react';
import { useRouter } from '@/lib/router';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { useToast } from '@/lib/toast-context';
import { supabase } from '@/lib/supabase';
import { INTEREST_KEYS } from '@/lib/constants';
import type { TranslationKey } from '@/lib/i18n';

export function OnboardingPage() {
  const { navigate } = useRouter();
  const { user, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [bio, setBio] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const steps = [
    { title: t('onboarding.welcome'), desc: t('onboarding.welcomeDesc') },
    { title: t('onboarding.photos'), desc: t('onboarding.addPhotosDesc') },
    { title: t('onboarding.aboutYou'), desc: t('onboarding.selectInterestsDesc') },
  ];

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;
    setUploading(true);
    try {
      for (const file of Array.from(files).slice(0, 6 - photos.length)) {
        const ext = file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(path, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(path);
        setPhotos((prev) => [...prev, publicUrl]);
      }
    } catch {
      showToast('Upload failed', 'error');
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removePhoto = (url: string) => {
    setPhotos((prev) => prev.filter((p) => p !== url));
  };

  const toggleInterest = (key: string) => {
    setSelectedInterests((prev) =>
      prev.includes(key) ? prev.filter((i) => i !== key) : prev.length < 8 ? [...prev, key] : prev
    );
  };

  const handleFinish = async () => {
    if (!user) return;

    try {
      // Save photos
      for (let i = 0; i < photos.length; i++) {
        await supabase.from('photos').insert({
          user_id: user.id,
          url: photos[i],
          position: i,
        });
      }

      // Save bio
      await supabase.from('profiles').update({
        bio,
        profile_completed: true,
      }).eq('id', user.id);

      // Save interests
      if (selectedInterests.length > 0) {
        const { data: interestRows } = await supabase
          .from('interests')
          .select('id, key')
          .in('key', selectedInterests);
        if (interestRows) {
          await supabase.from('user_interests').insert(
            interestRows.map((r) => ({ user_id: user.id, interest_id: r.id }))
          );
        }
      }

      await refreshProfile();
      showToast(t('onboarding.complete'), 'success');
      navigate('/discover');
    } catch {
      showToast('Error saving profile', 'error');
    }
  };

  const canProceed = () => {
    if (step === 1) return photos.length > 0;
    if (step === 2) return selectedInterests.length >= 3;
    return true;
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      {/* Progress bar */}
      <div className="px-6 pt-6">
        <div className="flex items-center gap-2">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-800'}`} />
          ))}
        </div>
        <p className="text-sm text-gray-400 mt-2">{t('auth.step')} {step + 1} {t('auth.of')} {steps.length}</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-lg mx-auto w-full">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{steps[step].title}</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-center">{steps[step].desc}</p>

        {step === 0 && (
          <div className="w-full space-y-4">
            <div>
              <label className="label">{t('auth.bio')}</label>
              <textarea
                className="input min-h-[120px] resize-none"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={500}
                placeholder="..."
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{bio.length}/500</p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="w-full">
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading || photos.length >= 6}
              className="w-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-8 flex flex-col items-center gap-3 text-gray-500 hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-950/30 transition-colors"
            >
              <div className="w-14 h-14 rounded-full bg-primary-50 dark:bg-primary-950 flex items-center justify-center text-primary-500">
                <Camera size={28} />
              </div>
              <span className="font-medium">{uploading ? t('common.loading') : t('onboarding.uploadPhoto')}</span>
            </button>
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {photos.map((url, i) => (
                  <div key={url} className="relative aspect-square rounded-xl overflow-hidden group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => removePhoto(url)} className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={14} />
                    </button>
                    {i === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1">
                        <span className="text-[10px] text-white font-medium">Main</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="w-full">
            <div className="flex flex-wrap gap-2 justify-center">
              {INTEREST_KEYS.map((key) => {
                const isSelected = selectedInterests.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleInterest(key)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isSelected ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                  >
                    {t(`interest.${key}` as TranslationKey)}
                  </button>
                );
              })}
            </div>
            <p className="text-center text-sm text-gray-400 mt-4">{selectedInterests.length}/8</p>
          </div>
        )}

        <div className="flex items-center justify-between w-full mt-8">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="btn-ghost">
              <ArrowLeft size={20} /> {t('common.back')}
            </button>
          ) : <div />}
          {step < steps.length - 1 ? (
            <button onClick={() => canProceed() && setStep(step + 1)} disabled={!canProceed()} className="btn-primary">
              {t('auth.continue')} <ArrowRight size={20} />
            </button>
          ) : (
            <button onClick={handleFinish} disabled={!canProceed()} className="btn-primary">
              <Check size={20} /> {t('onboarding.finish')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
