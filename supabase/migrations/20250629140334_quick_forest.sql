/*
  # Fix Private Post Privacy Issue

  1. Problem
    - Private posts are visible across different user accounts
    - RLS policies are not properly isolating user data

  2. Solution
    - Update RLS policies to strictly enforce user isolation
    - Ensure private posts are only visible to their creators
    - Fix any policy conflicts

  3. Security
    - Strict user isolation for private content
    - Maintain public visibility for public posts
    - Prevent any cross-user data leakage
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can read accessible progress" ON daily_progress;
DROP POLICY IF EXISTS "Public can read public progress" ON daily_progress;

-- Create strict user isolation policy for authenticated users
CREATE POLICY "Users can read own progress and public posts from others"
  ON daily_progress
  FOR SELECT
  TO authenticated
  USING (
    -- Users can ALWAYS read their own progress (both private and public)
    auth.uid() = user_id 
    OR 
    -- Users can read public progress from OTHER users (not blocked)
    (
      visibility = 'public' 
      AND auth.uid() != user_id  -- Ensure it's from another user
      AND user_id NOT IN (
        SELECT blocked_id 
        FROM user_blocks 
        WHERE blocker_id = auth.uid()
      )
    )
  );

-- Allow anonymous users to read only public progress
CREATE POLICY "Anonymous can read public progress only"
  ON daily_progress
  FOR SELECT
  TO anon
  USING (visibility = 'public');

-- Ensure insert policy is correct (users can only insert their own progress)
DROP POLICY IF EXISTS "Users can insert own progress" ON daily_progress;
CREATE POLICY "Users can insert own progress"
  ON daily_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Ensure update policy is correct (users can only update their own progress)
DROP POLICY IF EXISTS "Users can update own progress" ON daily_progress;
CREATE POLICY "Users can update own progress"
  ON daily_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure delete policy is correct (users can only delete their own progress)
DROP POLICY IF EXISTS "Users can delete own progress" ON daily_progress;
CREATE POLICY "Users can delete own progress"
  ON daily_progress
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add additional indexes for better performance with the new policies
CREATE INDEX IF NOT EXISTS daily_progress_user_visibility_private_idx 
  ON daily_progress (user_id, visibility) 
  WHERE visibility = 'private';

CREATE INDEX IF NOT EXISTS daily_progress_public_others_idx 
  ON daily_progress (visibility, user_id, created_at DESC) 
  WHERE visibility = 'public';

-- Verify the fix with a test query (this should only return the current user's private posts)
-- SELECT * FROM daily_progress WHERE visibility = 'private' AND user_id = auth.uid();