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
  return lang === 'ka' ? `ბოლოს ქმედი ${timeAgo(lastActive, 'ka')}` : `Last active ${timeAgo(lastActive, 'en')}`;
}

export function initials(name: string): string {
  return name.charAt(0).toUpperCase();
}
