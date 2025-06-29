/*
  # Create daily progress table

  1. New Tables
    - `daily_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `date` (date, for the progress entry)
      - `heading` (text, required)
      - `description` (text, optional)
      - `video_url` (text, optional)
      - `image_url` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `daily_progress` table
    - Add policies for users to manage their own progress entries
    - Add unique constraint on user_id + date to prevent duplicate entries per day

  3. Indexes
    - Add index on user_id for faster queries
    - Add index on date for sorting
*/

-- Create daily_progress table
CREATE TABLE IF NOT EXISTS daily_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  heading text NOT NULL,
  description text,
  video_url text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint to prevent multiple entries per day per user
ALTER TABLE daily_progress 
ADD CONSTRAINT unique_user_date 
UNIQUE (user_id, date);

-- Enable RLS
ALTER TABLE daily_progress ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own progress"
  ON daily_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON daily_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON daily_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON daily_progress
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS daily_progress_user_id_idx ON daily_progress(user_id);
CREATE INDEX IF NOT EXISTS daily_progress_date_idx ON daily_progress(date DESC);
CREATE INDEX IF NOT EXISTS daily_progress_user_date_idx ON daily_progress(user_id, date DESC);

-- Create trigger for updated_at
CREATE TRIGGER daily_progress_updated_at
  BEFORE UPDATE ON daily_progress
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();