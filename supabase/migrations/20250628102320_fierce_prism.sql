/*
  # Create User Profile System with Achievements and Badges

  1. New Tables
    - `user_achievements` - Track user achievements and badges
    - `achievement_types` - Define available achievements and their criteria
    - Update `profiles` table with additional profile fields

  2. Security
    - Enable RLS on new tables
    - Add policies for profile sharing and achievements

  3. Features
    - Achievement tracking system
    - Badge system for milestones
    - Enhanced profile information
    - Profile sharing capabilities
*/

-- Add new fields to profiles table
DO $$
BEGIN
  -- Add bio field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bio text;
  END IF;

  -- Add location field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'location'
  ) THEN
    ALTER TABLE profiles ADD COLUMN location text;
  END IF;

  -- Add website field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'website'
  ) THEN
    ALTER TABLE profiles ADD COLUMN website text;
  END IF;

  -- Add profile visibility field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'profile_visibility'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_visibility text DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private'));
  END IF;

  -- Add join date display preference
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'show_join_date'
  ) THEN
    ALTER TABLE profiles ADD COLUMN show_join_date boolean DEFAULT true;
  END IF;
END $$;

-- Create achievement_types table
CREATE TABLE IF NOT EXISTS achievement_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  color text NOT NULL DEFAULT '#6366f1',
  criteria jsonb NOT NULL, -- Stores achievement criteria
  points integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_type_id uuid REFERENCES achievement_types(id) ON DELETE CASCADE NOT NULL,
  earned_at timestamptz DEFAULT now(),
  progress jsonb DEFAULT '{}', -- Track progress towards achievement
  is_featured boolean DEFAULT false, -- Whether to show prominently on profile
  UNIQUE(user_id, achievement_type_id)
);

-- Enable RLS
ALTER TABLE achievement_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Achievement types policies (public read)
CREATE POLICY "Anyone can read achievement types"
  ON achievement_types
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- User achievements policies
CREATE POLICY "Users can read all achievements"
  ON user_achievements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own achievements"
  ON user_achievements
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS user_achievements_user_id_idx ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS user_achievements_earned_at_idx ON user_achievements(earned_at DESC);
CREATE INDEX IF NOT EXISTS user_achievements_featured_idx ON user_achievements(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS achievement_types_active_idx ON achievement_types(is_active) WHERE is_active = true;

-- Insert default achievement types
INSERT INTO achievement_types (name, title, description, icon, color, criteria, points) VALUES
  ('first_post', 'First Steps', 'Share your first progress entry', '🎯', '#10b981', '{"type": "progress_count", "target": 1}', 10),
  ('early_bird', 'Early Bird', 'Post progress for 3 consecutive days', '🌅', '#f59e0b', '{"type": "streak", "target": 3}', 25),
  ('consistent', 'Consistency Champion', 'Maintain a 7-day streak', '🔥', '#ef4444', '{"type": "streak", "target": 7}', 50),
  ('dedicated', 'Dedicated Achiever', 'Maintain a 30-day streak', '💪', '#8b5cf6', '{"type": "streak", "target": 30}', 100),
  ('milestone_10', '10 Days Strong', 'Complete 10 progress entries', '📈', '#06b6d4', '{"type": "progress_count", "target": 10}', 30),
  ('milestone_50', 'Half Century', 'Complete 50 progress entries', '🏆', '#f97316', '{"type": "progress_count", "target": 50}', 75),
  ('milestone_100', 'Century Club', 'Complete 100 progress entries', '👑', '#eab308', '{"type": "progress_count", "target": 100}', 150),
  ('social_butterfly', 'Social Butterfly', 'Share 10 public progress entries', '🦋', '#ec4899', '{"type": "public_posts", "target": 10}', 40),
  ('community_supporter', 'Community Supporter', 'Like 25 community posts', '❤️', '#14b8a6', '{"type": "likes_given", "target": 25}', 20),
  ('helpful_friend', 'Helpful Friend', 'Comment on 10 community posts', '💬', '#6366f1', '{"type": "comments_given", "target": 10}', 30)
ON CONFLICT (name) DO NOTHING;

-- Create function to check and award achievements
CREATE OR REPLACE FUNCTION check_and_award_achievements(user_uuid uuid)
RETURNS void AS $$
DECLARE
  user_stats record;
  achievement record;
  current_streak integer;
BEGIN
  -- Get user statistics
  SELECT 
    COUNT(*) as total_posts,
    COUNT(*) FILTER (WHERE visibility = 'public') as public_posts,
    COUNT(DISTINCT date) as unique_days
  INTO user_stats
  FROM daily_progress 
  WHERE user_id = user_uuid;

  -- Calculate current streak
  WITH date_series AS (
    SELECT DISTINCT date 
    FROM daily_progress 
    WHERE user_id = user_uuid 
    ORDER BY date DESC
  ),
  streak_calc AS (
    SELECT 
      date,
      ROW_NUMBER() OVER (ORDER BY date DESC) as rn,
      date - (ROW_NUMBER() OVER (ORDER BY date DESC) || ' days')::interval as group_date
    FROM date_series
  )
  SELECT COUNT(*) INTO current_streak
  FROM streak_calc 
  WHERE group_date = (
    SELECT group_date 
    FROM streak_calc 
    WHERE date = CURRENT_DATE 
    LIMIT 1
  );

  -- Check each achievement type
  FOR achievement IN 
    SELECT * FROM achievement_types WHERE is_active = true
  LOOP
    -- Check if user already has this achievement
    IF NOT EXISTS (
      SELECT 1 FROM user_achievements 
      WHERE user_id = user_uuid AND achievement_type_id = achievement.id
    ) THEN
      -- Check achievement criteria
      CASE achievement.criteria->>'type'
        WHEN 'progress_count' THEN
          IF user_stats.total_posts >= (achievement.criteria->>'target')::integer THEN
            INSERT INTO user_achievements (user_id, achievement_type_id)
            VALUES (user_uuid, achievement.id);
          END IF;
        
        WHEN 'public_posts' THEN
          IF user_stats.public_posts >= (achievement.criteria->>'target')::integer THEN
            INSERT INTO user_achievements (user_id, achievement_type_id)
            VALUES (user_uuid, achievement.id);
          END IF;
        
        WHEN 'streak' THEN
          IF current_streak >= (achievement.criteria->>'target')::integer THEN
            INSERT INTO user_achievements (user_id, achievement_type_id)
            VALUES (user_uuid, achievement.id);
          END IF;
      END CASE;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to check achievements when progress is added
CREATE OR REPLACE FUNCTION trigger_check_achievements()
RETURNS trigger AS $$
BEGIN
  PERFORM check_and_award_achievements(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to daily_progress
DROP TRIGGER IF EXISTS check_achievements_on_progress ON daily_progress;
CREATE TRIGGER check_achievements_on_progress
  AFTER INSERT ON daily_progress
  FOR EACH ROW EXECUTE FUNCTION trigger_check_achievements();