import { supabase } from '@/lib/supabase';
import type { Profile, Photo, Interest, UserSettings } from '@/types';
import * as ImagePicker from 'expo-image-picker';
import { getCityCoordinates } from '@/constants';

export async function fetchProfileData(userId: string): Promise<{ photos: Photo[]; interests: Interest[] }> {
  const [{ data: photos }, { data: interestData }] = await Promise.all([
    supabase.from('photos').select('*').eq('user_id', userId).order('position'),
    supabase.from('user_interests').select('interests(*)').eq('user_id', userId),
  ]);
  return {
    photos: photos || [],
    interests: (interestData as unknown as { interests: Interest }[])?.map((ui) => ui.interests) || [],
  };
}

export async function updateProfile(userId: string, data: Partial<Profile>): Promise<void> {
  const updateData: Record<string, unknown> = { ...data };
  if (data.city) {
    const coords = getCityCoordinates(data.city);
    updateData.latitude = coords?.lat ?? null;
    updateData.longitude = coords?.lng ?? null;
  }
  await supabase.from('profiles').update(updateData).eq('id', userId);
}

export async function uploadPhoto(userId: string, position: number): Promise<Photo | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const file = result.assets[0];
  const ext = file.uri.split('.').pop() || 'jpg';
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    name: path.split('/').pop() || 'photo.jpg',
    type: `image/${ext}`,
  } as unknown as Blob);

  const { error } = await supabase.storage.from('profile-photos').upload(path, formData);
  if (error) return null;

  const { data: { publicUrl } } = supabase.storage.from('profile-photos').getPublicUrl(path);
  const { data: photoRow } = await supabase.from('photos')
    .insert({ user_id: userId, url: publicUrl, position })
    .select().single();
  return photoRow as Photo | null;
}

export async function deletePhoto(photoId: string): Promise<void> {
  await supabase.from('photos').delete().eq('id', photoId);
}

export async function toggleInterest(userId: string, interestKey: string, currentInterests: Interest[]): Promise<Interest[]> {
  const existing = currentInterests.find((i) => i.key === interestKey);
  if (existing) {
    await supabase.from('user_interests').delete().eq('user_id', userId).eq('interest_id', existing.id);
    return currentInterests.filter((i) => i.key !== interestKey);
  }
  const { data } = await supabase.from('interests').select('*').eq('key', interestKey).maybeSingle();
  if (data) {
    await supabase.from('user_interests').insert({ user_id: userId, interest_id: data.id });
    return [...currentInterests, data];
  }
  return currentInterests;
}

export async function updateSetting(userId: string, key: string, value: boolean | string): Promise<void> {
  await supabase.from('user_settings').update({ [key]: value }).eq('user_id', userId);
}

export async function togglePause(userId: string, isPaused: boolean): Promise<void> {
  await supabase.from('profiles').update({ is_paused: !isPaused }).eq('id', userId);
}
