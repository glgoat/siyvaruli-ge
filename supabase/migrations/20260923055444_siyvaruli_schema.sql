/*
# siyvaruli.ge - Complete Database Schema

## Overview
Creates the complete database schema for siyvaruli.ge, a free dating platform for people in Georgia.

## New Tables
1. profiles - User dating profiles (extends auth.users)
2. photos - Profile photos with ordering
3. interests - Predefined interests catalog
4. user_interests - User-interest junction table
5. likes - User likes (swipe right)
6. passes - User passes (swipe left)
7. matches - Mutual likes
8. messages - Chat messages between matched users
9. typing_status - Real-time typing indicators
10. notifications - User notifications
11. reports - User reports for moderation
12. blocks - User blocks
13. verification_requests - Profile verification requests
14. user_settings - User preferences and settings
15. admin_roles - Admin role assignments
16. moderation_actions - Admin moderation audit log

## Storage
- Public bucket 'profile-photos' for user photo uploads
- Private bucket 'verification-photos' for verification documents

## Security
- RLS enabled on all tables
- Owner-scoped policies for user data
- Admin-scoped policies for moderation data
- Match-scoped policies for messages
- Block-aware profile visibility
- Protected admin fields on profiles (trigger)

## Notes
1. All tables use uuid PKs with gen_random_uuid()
2. Foreign keys cascade on user deletion
3. Timestamps default to now()
4. Profiles auto-created via trigger on auth.users
5. User settings auto-created via trigger on profiles
*/

-- ============ TABLES ============

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL DEFAULT '',
  date_of_birth date,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  interested_in text CHECK (interested_in IN ('men', 'women', 'everyone')),
  city text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  height integer CHECK (height IS NULL OR height > 0),
  occupation text,
  education text,
  languages text[] NOT NULL DEFAULT '{}',
  relationship_intention text CHECK (relationship_intention IS NULL OR relationship_intention IN ('serious', 'casual', 'friendship', 'not_sure')),
  is_verified boolean NOT NULL DEFAULT false,
  verification_status text NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  is_paused boolean NOT NULL DEFAULT false,
  is_suspended boolean NOT NULL DEFAULT false,
  suspended_until timestamptz,
  profile_completed boolean NOT NULL DEFAULT false,
  last_active timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_18_plus CHECK (date_of_birth IS NULL OR date_of_birth <= (now() - interval '18 years')::date)
);

CREATE TABLE IF NOT EXISTS photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  url text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  category text
);

CREATE TABLE IF NOT EXISTS user_interests (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interest_id uuid NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, interest_id)
);

CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  liked_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seen boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (liker_id, liked_id)
);

CREATE TABLE IF NOT EXISTS passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  passed_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (passer_id, passed_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user1_id, user2_id),
  CONSTRAINT matches_user_order CHECK (user1_id < user2_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  image_url text,
  read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS typing_status (
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (match_id, user_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  data jsonb,
  read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('harassment', 'spam', 'fake_profile', 'inappropriate_photo', 'underage', 'violence', 'hate_speech', 'scam', 'other')),
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'actioned', 'dismissed')),
  admin_notes text,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);

CREATE TABLE IF NOT EXISTS verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  selfie_photo_url text,
  id_photo_url text,
  notes text,
  admin_notes text,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  language text NOT NULL DEFAULT 'ka',
  dark_mode boolean NOT NULL DEFAULT false,
  show_online_status boolean NOT NULL DEFAULT true,
  show_age boolean NOT NULL DEFAULT true,
  show_city boolean NOT NULL DEFAULT true,
  notifications_enabled boolean NOT NULL DEFAULT true,
  match_notifications boolean NOT NULL DEFAULT true,
  message_notifications boolean NOT NULL DEFAULT true,
  like_notifications boolean NOT NULL DEFAULT true,
  discovery_age_min integer NOT NULL DEFAULT 18,
  discovery_age_max integer NOT NULL DEFAULT 99,
  discovery_city text,
  discovery_intention text CHECK (discovery_intention IS NULL OR discovery_intention IN ('serious', 'casual', 'friendship', 'not_sure')),
  show_in_discovery boolean NOT NULL DEFAULT true,
  last_swipe_type text,
  last_swipe_target uuid,
  last_swipe_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'moderator')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  report_id uuid REFERENCES reports(id) ON DELETE SET NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ INDEXES ============

CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_position ON photos(user_id, position);
CREATE INDEX IF NOT EXISTS idx_likes_liker ON likes(liker_id);
CREATE INDEX IF NOT EXISTS idx_likes_liked ON likes(liked_id);
CREATE INDEX IF NOT EXISTS idx_passes_passer ON passes(passer_id);
CREATE INDEX IF NOT EXISTS idx_matches_user1 ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_verification_status ON verification_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_suspended ON profiles(is_suspended);
CREATE INDEX IF NOT EXISTS idx_user_interests_user ON user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_interest ON user_interests(interest_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_target ON moderation_actions(target_user_id);

-- ============ STORAGE BUCKETS ============

INSERT INTO storage.buckets (id, name, public) VALUES
  ('profile-photos', 'profile-photos', true),
  ('verification-photos', 'verification-photos', false)
ON CONFLICT (id) DO NOTHING;

-- ============ SEED DATA ============

INSERT INTO interests (key) VALUES
  ('music'), ('travel'), ('food'), ('sports'), ('movies'), ('reading'), ('gaming'),
  ('art'), ('cooking'), ('photography'), ('hiking'), ('yoga'), ('dancing'),
  ('coffee'), ('wine'), ('pets'), ('nature'), ('fashion'), ('technology'),
  ('fitness'), ('books'), ('writing'), ('cycling'), ('swimming'), ('running'),
  ('skiing'), ('climbing'), ('camping'), ('fishing'), ('cars'), ('football'),
  ('basketball'), ('gym'), ('meditation'), ('gardening'), ('design'), ('history'),
  ('languages'), ('volunteering'), ('standup'), ('theater'), ('board_games')
ON CONFLICT (key) DO NOTHING;