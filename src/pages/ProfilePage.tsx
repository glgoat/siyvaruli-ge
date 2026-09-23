import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, X, Edit2, Check, MapPin, Briefcase, GraduationCap, Ruler, Heart, Languages as LangIcon, BadgeCheck, Settings as SettingsIcon, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { useToast } from '@/lib/toast-context';
import { useRouter } from '@/lib/router';
import { supabase } from '@/lib/supabase';
import { calculateAge, isOnline, formatLastActive, GEORGIAN_CITIES, INTEREST_KEYS } from '@/lib/constants';
import type { Photo, Interest } from '@/lib/types';
import type { TranslationKey } from '@/lib/i18n';

export function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const { t, lang } = useLanguage();
  const { showToast } = useToast();
  const { navigate } = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    first_name: '',
    bio: '',
    city: '',
    occupation: '',
    education: '',
    height: 0,
    relationship_intention: '',
    languages: [] as string[],
  });

  const loadProfileData = useCallback(async () => {
    if (!user) return;
    const [{ data: photoData }, { data: interestData }] = await Promise.all([
      supabase.from('photos').select('*').eq('user_id', user.id).order('position'),
      supabase.from('user_interests').select('interests(*)').eq('user_id', user.id),
    ]);
    setPhotos(photoData || []);
    setInterests((interestData as unknown as { interests: Interest }[])?.map((ui) => ui.interests) || []);
  }, [user]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  useEffect(() => {
    if (profile) {
      setEditData({
        first_name: profile.first_name,
        bio: profile.bio,
        city: profile.city,
        occupation: profile.occupation || '',
        education: profile.education || '',
        height: profile.height || 0,
        relationship_intention: profile.relationship_intention || '',
        languages: profile.languages || [],
      });
    }
  }, [profile]);

  const age = calculateAge(profile?.date_of_birth || null);

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('nav.profile')}</h1>
        <div className="flex items-center gap-1">
          <button onClick={() => navigate('/verification')} className="btn-ghost btn-sm" title={t('profile.verify')}>
            <Shield size={20} />
          </button>
          <button onClick={() => navigate('/settings')} className="btn-ghost btn-sm">
            <SettingsIcon size={20} />
          </button>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="btn-ghost btn-sm">
              <Edit2 size={18} /> {t('profile.edit')}
            </button>
          ) : (
            <button
              onClick={async () => {
                await supabase.from('profiles').update({
                  first_name: editData.first_name,
                  bio: editData.bio,
                  city: editData.city,
                  occupation: editData.occupation || null,
                  education: editData.education || null,
                  height: editData.height || null,
                  relationship_intention: editData.relationship_intention || null,
                  languages: editData.languages,
                }).eq('id', user!.id);
                await refreshProfile();
                setEditing(false);
                showToast(t('settings.saved'), 'success');
              }}
              className="btn-primary btn-sm"
            >
              <Check size={18} /> {t('profile.save')}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Photo section */}
        <div className="mb-6">
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <PhotoSlot
                key={i}
                photo={photos[i]}
                index={i}
                isMain={i === 0}
                canEdit={editing}
                onDelete={() => photos[i] && deletePhoto(photos[i].id, user!.id, setPhotos)}
                onUpload={editing ? (file) => uploadPhoto(file, user!.id, i, setPhotos) : undefined}
                t={t}
              />
            ))}
          </div>
        </div>

        {/* Profile info */}
        <div className="card p-6 mb-4">
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="label">{t('auth.firstName')}</label>
                <input className="input" value={editData.first_name} onChange={(e) => setEditData({ ...editData, first_name: e.target.value })} />
              </div>
              <div>
                <label className="label">{t('auth.city')}</label>
                <select className="input" value={editData.city} onChange={(e) => setEditData({ ...editData, city: e.target.value })}>
                  <option value="">--</option>
                  {GEORGIAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{t('auth.bio')}</label>
                <textarea className="input min-h-[100px] resize-none" value={editData.bio} onChange={(e) => setEditData({ ...editData, bio: e.target.value })} maxLength={500} />
              </div>
              <div>
                <label className="label">{t('profile.occupation')}</label>
                <input className="input" value={editData.occupation} onChange={(e) => setEditData({ ...editData, occupation: e.target.value })} />
              </div>
              <div>
                <label className="label">{t('profile.education')}</label>
                <input className="input" value={editData.education} onChange={(e) => setEditData({ ...editData, education: e.target.value })} />
              </div>
              <div>
                <label className="label">{t('profile.height')} (cm)</label>
                <input type="number" className="input" value={editData.height || ''} onChange={(e) => setEditData({ ...editData, height: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">{t('profile.intention')}</label>
                <select className="input" value={editData.relationship_intention} onChange={(e) => setEditData({ ...editData, relationship_intention: e.target.value })}>
                  <option value="">--</option>
                  <option value="serious">{t('intention.serious')}</option>
                  <option value="casual">{t('intention.casual')}</option>
                  <option value="friendship">{t('intention.friendship')}</option>
                  <option value="not_sure">{t('intention.not_sure')}</option>
                </select>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.first_name}</h2>
                {age && <span className="text-xl text-gray-500">{age}</span>}
                {profile.is_verified && (
                  <span className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 mb-4">{formatLastActive(profile.last_active, lang)}</p>

              {profile.bio && <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">{profile.bio}</p>}

              <div className="grid grid-cols-2 gap-3">
                {profile.city && <InfoItem icon={<MapPin size={16} />} label={t('profile.basicInfo')} value={profile.city} />}
                {profile.occupation && <InfoItem icon={<Briefcase size={16} />} label={t('profile.occupation')} value={profile.occupation} />}
                {profile.education && <InfoItem icon={<GraduationCap size={16} />} label={t('profile.education')} value={profile.education} />}
                {profile.height && <InfoItem icon={<Ruler size={16} />} label={t('profile.height')} value={`${profile.height} cm`} />}
                {profile.relationship_intention && <InfoItem icon={<Heart size={16} />} label={t('profile.intention')} value={t(`intention.${profile.relationship_intention}` as TranslationKey)} />}
                {profile.languages?.length > 0 && <InfoItem icon={<LangIcon size={16} />} label={t('profile.languages')} value={profile.languages.join(', ')} />}
              </div>
            </>
          )}
        </div>

        {/* Interests */}
        <div className="card p-6 mb-4">
          <h3 className="font-semibold mb-3">{t('profile.interests')}</h3>
          {editing ? (
            <div className="flex flex-wrap gap-2">
              {INTEREST_KEYS.map((key) => {
                const isSelected = interests.some((i) => i.key === key);
                return (
                  <button
                    key={key}
                    onClick={async () => {
                      if (isSelected) {
                        const interest = interests.find((i) => i.key === key);
                        if (interest) {
                          await supabase.from('user_interests').delete().eq('user_id', user!.id).eq('interest_id', interest.id);
                          setInterests(interests.filter((i) => i.key !== key));
                        }
                      } else {
                        const { data } = await supabase.from('interests').select('*').eq('key', key).maybeSingle();
                        if (data) {
                          await supabase.from('user_interests').insert({ user_id: user!.id, interest_id: data.id });
                          setInterests([...interests, data]);
                        }
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${isSelected ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
                  >
                    {t(`interest.${key}` as TranslationKey)}
                  </button>
                );
              })}
            </div>
          ) : interests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <span key={interest.id} className="badge bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400">
                  {t(`interest.${interest.key}` as TranslationKey)}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">--</p>
          )}
        </div>

        {/* Verification status */}
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${profile.verification_status === 'verified' ? 'bg-success-50 dark:bg-success-700/20 text-success-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
              <BadgeCheck size={22} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {profile.verification_status === 'verified' ? t('profile.verified') : profile.verification_status === 'pending' ? t('profile.verificationPending') : t('profile.unverified')}
              </p>
              {profile.verification_status === 'unverified' && (
                <button onClick={() => navigate('/verification')} className="text-sm text-primary-500 hover:underline">
                  {t('profile.verify')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

async function uploadPhoto(file: File, userId: string, position: number, setPhotos: React.Dispatch<React.SetStateAction<Photo[]>>) {
  const ext = file.name.split('.').pop();
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('profile-photos').upload(path, file);
  if (error) return;
  const { data: { publicUrl } } = supabase.storage.from('profile-photos').getPublicUrl(path);
  const { data } = await supabase.from('photos').insert({ user_id: userId, url: publicUrl, position }).select().single();
  if (data) setPhotos((prev) => [...prev, data as Photo].sort((a, b) => a.position - b.position));
}

async function deletePhoto(photoId: string, userId: string, setPhotos: React.Dispatch<React.SetStateAction<Photo[]>>) {
  await supabase.from('photos').delete().eq('id', photoId);
  setPhotos((prev) => prev.filter((p) => p.id !== photoId));
}

function PhotoSlot({ photo, index, isMain, canEdit, onDelete, onUpload, t }: {
  photo?: Photo;
  index: number;
  isMain: boolean;
  canEdit: boolean;
  onDelete?: () => void;
  onUpload?: (file: File) => void;
  t: (k: TranslationKey) => string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 group">
      {photo ? (
        <>
          <img src={photo.url} alt="" className="w-full h-full object-cover" />
          {isMain && <span className="absolute top-1 left-1 text-[10px] bg-primary-500 text-white px-1.5 py-0.5 rounded font-medium">{t('common.main')}</span>}
          {canEdit && (
            <button onClick={onDelete} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <X size={14} />
            </button>
          )}
        </>
      ) : (
        canEdit && (
          <button onClick={() => fileRef.current?.click()} className="w-full h-full flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Camera size={20} />
            <span className="text-[10px] mt-1">+</span>
          </button>
        )
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && onUpload) onUpload(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
      <span className="text-primary-500 mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
