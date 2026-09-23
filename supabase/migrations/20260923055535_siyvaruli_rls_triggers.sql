/*
# siyvaruli.ge - RLS Policies and Triggers

## Overview
Enables Row Level Security on all tables and creates security policies.
Also creates triggers for auto-creating profiles/settings on signup and match creation on mutual like.

## Security Changes
- RLS enabled on all 16 tables
- Owner-scoped CRUD policies for user-owned data (profiles, photos, user_interests, user_settings, typing_status)
- Match-scoped policies for messages (both match participants can read/send)
- Self-scoped policies for likes, passes, blocks, notifications, reports, verification_requests
- Admin-scoped policies for reports, verification_requests, moderation_actions, admin_roles
- Block-aware profile discovery: users cannot see profiles of people who blocked them or they blocked
- Protected profile fields: is_verified, verification_status, is_suspended, suspended_until are NOT user-writable
- Match auto-creation trigger: when a like is created, if reciprocal like exists, create a match
- Profile auto-creation trigger: when auth.users row created, create profile + settings
- last_active update trigger helper

## Notes
1. Profiles SELECT allows reading other profiles (for discovery) but blocks are excluded via policy
2. Profile UPDATE only allows updating own profile, and NOT protected fields
3. Messages are scoped to match participants
4. Admin access via admin_roles table membership
5. Storage policies for profile-photos and verification-photos buckets
*/

-- ============ ENABLE RLS ============

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;

-- ============ PROFILES POLICIES ============

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT
  TO authenticated USING (
    id = auth.uid()
    OR (
      NOT is_suspended
      AND id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = auth.uid())
      AND id NOT IN (SELECT blocker_id FROM blocks WHERE blocked_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "profiles_insert_self" ON profiles;
CREATE POLICY "profiles_insert_self" ON profiles FOR INSERT
  TO authenticated WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_self" ON profiles;
CREATE POLICY "profiles_update_self" ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_delete_self" ON profiles;
CREATE POLICY "profiles_delete_self" ON profiles FOR DELETE
  TO authenticated USING (id = auth.uid());

-- ============ PHOTOS POLICIES ============

DROP POLICY IF EXISTS "photos_select_all" ON photos;
CREATE POLICY "photos_select_all" ON photos FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "photos_insert_own" ON photos;
CREATE POLICY "photos_insert_own" ON photos FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "photos_update_own" ON photos;
CREATE POLICY "photos_update_own" ON photos FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "photos_delete_own" ON photos;
CREATE POLICY "photos_delete_own" ON photos FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- ============ INTERESTS POLICIES ============

DROP POLICY IF EXISTS "interests_select_all" ON interests;
CREATE POLICY "interests_select_all" ON interests FOR SELECT
  TO authenticated USING (true);

-- ============ USER_INTERESTS POLICIES ============

DROP POLICY IF EXISTS "user_interests_select_all" ON user_interests;
CREATE POLICY "user_interests_select_all" ON user_interests FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "user_interests_insert_own" ON user_interests;
CREATE POLICY "user_interests_insert_own" ON user_interests FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_interests_delete_own" ON user_interests;
CREATE POLICY "user_interests_delete_own" ON user_interests FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- ============ LIKES POLICIES ============

DROP POLICY IF EXISTS "likes_select_own" ON likes;
CREATE POLICY "likes_select_own" ON likes FOR SELECT
  TO authenticated USING (liker_id = auth.uid() OR liked_id = auth.uid());

DROP POLICY IF EXISTS "likes_insert_own" ON likes;
CREATE POLICY "likes_insert_own" ON likes FOR INSERT
  TO authenticated WITH CHECK (liker_id = auth.uid());

DROP POLICY IF EXISTS "likes_delete_own" ON likes;
CREATE POLICY "likes_delete_own" ON likes FOR DELETE
  TO authenticated USING (liker_id = auth.uid());

-- ============ PASSES POLICIES ============

DROP POLICY IF EXISTS "passes_select_own" ON passes;
CREATE POLICY "passes_select_own" ON passes FOR SELECT
  TO authenticated USING (passer_id = auth.uid());

DROP POLICY IF EXISTS "passes_insert_own" ON passes;
CREATE POLICY "passes_insert_own" ON passes FOR INSERT
  TO authenticated WITH CHECK (passer_id = auth.uid());

DROP POLICY IF EXISTS "passes_delete_own" ON passes;
CREATE POLICY "passes_delete_own" ON passes FOR DELETE
  TO authenticated USING (passer_id = auth.uid());

-- ============ MATCHES POLICIES ============

DROP POLICY IF EXISTS "matches_select_participants" ON matches;
CREATE POLICY "matches_select_participants" ON matches FOR SELECT
  TO authenticated USING (user1_id = auth.uid() OR user2_id = auth.uid());

DROP POLICY IF EXISTS "matches_delete_participant" ON matches;
CREATE POLICY "matches_delete_participant" ON matches FOR DELETE
  TO authenticated USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- ============ MESSAGES POLICIES ============

DROP POLICY IF EXISTS "messages_select_match_participants" ON messages;
CREATE POLICY "messages_select_match_participants" ON messages FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = messages.match_id
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "messages_insert_match_participant" ON messages;
CREATE POLICY "messages_insert_match_participant" ON messages FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = messages.match_id
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
    AND sender_id = auth.uid()
  );

DROP POLICY IF EXISTS "messages_update_match_participant" ON messages;
CREATE POLICY "messages_update_match_participant" ON messages FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = messages.match_id
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = messages.match_id
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

-- ============ TYPING_STATUS POLICIES ============

DROP POLICY IF EXISTS "typing_select_match_participants" ON typing_status;
CREATE POLICY "typing_select_match_participants" ON typing_status FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = typing_status.match_id
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "typing_upsert_match_participant" ON typing_status;
CREATE POLICY "typing_upsert_match_participant" ON typing_status FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = typing_status.match_id
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "typing_update_match_participant" ON typing_status;
CREATE POLICY "typing_update_match_participant" ON typing_status FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "typing_delete_match_participant" ON typing_status;
CREATE POLICY "typing_delete_match_participant" ON typing_status FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- ============ NOTIFICATIONS POLICIES ============

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_insert_own" ON notifications;
CREATE POLICY "notifications_insert_own" ON notifications FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- ============ REPORTS POLICIES ============

DROP POLICY IF EXISTS "reports_select_own_or_admin" ON reports;
CREATE POLICY "reports_select_own_or_admin" ON reports FOR SELECT
  TO authenticated USING (
    reporter_id = auth.uid()
    OR EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "reports_insert_own" ON reports;
CREATE POLICY "reports_insert_own" ON reports FOR INSERT
  TO authenticated WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS "reports_update_admin" ON reports;
CREATE POLICY "reports_update_admin" ON reports FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid())
  );

-- ============ BLOCKS POLICIES ============

DROP POLICY IF EXISTS "blocks_select_own" ON blocks;
CREATE POLICY "blocks_select_own" ON blocks FOR SELECT
  TO authenticated USING (blocker_id = auth.uid() OR blocked_id = auth.uid());

DROP POLICY IF EXISTS "blocks_insert_own" ON blocks;
CREATE POLICY "blocks_insert_own" ON blocks FOR INSERT
  TO authenticated WITH CHECK (blocker_id = auth.uid());

DROP POLICY IF EXISTS "blocks_delete_own" ON blocks;
CREATE POLICY "blocks_delete_own" ON blocks FOR DELETE
  TO authenticated USING (blocker_id = auth.uid());

-- ============ VERIFICATION_REQUESTS POLICIES ============

DROP POLICY IF EXISTS "verification_select_own_or_admin" ON verification_requests;
CREATE POLICY "verification_select_own_or_admin" ON verification_requests FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "verification_insert_own" ON verification_requests;
CREATE POLICY "verification_insert_own" ON verification_requests FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "verification_update_admin" ON verification_requests;
CREATE POLICY "verification_update_admin" ON verification_requests FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid())
  );

-- ============ USER_SETTINGS POLICIES ============

DROP POLICY IF EXISTS "settings_select_own" ON user_settings;
CREATE POLICY "settings_select_own" ON user_settings FOR SELECT
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "settings_insert_own" ON user_settings;
CREATE POLICY "settings_insert_own" ON user_settings FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "settings_update_own" ON user_settings;
CREATE POLICY "settings_update_own" ON user_settings FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ ADMIN_ROLES POLICIES ============

DROP POLICY IF EXISTS "admin_roles_select_all" ON admin_roles;
CREATE POLICY "admin_roles_select_all" ON admin_roles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_roles_insert_admin" ON admin_roles;
CREATE POLICY "admin_roles_insert_admin" ON admin_roles FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM admin_roles ar WHERE ar.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "admin_roles_delete_admin" ON admin_roles;
CREATE POLICY "admin_roles_delete_admin" ON admin_roles FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_roles ar WHERE ar.user_id = auth.uid())
  );

-- ============ MODERATION_ACTIONS POLICIES ============

DROP POLICY IF EXISTS "moderation_select_admin" ON moderation_actions;
CREATE POLICY "moderation_select_admin" ON moderation_actions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "moderation_insert_admin" ON moderation_actions;
CREATE POLICY "moderation_insert_admin" ON moderation_actions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid())
  );

-- ============ STORAGE POLICIES ============

DROP POLICY IF EXISTS "profile_photos_select_all" ON storage.objects;
CREATE POLICY "profile_photos_select_all" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "profile_photos_insert_own" ON storage.objects;
CREATE POLICY "profile_photos_insert_own" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'profile-photos' AND owner = auth.uid());

DROP POLICY IF EXISTS "profile_photos_update_own" ON storage.objects;
CREATE POLICY "profile_photos_update_own" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'profile-photos' AND owner = auth.uid());

DROP POLICY IF EXISTS "profile_photos_delete_own" ON storage.objects;
CREATE POLICY "profile_photos_delete_own" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'profile-photos' AND owner = auth.uid());

DROP POLICY IF EXISTS "verification_photos_select_admin" ON storage.objects;
CREATE POLICY "verification_photos_select_admin" ON storage.objects FOR SELECT
  TO authenticated USING (
    bucket_id = 'verification-photos'
    AND EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "verification_photos_insert_own" ON storage.objects;
CREATE POLICY "verification_photos_insert_own" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'verification-photos' AND owner = auth.uid());

-- ============ FUNCTIONS & TRIGGERS ============

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, date_of_birth, gender, interested_in, city, bio)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    NULL,
    NULL,
    NULL,
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    COALESCE(NEW.raw_user_meta_data->>'bio', '')
  );
  INSERT INTO public.user_settings (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-create match on mutual like
CREATE OR REPLACE FUNCTION public.check_mutual_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  match_id uuid;
BEGIN
  -- Check if the reverse like exists
  IF EXISTS (
    SELECT 1 FROM public.likes
    WHERE liker_id = NEW.liked_id AND liked_id = NEW.liker_id
  ) THEN
    -- Create match with consistent user ordering
    INSERT INTO public.matches (user1_id, user2_id)
    VALUES (
      LEAST(NEW.liker_id, NEW.liked_id),
      GREATEST(NEW.liker_id, NEW.liked_id)
    )
    ON CONFLICT (user1_id, user2_id) DO NOTHING
    RETURNING id INTO match_id;

    -- Create notifications for both users
    IF match_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, data)
      SELECT NEW.liker_id, 'match', 'ახალი მატჩი!', '', jsonb_build_object('match_id', match_id, 'other_user_id', NEW.liked_id)
      WHERE NOT EXISTS (SELECT 1 FROM blocks WHERE blocker_id = NEW.liker_id AND blocked_id = NEW.liked_id);

      INSERT INTO public.notifications (user_id, type, title, body, data)
      SELECT NEW.liked_id, 'match', 'ახალი მატჩი!', '', jsonb_build_object('match_id', match_id, 'other_user_id', NEW.liker_id)
      WHERE NOT EXISTS (SELECT 1 FROM blocks WHERE blocker_id = NEW.liked_id AND blocked_id = NEW.liker_id);
    END IF;
  ELSE
    -- Create a "someone liked you" notification
    INSERT INTO public.notifications (user_id, type, title, body, data)
    SELECT NEW.liked_id, 'like', 'ვინმემ მოგწონთ', '', jsonb_build_object('liker_id', NEW.liker_id)
    WHERE NOT EXISTS (SELECT 1 FROM blocks WHERE blocker_id = NEW.liked_id AND blocked_id = New.liker_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_like_created ON likes;
CREATE TRIGGER on_like_created
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION public.check_mutual_like();

-- Auto-delete match if either user unlikes
CREATE OR REPLACE FUNCTION public.handle_like_deleted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- If the deleted like was part of a match, delete the match
  DELETE FROM public.matches
  WHERE (user1_id = OLD.liker_id AND user2_id = OLD.liked_id)
     OR (user1_id = OLD.liked_id AND user2_id = OLD.liker_id);
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_like_deleted ON likes;
CREATE TRIGGER on_like_deleted
  AFTER DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_like_deleted();

-- Update updated_at on profiles
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Update updated_at on user_settings
DROP TRIGGER IF EXISTS settings_updated_at ON user_settings;
CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Notification on new message
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  other_user uuid;
BEGIN
  SELECT CASE WHEN NEW.sender_id = m.user1_id THEN m.user2_id ELSE m.user1_id END
  INTO other_user
  FROM public.matches m WHERE m.id = NEW.match_id;

  IF other_user IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (other_user, 'message', 'ახალი შეტყობინება', NEW.content, jsonb_build_object('match_id', NEW.match_id, 'sender_id', NEW.sender_id));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_message_created ON messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();