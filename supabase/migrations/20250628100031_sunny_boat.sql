/*
  # Add Community Features

  1. New Tables
    - Add `visibility` column to `daily_progress` table
    - Create `community_interactions` table for likes and comments
    - Create `user_blocks` table for user blocking functionality

  2. Security
    - Update RLS policies for public visibility
    - Add policies for community interactions
    - Add policies for user blocking

  3. Indexes
    - Add indexes for efficient public feed queries
    - Add indexes for interaction queries
*/

-- Add visibility column to daily_progress table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_progress' AND column_name = 'visibility'
  ) THEN
    ALTER TABLE daily_progress ADD COLUMN visibility text DEFAULT 'private' CHECK (visibility IN ('private', 'public'));
  END IF;
END $$;

-- Create community_interactions table
CREATE TABLE IF NOT EXISTS community_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  progress_id uuid REFERENCES daily_progress(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('like', 'comment')),
  content text, -- For comments, null for likes
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, progress_id, type) -- Prevent duplicate likes, but allow multiple comments
);

-- Create user_blocks table for blocking functionality
CREATE TABLE IF NOT EXISTS user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Enable RLS on new tables
ALTER TABLE community_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

-- Update daily_progress policies to include public visibility
DROP POLICY IF EXISTS "Users can read own progress" ON daily_progress;
CREATE POLICY "Users can read accessible progress"
  ON daily_progress
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    (visibility = 'public' AND user_id NOT IN (
      SELECT blocked_id FROM user_blocks WHERE blocker_id = auth.uid()
    ))
  );

-- Allow anonymous users to read public progress
CREATE POLICY "Public can read public progress"
  ON daily_progress
  FOR SELECT
  TO anon
  USING (visibility = 'public');

-- Community interactions policies
CREATE POLICY "Users can read all interactions"
  ON community_interactions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create interactions"
  ON community_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interactions"
  ON community_interactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own interactions"
  ON community_interactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- User blocks policies
CREATE POLICY "Users can read own blocks"
  ON user_blocks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can create blocks"
  ON user_blocks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete own blocks"
  ON user_blocks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = blocker_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS daily_progress_visibility_idx ON daily_progress(visibility);
CREATE INDEX IF NOT EXISTS daily_progress_public_feed_idx ON daily_progress(visibility, created_at DESC) WHERE visibility = 'public';
CREATE INDEX IF NOT EXISTS community_interactions_progress_idx ON community_interactions(progress_id);
CREATE INDEX IF NOT EXISTS community_interactions_user_idx ON community_interactions(user_id);
CREATE INDEX IF NOT EXISTS community_interactions_type_idx ON community_interactions(type);
CREATE INDEX IF NOT EXISTS user_blocks_blocker_idx ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS user_blocks_blocked_idx ON user_blocks(blocked_id);

-- Create trigger for community_interactions updated_at
CREATE TRIGGER community_interactions_updated_at
  BEFORE UPDATE ON community_interactions
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Update profiles table to allow public access for community features
CREATE POLICY "Public can read public profiles"
  ON profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);