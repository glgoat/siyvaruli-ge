export const GEORGIAN_CITIES = [
  'თბილისი',
  'ბათუმი',
  'ქუთაისი',
  'რუსთავი',
  'გორი',
  'ზუგდიდი',
  'თელავი',
  'ფოთი',
  'სოხუმი',
  'სამტრედია',
  'მარნეული',
  'ახალციხე',
  'ახალქალაქი',
  'სენაკი',
  'ბოლნისი',
  'ქარელი',
  'ჭიათურა',
  'ცაგერი',
  'ოზურგეთი',
  'ყვარლი',
] as const;

export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'თბილისი': { lat: 41.7151, lng: 44.8271 },
  'ბათუმი': { lat: 41.6168, lng: 41.6367 },
  'ქუთაისი': { lat: 42.2679, lng: 42.7189 },
  'რუსთავი': { lat: 41.5495, lng: 44.9932 },
  'გორი': { lat: 41.9842, lng: 44.1153 },
  'ზუგდიდი': { lat: 42.5088, lng: 41.8709 },
  'თელავი': { lat: 41.9026, lng: 45.4731 },
  'ფოთი': { lat: 42.5154, lng: 41.6903 },
  'სოხუმი': { lat: 43.0, lng: 41.0 },
  'სამტრედია': { lat: 42.1556, lng: 42.1911 },
  'მარნეული': { lat: 41.4744, lng: 44.8103 },
  'ახალციხე': { lat: 41.6418, lng: 42.9983 },
  'ახალქალაქი': { lat: 41.4078, lng: 43.4819 },
  'სენაკი': { lat: 42.2672, lng: 42.0733 },
  'ბოლნისი': { lat: 41.4506, lng: 44.5333 },
  'ქარელი': { lat: 42.1869, lng: 43.9989 },
  'ჭიათურა': { lat: 42.2933, lng: 43.4464 },
  'ცაგერი': { lat: 42.5669, lng: 42.6608 },
  'ოზურგეთი': { lat: 42.2028, lng: 42.0275 },
  'ყვარლი': { lat: 41.5222, lng: 45.8306 },
};

export function getCityCoordinates(city: string): { lat: number; lng: number } | null {
  return CITY_COORDINATES[city] || null;
}

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(km: number, lang: 'ka' | 'en' = 'ka'): string {
  if (km < 1) {
    const m = Math.round(km * 1000);
    return lang === 'ka' ? `${m} მ` : `${m} m`;
  }
  if (km < 10) {
    return lang === 'ka' ? `${km.toFixed(1)} კმ` : `${km.toFixed(1)} km`;
  }
  return lang === 'ka' ? `${Math.round(km)} კმ` : `${Math.round(km)} km`;
}

export const INTEREST_KEYS = [
  'music', 'travel', 'food', 'sports', 'movies', 'reading', 'gaming',
  'art', 'cooking', 'photography', 'hiking', 'yoga', 'dancing',
  'coffee', 'wine', 'pets', 'nature', 'fashion', 'technology',
  'fitness', 'books', 'writing', 'cycling', 'swimming', 'running',
  'skiing', 'climbing', 'camping', 'fishing', 'cars', 'football',
  'basketball', 'gym', 'meditation', 'gardening', 'design', 'history',
  'languages', 'volunteering', 'standup', 'theater', 'board_games',
] as const;

export const REPORT_REASONS: { value: string; labelKey: string }[] = [
  { value: 'harassment', labelKey: 'report.harassment' },
  { value: 'spam', labelKey: 'report.spam' },
  { value: 'fake_profile', labelKey: 'report.fakeProfile' },
  { value: 'inappropriate_photo', labelKey: 'report.inappropriatePhoto' },
  { value: 'underage', labelKey: 'report.underage' },
  { value: 'violence', labelKey: 'report.violence' },
  { value: 'hate_speech', labelKey: 'report.hateSpeech' },
  { value: 'scam', labelKey: 'report.scam' },
  { value: 'other', labelKey: 'report.other' },
];

export function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export function is18Plus(dateOfBirth: string): boolean {
  const age = calculateAge(dateOfBirth);
  return age !== null && age >= 18;
}

export function timeAgo(dateStr: string, lang: 'ka' | 'en' = 'ka'): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (lang === 'ka') {
    if (diff < 60) return 'ახლახან';
    if (diff < 3600) return `${Math.floor(diff / 60)} წთ წინ`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} სთ წინ`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} დღ წინ`;
    if (diff < 31536000) return `${Math.floor(diff / 2592000)} თვ წინ`;
    return `${Math.floor(diff / 31536000)} წლ წინ`;
  }

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
  return `${Math.floor(diff / 31536000)}y ago`;
}

export function isOnline(lastActive: string): boolean {
  const date = new Date(lastActive);
  return Date.now() - date.getTime() < 5 * 60 * 1000;
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' });
}

export function formatLastActive(lastActive: string, lang: 'ka' | 'en' = 'ka'): string {
  if (isOnline(lastActive)) {
    return lang === 'ka' ? 'ონლაინ' : 'Online';
  }
  return lang === 'ka' ? `ბოლო აქტივობა ${timeAgo(lastActive, 'ka')}` : `Last active ${timeAgo(lastActive, 'en')}`;
}

export function initials(name: string): string {
  return name.charAt(0).toUpperCase();
}
