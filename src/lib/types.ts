export type Gender = 'male' | 'female' | 'other';
export type InterestedIn = 'men' | 'women' | 'everyone';
export type RelationshipIntention = 'serious' | 'casual' | 'friendship' | 'not_sure';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type ReportReason = 'harassment' | 'spam' | 'fake_profile' | 'inappropriate_photo' | 'underage' | 'violence' | 'hate_speech' | 'scam' | 'other';
export type ReportStatus = 'pending' | 'reviewing' | 'actioned' | 'dismissed';
export type NotificationType = 'match' | 'message' | 'like' | 'verification' | 'report' | 'account';

export interface Profile {
  id: string;
  first_name: string;
  date_of_birth: string | null;
  gender: Gender | null;
  interested_in: InterestedIn | null;
  city: string;
  bio: string;
  height: number | null;
  occupation: string | null;
  education: string | null;
  languages: string[];
  relationship_intention: RelationshipIntention | null;
  is_verified: boolean;
  verification_status: VerificationStatus;
  is_paused: boolean;
  is_suspended: boolean;
  suspended_until: string | null;
  profile_completed: boolean;
  latitude: number | null;
  longitude: number | null;
  last_active: string;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  user_id: string;
  url: string;
  position: number;
  created_at: string;
}

export interface Interest {
  id: string;
  key: string;
  category: string | null;
}

export interface UserInterest {
  user_id: string;
  interest_id: string;
}

export interface Like {
  id: string;
  liker_id: string;
  liked_id: string;
  seen: boolean;
  created_at: string;
}

export interface Pass {
  id: string;
  passer_id: string;
  passed_id: string;
  created_at: string;
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  image_url: string | null;
  read: boolean;
  read_at: string | null;
  deleted_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  admin_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
}

export interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface VerificationRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  selfie_photo_url: string | null;
  id_photo_url: string | null;
  notes: string | null;
  admin_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
}

export interface UserSettings {
  user_id: string;
  language: string;
  dark_mode: boolean;
  show_online_status: boolean;
  show_age: boolean;
  show_city: boolean;
  notifications_enabled: boolean;
  match_notifications: boolean;
  message_notifications: boolean;
  like_notifications: boolean;
  discovery_age_min: number;
  discovery_age_max: number;
  discovery_city: string | null;
  discovery_intention: RelationshipIntention | null;
  show_in_discovery: boolean;
  last_swipe_type: string | null;
  last_swipe_target: string | null;
  last_swipe_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminRole {
  user_id: string;
  role: 'admin' | 'moderator';
  created_at: string;
}

export interface ModerationAction {
  id: string;
  admin_id: string;
  action: string;
  target_user_id: string | null;
  report_id: string | null;
  reason: string | null;
  created_at: string;
}

export interface DiscoveryProfile extends Profile {
  photos: Photo[];
  user_interests: { interest_id: string }[];
  age: number;
  photo_count: number;
  has_liked_me: boolean;
  distance: number | null;
}
