/*
  # Fix daily progress table constraints and triggers

  1. Schema Updates
    - Ensure all text fields have proper default values
    - Fix any CASE statement issues in triggers
    - Update constraints to handle empty strings properly

  2. Trigger Updates
    - Fix any triggers that might have incomplete CASE statements
    - Ensure proper handling of NULL vs empty string values

  3. Data Cleanup
    - Convert any existing NULL values to empty strings where appropriate
*/

-- First, let's update any existing NULL values to empty strings
UPDATE daily_progress 
SET 
  description = COALESCE(description, ''),
  video_url = COALESCE(video_url, ''),
  image_url = COALESCE(image_url, '')
WHERE 
  description IS NULL 
  OR video_url IS NULL 
  OR image_url IS NULL;

-- Update the table to set proper defaults
ALTER TABLE daily_progress 
ALTER COLUMN description SET DEFAULT '',
ALTER COLUMN video_url SET DEFAULT '',
ALTER COLUMN image_url SET DEFAULT '';

-- Ensure the visibility constraint handles all cases properly
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'daily_progress_visibility_check' 
    AND table_name = 'daily_progress'
  ) THEN
    ALTER TABLE daily_progress DROP CONSTRAINT daily_progress_visibility_check;
  END IF;
  
  -- Add the constraint back with proper handling
  ALTER TABLE daily_progress ADD CONSTRAINT daily_progress_visibility_check 
    CHECK (visibility IN ('private', 'public'));
END $$;

-- Create or replace the updated_at trigger function to handle all cases
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = COALESCE(NEW.updated_at, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger for daily_progress
DROP TRIGGER IF EXISTS daily_progress_updated_at ON daily_progress;
CREATE TRIGGER daily_progress_updated_at
  BEFORE UPDATE ON daily_progress
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS daily_progress_user_date_visibility_idx 
  ON daily_progress (user_id, date DESC, visibility);

CREATE INDEX IF NOT EXISTS daily_progress_created_at_visibility_idx 
  ON daily_progress (created_at DESC, visibility);