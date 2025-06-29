/*
  # Create custom achievements table

  1. New Tables
    - `user_custom_achievements`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `title` (text, required)
      - `description` (text, required)
      - `date_earned` (date, required)
      - `certificate_id` (text, optional)
      - `external_link` (text, optional)
      - `category` (text, required)
      - `issuer` (text, required)
      - `skills` (text array)
      - `is_featured` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_custom_achievements` table
    - Add policies for users to manage their own achievements
    - Allow public read access for profile sharing

  3. Indexes
    - Add indexes for performance
*/

-- Create user_custom_achievements table
CREATE TABLE IF NOT EXISTS user_custom_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  date_earned date NOT NULL,
  certificate_id text,
  external_link text,
  category text NOT NULL,
  issuer text NOT NULL,
  skills text[] DEFAULT '{}',
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_custom_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read all custom achievements"
  ON user_custom_achievements
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can insert own custom achievements"
  ON user_custom_achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom achievements"
  ON user_custom_achievements
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom achievements"
  ON user_custom_achievements
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS user_custom_achievements_user_id_idx ON user_custom_achievements(user_id);
CREATE INDEX IF NOT EXISTS user_custom_achievements_date_earned_idx ON user_custom_achievements(date_earned DESC);
CREATE INDEX IF NOT EXISTS user_custom_achievements_featured_idx ON user_custom_achievements(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS user_custom_achievements_category_idx ON user_custom_achievements(category);

-- Create trigger for updated_at
CREATE TRIGGER user_custom_achievements_updated_at
  BEFORE UPDATE ON user_custom_achievements
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();