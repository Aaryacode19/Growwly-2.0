/*
  # Remove unique constraint to allow multiple progress entries per day

  1. Changes
    - Drop the unique constraint on user_id + date
    - This allows users to add multiple progress entries for the same day
    - Keep all other constraints and indexes intact

  2. Security
    - Maintain existing RLS policies
    - No changes to security model
*/

-- Drop the unique constraint that prevents multiple entries per day
ALTER TABLE daily_progress DROP CONSTRAINT IF EXISTS unique_user_date;

-- Drop the unique index as well
DROP INDEX IF EXISTS unique_user_date;