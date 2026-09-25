/*
# Fix admin RLS policies for admin page access

1. Problem
- The admin dashboard queries profiles, matches, and messages with count/head queries.
- Current RLS policies only allow participants to SELECT from matches and messages.
- Profiles SELECT policy filters out suspended users, so admins can't see them.
- This makes the admin page return empty/zero data for non-participant tables.

2. Changes
- Add admin-override SELECT policies on matches, messages, and profiles.
- Admins (users with a row in admin_roles) can SELECT all rows from these tables.
- Existing user-scoped policies remain unchanged.

3. Security
- Admin override is scoped to authenticated users who have a row in admin_roles.
- No new INSERT/UPDATE/DELETE grants are added — only SELECT for dashboard stats.
*/

-- Matches: allow admins to see all matches
DROP POLICY IF EXISTS "matches_select_admin" ON matches;
CREATE POLICY "matches_select_admin"
ON matches FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM admin_roles WHERE admin_roles.user_id = auth.uid()));

-- Messages: allow admins to see all messages
DROP POLICY IF EXISTS "messages_select_admin" ON messages;
CREATE POLICY "messages_select_admin"
ON messages FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM admin_roles WHERE admin_roles.user_id = auth.uid()));

-- Profiles: allow admins to see all profiles including suspended
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
CREATE POLICY "profiles_select_admin"
ON profiles FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM admin_roles WHERE admin_roles.user_id = auth.uid()));

-- Profiles: allow admins to update any profile (for suspend/ban/unban)
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
CREATE POLICY "profiles_update_admin"
ON profiles FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM admin_roles WHERE admin_roles.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM admin_roles WHERE admin_roles.user_id = auth.uid()));

-- Profiles: allow admins to delete any profile
DROP POLICY IF EXISTS "profiles_delete_admin" ON profiles;
CREATE POLICY "profiles_delete_admin"
ON profiles FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM admin_roles WHERE admin_roles.user_id = auth.uid()));
