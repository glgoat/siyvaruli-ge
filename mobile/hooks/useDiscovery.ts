import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { fetchDiscoveryProfiles, swipeLike, swipePass, undoSwipe, type DiscoveryFilters } from '@/services/discovery';
import { getCityCoordinates } from '@/constants';
import type { DiscoveryProfile } from '@/types';

export function useDiscovery() {
  const { user, profile } = useAuth();
  const [profiles, setProfiles] = useState<DiscoveryProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSwipe, setLastSwipe] = useState<{ targetId: string; type: 'like' | 'pass' } | null>(null);
  const [matchData, setMatchData] = useState<{ name: string; photo: string } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [filters, setFilters] = useState<DiscoveryFilters>({
    ageMin: 18, ageMax: 99, city: '', intention: '',
  });

  useEffect(() => {
    if (userLocation) return;
    if (profile?.latitude && profile?.longitude) {
      setUserLocation({ lat: profile.latitude, lng: profile.longitude });
    } else if (profile?.city) {
      const coords = getCityCoordinates(profile.city);
      if (coords) setUserLocation(coords);
    }
  }, [profile, userLocation]);

  const load = useCallback(async () => {
    if (!user || !profile) return;
    setLoading(true);
    const data = await fetchDiscoveryProfiles(user.id, profile, filters, userLocation);
    setProfiles(data);
    setLoading(false);
  }, [user, profile, filters, userLocation]);

  useEffect(() => { load(); }, [load]);

  const handleSwipe = useCallback((direction: 'left' | 'right', swipedProfile: DiscoveryProfile) => {
    if (!user) return;
    setLastSwipe({ targetId: swipedProfile.id, type: direction === 'right' ? 'like' : 'pass' });
    setProfiles((prev) => prev.filter((p) => p.id !== swipedProfile.id));

    (async () => {
      if (direction === 'right') {
        const isMatch = await swipeLike(user.id, swipedProfile.id);
        if (isMatch) {
          setMatchData({ name: swipedProfile.first_name, photo: swipedProfile.photos?.[0]?.url || '' });
        }
      } else {
        await swipePass(user.id, swipedProfile.id);
      }
    })();
  }, [user]);

  const handleUndo = useCallback(() => {
    if (!user || !lastSwipe) return;
    const undoTarget = lastSwipe;
    setLastSwipe(null);
    (async () => {
      await undoSwipe(user.id, undoTarget.targetId, undoTarget.type);
      load();
    })();
  }, [user, lastSwipe, load]);

  return {
    profiles, loading, load, handleSwipe, handleUndo, lastSwipe,
    matchData, setMatchData, filters, setFilters, userLocation, setUserLocation,
  };
}
