/*
# Add location coordinates to profiles

## Overview
Adds latitude and longitude columns to the profiles table so users can store
their geographic location. This enables distance calculation between users
in the discovery (swipe) page.

## Changes
- `profiles.latitude` (double precision, nullable) — user's latitude
- `profiles.longitude` (double precision, nullable) — user's longitude

## Security
- No RLS policy changes needed. The existing profiles_update_self policy
  already allows users to update their own profile row, and latitude/longitude
  are user-editable fields (like city). The existing profiles_select_all
  policy already allows reading other profiles for discovery.

## Notes
1. Both columns are nullable — existing profiles will have NULL coordinates
2. Users can set coordinates via browser geolocation or city-based defaults
3. Coordinates are only used for distance display, not for access control
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longitude double precision;

-- Index for potential future distance-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
