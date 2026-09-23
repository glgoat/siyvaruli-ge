import { useState, useRef, useCallback } from 'react';
import { Shield, Camera, CheckCircle2, Clock, XCircle, Upload } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { useToast } from '@/lib/toast-context';
import { useRouter } from '@/lib/router';
import { supabase } from '@/lib/supabase';

export function VerificationPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const { navigate } = useRouter();
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/verification-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('verification-photos').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('verification-photos').getPublicUrl(path);
      setSelfieUrl(publicUrl);
    } catch {
      showToast('Upload failed', 'error');
    }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!user || !selfieUrl) return;
    setSubmitting(true);
    try {
      await supabase.from('verification_requests').insert({
        user_id: user.id,
        selfie_photo_url: selfieUrl,
        notes,
      });
      await supabase.from('profiles').update({
        verification_status: 'pending',
      }).eq('id', user.id);
      await refreshProfile();
      showToast(t('verification.pending'), 'success');
      navigate('/profile');
    } catch {
      showToast('Error', 'error');
    }
    setSubmitting(false);
  };

  const status = profile?.verification_status || 'unverified';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('verification.title')}</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Status banner */}
        <div className={`card p-6 mb-6 text-center ${status === 'verified' ? 'border-success-200 dark:border-success-700' : status === 'pending' ? 'border-warning-200 dark:border-warning-700' : ''}`}>
          <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${status === 'verified' ? 'bg-success-50 dark:bg-success-700/20 text-success-500' : status === 'pending' ? 'bg-warning-50 dark:bg-warning-700/20 text-warning-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
            {status === 'verified' ? <CheckCircle2 size={32} /> : status === 'pending' ? <Clock size={32} /> : status === 'rejected' ? <XCircle size={32} /> : <Shield size={32} />}
          </div>
          <h2 className="text-lg font-bold mb-1">
            {status === 'verified' ? t('verification.approved') : status === 'pending' ? t('verification.pending') : status === 'rejected' ? t('verification.rejected') : t('profile.unverified')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('verification.desc')}</p>
        </div>

        {/* Form */}
        {status === 'unverified' || status === 'rejected' ? (
          <div className="card p-6">
            <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            <label className="label">{t('verification.selfie')}</label>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-8 flex flex-col items-center gap-3 text-gray-500 hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-950/30 transition-colors mb-4"
            >
              {selfieUrl ? (
                <img src={selfieUrl} alt="" className="w-32 h-32 rounded-full object-cover" />
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full bg-primary-50 dark:bg-primary-950 flex items-center justify-center text-primary-500">
                    <Camera size={28} />
                  </div>
                  <span className="font-medium">{uploading ? t('common.loading') : t('verification.uploadSelfie')}</span>
                </>
              )}
            </button>

            <div>
              <label className="label">{t('report.description')}</label>
              <textarea className="input min-h-[80px] resize-none" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
            </div>

            <button onClick={handleSubmit} disabled={!selfieUrl || submitting} className="btn-primary w-full mt-4">
              {submitting ? t('common.loading') : t('verification.submit')}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
