/*
  # URGENT: Fix Private Post Privacy Leak

  1. Security Fix
    - Drop ALL existing policies on daily_progress
    - Create NEW strict policies that properly isolate user data
    - Ensure private posts are ONLY visible to their owners

  2. Policy Logic
    - Own posts: Users see ALL their own posts (private + public)
    - Others' posts: Users see ONLY public posts from other users
    - Private posts: Completely isolated per user account

  3. Testing
    - Private posts from User A should NEVER be visible to User B
    - Public posts should be visible to everyone
*/

-- STEP 1: Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own progress and public posts from others" ON daily_progress;
DROP POLICY IF EXISTS "Anonymous can read public progress only" ON daily_progress;
DROP POLICY IF EXISTS "Users can read accessible progress" ON daily_progress;
DROP POLICY IF EXISTS "Public can read public progress" ON daily_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON daily_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON daily_progress;
DROP POLICY IF EXISTS "Users can delete own progress" ON daily_progress;

-- STEP 2: Create STRICT privacy policies

-- SELECT Policy: Users can ONLY see their own private posts + public posts from others
CREATE POLICY "Users can read own progress and public posts from others"
  ON daily_progress
  FOR SELECT
  TO authenticated
  USING (
    -- CASE 1: User's own posts (both private and public)
    auth.uid() = user_id 
    OR 
    -- CASE 2: Public posts from OTHER users only (not blocked)
    (
      visibility = 'public' 
      AND auth.uid() != user_id  -- Must be from a different user
      AND user_id NOT IN (
        SELECT blocked_id 
        FROM user_blocks 
        WHERE blocker_id = auth.uid()
      )
    )
  );

-- Anonymous users can only see public posts
CREATE POLICY "Anonymous can read public progress only"
  ON daily_progress
  FOR SELECT
  TO anon
  USING (visibility = 'public');

-- INSERT Policy: Users can only create their own posts
CREATE POLICY "Users can insert own progress"
  ON daily_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE Policy: Users can only update their own posts
CREATE POLICY "Users can update own progress"
  ON daily_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE Policy: Users can only delete their own posts
CREATE POLICY "Users can delete own progress"
  ON daily_progress
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- STEP 3: Add performance indexes for the new policies
CREATE INDEX IF NOT EXISTS daily_progress_user_visibility_idx 
  ON daily_progress (user_id, visibility);

CREATE INDEX IF NOT EXISTS daily_progress_public_others_idx 
  ON daily_progress (visibility, user_id, created_at DESC) 
  WHERE visibility = 'public';

-- STEP 4: Verify RLS is enabled
ALTER TABLE daily_progress ENABLE ROW LEVEL SECURITY;

-- Add a comment to track this critical fix
COMMENT ON TABLE daily_progress IS 'Privacy fixed: Private posts are isolated per user account';