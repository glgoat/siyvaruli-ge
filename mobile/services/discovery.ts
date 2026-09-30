import { supabase } from '@/lib/supabase';
import type { DiscoveryProfile, Profile, Photo, UserSettings, RelationshipIntention } from '@/types';
import { calculateAge, getCityCoordinates, calculateDistance } from '@/constants';

export interface DiscoveryFilters {
  ageMin: number;
  ageMax: number;
  city: string;
  intention: RelationshipIntention | '';
}

export async function fetchDiscoveryProfiles(
  userId: string,
  profile: Profile,
  filters: DiscoveryFilters,
  userLocation: { lat: number; lng: number } | null
): Promise<DiscoveryProfile[]> {
  const genderFilter = profile.interested_in === 'men' ? 'male' : profile.interested_in === 'women' ? 'female' : null;

  let query = supabase
    .from('profiles')
    .select(`*, photos:photos(*), user_interests:user_interests(interest_id)`)
    .neq('id', userId)
    .eq('is_paused', false)
    .eq('is_suspended', false)
    .neq('profile_completed', false);

  if (genderFilter) query = query.eq('gender', genderFilter);

  if (profile.gender === 'male') query = query.in('interested_in', ['men', 'everyone']);
  else if (profile.gender === 'female') query = query.in('interested_in', ['women', 'everyone']);

  if (filters.city) query = query.eq('city', filters.city);
  if (filters.intention) query = query.eq('relationship_intention', filters.intention);

  const { data, error } = await query.order('last_active', { ascending: false }).limit(20);
  if (error || !data) return [];

  const profileIds = data.map((p) => p.id);
  const [likedRes, passedRes, likedMeRes] = await Promise.all([
    supabase.from('likes').select('liked_id').in('liked_id', profileIds).eq('liker_id', userId),
    supabase.from('passes').select('passed_id').in('passed_id', profileIds).eq('passer_id', userId),
    supabase.from('likes').select('liker_id').in('liker_id', profileIds).eq('liked_id', userId),
  ]);

  const likedIds = new Set(likedRes.data?.map((l) => l.liked_id) || []);
  const passedIds = new Set(passedRes.data?.map((p) => p.passed_id) || []);
  const likedMeIds = new Set(likedMeRes.data?.map((l) => l.liker_id) || []);

  const myLat = userLocation?.lat ?? profile.latitude ?? (profile.city ? getCityCoordinates(profile.city)?.lat ?? null : null);
  const myLng = userLocation?.lng ?? profile.longitude ?? (profile.city ? getCityCoordinates(profile.city)?.lng ?? null : null);

  return data
    .filter((p) => !likedIds.has(p.id) && !passedIds.has(p.id))
    .filter((p) => {
      const age = calculateAge(p.date_of_birth);
      if (age === null) return false;
      return age >= filters.ageMin && age <= filters.ageMax;
    })
    .map((p) => {
      const pLat = p.latitude ?? (p.city ? getCityCoordinates(p.city)?.lat ?? null : null);
      const pLng = p.longitude ?? (p.city ? getCityCoordinates(p.city)?.lng ?? null : null);
      let distance: number | null = null;
      if (myLat !== null && myLng !== null && pLat !== null && pLng !== null) {
        distance = calculateDistance(myLat, myLng, pLat, pLng);
      }
      return {
        ...p,
        age: calculateAge(p.date_of_birth) || 0,
        photo_count: p.photos?.length || 0,
        has_liked_me: likedMeIds.has(p.id),
        distance,
      } as DiscoveryProfile;
    });
}

export async function swipeLike(likerId: string, likedId: string): Promise<boolean> {
  const { data: existingLike } = await supabase
    .from('likes').select('id').eq('liker_id', likedId).eq('liked_id', likerId).maybeSingle();

  await supabase.from('likes').insert({ liker_id: likerId, liked_id: likedId });

  await supabase.from('user_settings').update({
    last_swipe_type: 'like', last_swipe_target: likedId, last_swipe_at: new Date().toISOString(),
  }).eq('user_id', likerId);

  return !!existingLike;
}

export async function swipePass(passerId: string, passedId: string): Promise<void> {
  await supabase.from('passes').insert({ passer_id: passerId, passed_id: passedId });
  await supabase.from('user_settings').update({
    last_swipe_type: 'pass', last_swipe_target: passedId, last_swipe_at: new Date().toISOString(),
  }).eq('user_id', passerId);
}

export async function undoSwipe(userId: string, targetId: string, type: 'like' | 'pass'): Promise<void> {
  if (type === 'like') {
    await supabase.from('likes').delete().eq('liker_id', userId).eq('liked_id', targetId);
  } else {
    await supabase.from('passes').delete().eq('passer_id', userId).eq('passed_id', targetId);
  }
}
