import { useState, useEffect, useCallback, useRef } from 'react';
import { Heart, X, Undo, SlidersHorizontal, Info, MapPin, Briefcase, GraduationCap, Ruler, Languages as LangIcon, Sparkles, Navigation } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { useToast } from '@/lib/toast-context';
import { supabase } from '@/lib/supabase';
import { calculateAge, GEORGIAN_CITIES, isOnline, formatLastActive, getCityCoordinates, calculateDistance, formatDistance } from '@/lib/constants';
import type { DiscoveryProfile } from '@/lib/types';
import type { TranslationKey } from '@/lib/i18n';
import { EmptyState } from '@/components/ui/Feedback';
import { Modal, ModalBody } from '@/components/ui/Modal';

export function DiscoverPage() {
  const { user, profile, settings, refreshProfile } = useAuth();
  const { t, lang } = useLanguage();
  const { showToast } = useToast();
  const [profiles, setProfiles] = useState<DiscoveryProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [lastSwipe, setLastSwipe] = useState<{ targetId: string; type: 'like' | 'pass' } | null>(null);
  const [matchData, setMatchData] = useState<{ name: string; photo: string } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Filter state
  const [ageMin, setAgeMin] = useState(settings?.discovery_age_min || 18);
  const [ageMax, setAgeMax] = useState(settings?.discovery_age_max || 99);
  const [cityFilter, setCityFilter] = useState(settings?.discovery_city || '');
  const [intentionFilter, setIntentionFilter] = useState(settings?.discovery_intention || '');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(
    profile?.latitude && profile?.longitude
      ? { lat: profile.latitude, lng: profile.longitude }
      : profile?.city ? getCityCoordinates(profile.city) : null
  );
  const [locating, setLocating] = useState(false);

  const loadProfiles = useCallback(async () => {
    if (!user || !profile) return;
    setLoading(true);

    const genderFilter = profile.interested_in === 'men' ? 'male' : profile.interested_in === 'women' ? 'female' : null;
    const cityToFilter = cityFilter || profile.city;

    let query = supabase
      .from('profiles')
      .select(`
        *,
        photos:photos(*),
        user_interests:user_interests(interest_id)
      `)
      .neq('id', user.id)
      .eq('is_paused', false)
      .eq('is_suspended', false)
      .neq('profile_completed', false);

    if (genderFilter) {
      query = query.eq('gender', genderFilter);
    }

    // Filter by who is interested in my gender
    if (profile.gender === 'male') {
      query = query.in('interested_in', ['men', 'everyone']);
    } else if (profile.gender === 'female') {
      query = query.in('interested_in', ['women', 'everyone']);
    }

    if (cityToFilter) {
      query = query.eq('city', cityToFilter);
    }

    if (intentionFilter) {
      query = query.eq('relationship_intention', intentionFilter);
    }

    const { data, error } = await query.order('last_active', { ascending: false }).limit(20);

    if (error || !data) {
      setLoading(false);
      return;
    }

    // Determine user's location for distance calculation
    const myLat = userLocation?.lat ?? profile?.latitude ?? null;
    const myLng = userLocation?.lng ?? profile?.longitude ?? null;
    const fallbackCoords = profile?.city ? getCityCoordinates(profile.city) : null;
    const effectiveLat = myLat ?? fallbackCoords?.lat ?? null;
    const effectiveLng = myLng ?? fallbackCoords?.lng ?? null;

    // Filter out already liked/passed
    const profileIds = data.map((p) => p.id);
    const [likedRes, passedRes] = await Promise.all([
      supabase.from('likes').select('liked_id').in('liked_id', profileIds).eq('liker_id', user.id),
      supabase.from('passes').select('passed_id').in('passed_id', profileIds).eq('passer_id', user.id),
    ]);

    const likedIds = new Set(likedRes.data?.map((l) => l.liked_id) || []);
    const passedIds = new Set(passedRes.data?.map((p) => p.passed_id) || []);

    // Also check who liked me for mutual match detection
    const likedMeRes = await supabase.from('likes').select('liker_id').in('liker_id', profileIds).eq('liked_id', user.id);
    const likedMeIds = new Set(likedMeRes.data?.map((l) => l.liker_id) || []);

    const filtered = data
      .filter((p) => !likedIds.has(p.id) && !passedIds.has(p.id))
      .filter((p) => {
        const age = calculateAge(p.date_of_birth);
        if (age === null) return false;
        return age >= ageMin && age <= ageMax;
      })
      .map((p) => {
        const profileLat = p.latitude ?? (p.city ? getCityCoordinates(p.city)?.lat ?? null : null);
        const profileLng = p.longitude ?? (p.city ? getCityCoordinates(p.city)?.lng ?? null : null);
        let distance: number | null = null;
        if (effectiveLat !== null && effectiveLng !== null && profileLat !== null && profileLng !== null) {
          distance = calculateDistance(effectiveLat, effectiveLng, profileLat, profileLng);
        }
        return {
          ...p,
          age: calculateAge(p.date_of_birth) || 0,
          photo_count: p.photos?.length || 0,
          has_liked_me: likedMeIds.has(p.id),
          distance,
        };
      }) as DiscoveryProfile[];

    setProfiles(filtered);
    setCurrentIndex(0);
    setLoading(false);
  }, [user, profile, cityFilter, intentionFilter, ageMin, ageMax, userLocation]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!user || currentIndex >= profiles.length) return;
    const target = profiles[currentIndex];
    setExitDirection(direction);
    setLastSwipe({ targetId: target.id, type: direction === 'right' ? 'like' : 'pass' });

    if (direction === 'right') {
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('liker_id', target.id)
        .eq('liked_id', user.id)
        .maybeSingle();

      await supabase.from('likes').insert({ liker_id: user.id, liked_id: target.id });

      if (existingLike) {
        // It's a mutual match! The trigger will create the match.
        setMatchData({ name: target.first_name, photo: target.photos?.[0]?.url || '' });
      }

      // Save undo info
      await supabase.from('user_settings').update({
        last_swipe_type: 'like',
        last_swipe_target: target.id,
        last_swipe_at: new Date().toISOString(),
      }).eq('user_id', user.id);
    } else {
      await supabase.from('passes').insert({ passer_id: user.id, passed_id: target.id });
      await supabase.from('user_settings').update({
        last_swipe_type: 'pass',
        last_swipe_target: target.id,
        last_swipe_at: new Date().toISOString(),
      }).eq('user_id', user.id);
    }

    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setExitDirection(null);
    }, 300);
  };

  const handleUndo = async () => {
    if (!user || !lastSwipe) return;
    if (lastSwipe.type === 'like') {
      await supabase.from('likes').delete().eq('liker_id', user.id).eq('liked_id', lastSwipe.targetId);
    } else {
      await supabase.from('passes').delete().eq('passer_id', user.id).eq('passed_id', lastSwipe.targetId);
    }
    setLastSwipe(null);
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX, y: clientY });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragStart) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragOffset({ x: clientX - dragStart.x, y: clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    if (!dragStart) return;
    if (dragOffset.x > 100) {
      handleSwipe('right');
    } else if (dragOffset.x < -100) {
      handleSwipe('left');
    }
    setDragStart(null);
    setDragOffset({ x: 0, y: 0 });
  };

  const applyFilters = () => {
    setShowFilters(false);
    loadProfiles();
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      showToast(t('discover.locationError'), 'error');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        if (user) {
          await supabase.from('profiles').update({
            latitude,
            longitude,
          }).eq('id', user.id);
          await refreshProfile();
        }
        setLocating(false);
        showToast(t('settings.saved'), 'success');
      },
      () => {
        showToast(t('discover.locationError'), 'error');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const currentProfile = profiles[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('discover.title')}</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={handleUseMyLocation}
            disabled={locating}
            className="btn-ghost btn-sm"
            title={t('discover.useMyLocation')}
          >
            <Navigation size={18} className={locating ? 'animate-pulse' : ''} />
          </button>
          <button onClick={() => setShowFilters(true)} className="btn-ghost btn-sm">
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4">
        {loading ? (
          <div className="aspect-[3/4] rounded-3xl skeleton" />
        ) : !currentProfile ? (
          <EmptyState
            icon={<Heart size={32} />}
            title={t('discover.noMore')}
            description={t('discover.noMoreDesc')}
          />
        ) : (
          <>
            {/* Swipe card */}
            <div className="relative">
              {profiles.slice(currentIndex, currentIndex + 2).reverse().map((p, idx) => {
                const isTop = idx === (Math.min(1, profiles.length - currentIndex - 1));
                const rotation = dragOffset.x * 0.05;
                const opacity = isTop ? 1 : 0.5;
                const scale = isTop ? 1 : 0.95;

                if (isTop && exitDirection === 'left') {
                  return <SwipeCard key={p.id} profile={p} className="swipe-card-exit-left" lang={lang} t={t} />;
                }
                if (isTop && exitDirection === 'right') {
                  return <SwipeCard key={p.id} profile={p} className="swipe-card-exit-right" lang={lang} t={t} />;
                }

                return (
                  <div
                    key={p.id}
                    ref={isTop ? cardRef : null}
                    className={`absolute inset-0 ${isTop ? 'cursor-grab active:cursor-grabbing' : ''}`}
                    style={{
                      transform: isTop ? `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg) scale(${scale})` : `scale(${scale})`,
                      opacity,
                      zIndex: isTop ? 10 : 5,
                    }}
                    onMouseDown={isTop ? handleMouseDown : undefined}
                    onMouseMove={isTop ? handleMouseMove : undefined}
                    onMouseUp={isTop ? handleMouseUp : undefined}
                    onMouseLeave={isTop ? handleMouseUp : undefined}
                    onTouchStart={isTop ? handleMouseDown : undefined}
                    onTouchMove={isTop ? handleMouseMove : undefined}
                    onTouchEnd={isTop ? handleMouseUp : undefined}
                  >
                    <SwipeCard profile={p} lang={lang} t={t} onInfo={() => setShowProfile(true)} />
                  </div>
                );
              })}
              {/* Spacer for absolute positioning */}
              <div className="aspect-[3/4] invisible" />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={handleUndo}
                disabled={!lastSwipe}
                className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center text-yellow-500 hover:scale-110 active:scale-95 transition-transform disabled:opacity-40"
              >
                <Undo size={22} />
              </button>
              <button
                onClick={() => handleSwipe('left')}
                className="w-14 h-14 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center text-error-500 hover:scale-110 active:scale-95 transition-transform"
              >
                <X size={28} />
              </button>
              <button
                onClick={() => handleSwipe('right')}
                className="w-14 h-14 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center text-success-500 hover:scale-110 active:scale-95 transition-transform"
              >
                <Heart size={28} />
              </button>
              <button
                onClick={() => setShowProfile(true)}
                className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center text-blue-500 hover:scale-110 active:scale-95 transition-transform"
              >
                <Info size={22} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Filters modal */}
      <Modal isOpen={showFilters} onClose={() => setShowFilters(false)}>
        <ModalBody className="p-6">
          <h2 className="text-lg font-bold mb-4">{t('discover.filters')}</h2>
          <div className="space-y-4">
            <div>
              <label className="label">{t('discover.ageRange')}: {ageMin} - {ageMax}</label>
              <div className="flex items-center gap-3">
                <input type="range" min={18} max={99} value={ageMin} onChange={(e) => setAgeMin(Number(e.target.value))} className="flex-1 accent-primary-500" />
                <input type="range" min={18} max={99} value={ageMax} onChange={(e) => setAgeMax(Number(e.target.value))} className="flex-1 accent-primary-500" />
              </div>
            </div>
            <div>
              <label className="label">{t('discover.city')}</label>
              <select className="input" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
                <option value="">{t('discover.allCities')}</option>
                {GEORGIAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t('discover.intention')}</label>
              <select className="input" value={intentionFilter} onChange={(e) => setIntentionFilter(e.target.value)}>
                <option value="">{t('discover.allIntentions')}</option>
                <option value="serious">{t('intention.serious')}</option>
                <option value="casual">{t('intention.casual')}</option>
                <option value="friendship">{t('intention.friendship')}</option>
                <option value="not_sure">{t('intention.not_sure')}</option>
              </select>
            </div>
          </div>
          <button onClick={applyFilters} className="btn-primary w-full mt-6">{t('discover.apply')}</button>
        </ModalBody>
      </Modal>

      {/* Full profile modal */}
      {currentProfile && (
        <Modal isOpen={showProfile} onClose={() => setShowProfile(false)} className="max-w-lg">
          <ModalBody className="max-h-[85vh] overflow-y-auto">
            <FullProfile profile={currentProfile} lang={lang} t={t} />
          </ModalBody>
        </Modal>
      )}

      {/* Match modal */}
      {matchData && (
        <Modal isOpen={!!matchData} onClose={() => setMatchData(null)} showClose={false}>
          <div className="bg-gradient-to-b from-primary-500 to-primary-700 rounded-3xl p-8 text-center text-white animate-match-pop">
            <Sparkles size={48} className="mx-auto mb-4 animate-heart-beat" />
            <h2 className="text-3xl font-bold mb-2">{t('matches.newMatch')}</h2>
            <p className="text-primary-100 mb-6">{t('matches.youMatched')} {matchData.name}!</p>
            {matchData.photo && (
              <img src={matchData.photo} alt="" className="w-32 h-32 rounded-full object-cover mx-auto mb-6 border-4 border-white/30" />
            )}
            <div className="flex gap-3">
              <button onClick={() => { setMatchData(null); window.location.hash = '/messages'; }} className="btn bg-white text-primary-600 px-6 py-3 rounded-xl font-semibold flex-1 hover:bg-primary-50">
                {t('matches.sendMessage')}
              </button>
              <button onClick={() => setMatchData(null)} className="btn bg-white/20 text-white px-6 py-3 rounded-xl font-semibold flex-1 hover:bg-white/30">
                {t('common.close')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function SwipeCard({ profile, className = '', lang, t, onInfo }: { profile: DiscoveryProfile; className?: string; lang: 'ka' | 'en'; t: (k: TranslationKey) => string; onInfo?: () => void }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = profile.photos || [];
  const age = calculateAge(profile.date_of_birth);

  const handlePhotoNav = (e: React.MouseEvent, dir: 'prev' | 'next') => {
    e.stopPropagation();
    if (dir === 'prev' && photoIndex > 0) setPhotoIndex(photoIndex - 1);
    if (dir === 'next' && photoIndex < photos.length - 1) setPhotoIndex(photoIndex + 1);
  };

  return (
    <div className={`swipe-card w-full aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl bg-gray-200 dark:bg-gray-800 relative ${className}`}>
      {photos.length > 0 ? (
        <img src={photos[photoIndex]?.url} alt={profile.first_name} className="w-full h-full object-cover" draggable={false} />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          <span className="text-4xl font-bold">{profile.first_name.charAt(0)}</span>
        </div>
      )}

      {/* Photo navigation */}
      {photos.length > 1 && (
        <>
          <button onClick={(e) => handlePhotoNav(e, 'prev')} className="absolute left-0 top-0 bottom-0 w-1/4 z-10" />
          <button onClick={(e) => handlePhotoNav(e, 'next')} className="absolute right-0 top-0 bottom-0 w-1/4 z-10" />
          <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
            {photos.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i === photoIndex ? 'bg-white' : 'bg-white/40'}`} />
            ))}
          </div>
        </>
      )}

      {/* Gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-5 pt-20">
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-white">{profile.first_name}</h2>
              {age && <span className="text-xl text-white/80">{age}</span>}
              {profile.is_verified && (
                <span className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-white/80 text-sm mt-1">
              {profile.city && <span className="flex items-center gap-1"><MapPin size={14} /> {profile.city}</span>}
              {profile.distance !== null && (
                <span className="flex items-center gap-1 text-primary-300">
                  <Navigation size={12} />
                  {formatDistance(profile.distance, lang)}
                </span>
              )}
              {isOnline(profile.last_active) && <span className="flex items-center gap-1 text-success-400"><span className="w-2 h-2 rounded-full bg-success-400" /> {lang === 'ka' ? 'ონლაინ' : 'Online'}</span>}
            </div>
            {profile.occupation && <p className="text-white/70 text-sm mt-1">{profile.occupation}</p>}
          </div>
          {onInfo && (
            <button onClick={(e) => { e.stopPropagation(); onInfo(); }} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30 transition-colors">
              <Info size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FullProfile({ profile, lang, t }: { profile: DiscoveryProfile; lang: 'ka' | 'en'; t: (k: TranslationKey) => string }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = profile.photos || [];
  const age = calculateAge(profile.date_of_birth);

  return (
    <div>
      {/* Photos */}
      <div className="relative aspect-[3/4] rounded-t-2xl overflow-hidden bg-gray-200 dark:bg-gray-800">
        {photos.length > 0 ? (
          <img src={photos[photoIndex]?.url} alt={profile.first_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-6xl font-bold">
            {profile.first_name.charAt(0)}
          </div>
        )}
        {photos.length > 1 && (
          <>
            <button onClick={() => setPhotoIndex(Math.max(0, photoIndex - 1))} className="absolute left-0 top-0 bottom-0 w-1/3" />
            <button onClick={() => setPhotoIndex(Math.min(photos.length - 1, photoIndex + 1))} className="absolute right-0 top-0 bottom-0 w-1/3" />
            <div className="absolute top-3 left-3 right-3 flex gap-1">
              {photos.map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full ${i === photoIndex ? 'bg-white' : 'bg-white/40'}`} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="p-6 space-y-5">
        {/* Name & basic */}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">{profile.first_name}</h2>
            {age && <span className="text-xl text-gray-500">{age}</span>}
            {profile.is_verified && (
              <span className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-1">{formatLastActive(profile.last_active, lang)}</p>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3">
          {profile.city && <InfoItem icon={<MapPin size={16} />} label={t('profile.basicInfo')} value={profile.city} />}
          {profile.distance !== null && (
            <InfoItem icon={<Navigation size={16} />} label={t('discover.distance')} value={formatDistance(profile.distance, lang)} />
          )}
          {profile.occupation && <InfoItem icon={<Briefcase size={16} />} label={t('profile.occupation')} value={profile.occupation} />}
          {profile.education && <InfoItem icon={<GraduationCap size={16} />} label={t('profile.education')} value={profile.education} />}
          {profile.height && <InfoItem icon={<Ruler size={16} />} label={t('profile.height')} value={`${profile.height} cm`} />}
          {profile.relationship_intention && <InfoItem icon={<Heart size={16} />} label={t('profile.intention')} value={t(`intention.${profile.relationship_intention}` as TranslationKey)} />}
          {profile.languages?.length > 0 && <InfoItem icon={<LangIcon size={16} />} label={t('profile.languages')} value={profile.languages.join(', ')} />}
        </div>

        {/* Bio */}
        {profile.bio && (
          <div>
            <h3 className="font-semibold mb-1">{t('profile.about')}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Interests */}
        {profile.user_interests?.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">{t('profile.interests')}</h3>
            <div className="flex flex-wrap gap-2">
              {profile.user_interests.map((ui) => (
                <span key={ui.interest_id} className="badge bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400">
                  {t(`interest.${ui.interest_id}` as TranslationKey)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
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
