/*
  # Fix community feed and chat issues

  1. Database Policy Fixes
    - Fix RLS policies for daily_progress to properly show public posts
    - Ensure community interactions work correctly
    - Fix profile access for community features

  2. Security
    - Maintain proper RLS while allowing public content visibility
    - Ensure users can only modify their own content
*/

-- Drop and recreate the problematic policy for daily_progress
DROP POLICY IF EXISTS "Users can read accessible progress" ON daily_progress;

-- Create a simpler, more reliable policy for reading progress
CREATE POLICY "Users can read accessible progress"
  ON daily_progress
  FOR SELECT
  TO authenticated
  USING (
    -- Users can always read their own progress
    auth.uid() = user_id OR 
    -- Users can read public progress from non-blocked users
    (
      visibility = 'public' AND 
      user_id NOT IN (
        SELECT blocked_id 
        FROM user_blocks 
        WHERE blocker_id = auth.uid()
      )
    )
  );

-- Ensure anonymous users can also read public progress (for community feed)
DROP POLICY IF EXISTS "Public can read public progress" ON daily_progress;
CREATE POLICY "Public can read public progress"
  ON daily_progress
  FOR SELECT
  TO anon
  USING (visibility = 'public');

-- Fix profiles policy to ensure community features work
DROP POLICY IF EXISTS "Public can read public profiles" ON profiles;
CREATE POLICY "Public can read public profiles"
  ON profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Ensure community interactions policies are correct
DROP POLICY IF EXISTS "Users can read all interactions" ON community_interactions;
CREATE POLICY "Users can read all interactions"
  ON community_interactions
  FOR SELECT
  TO authenticated
  USING (true);

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS daily_progress_public_visibility_idx ON daily_progress(visibility) WHERE visibility = 'public';
CREATE INDEX IF NOT EXISTS daily_progress_user_visibility_idx ON daily_progress(user_id, visibility);