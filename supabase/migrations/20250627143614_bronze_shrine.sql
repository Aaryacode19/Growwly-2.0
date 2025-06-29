/*
  # Add access requests table

  1. New Tables
    - `access_requests`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `full_name` (text)
      - `reason` (text)
      - `company` (text, optional)
      - `portfolio_url` (text, optional)
      - `status` (text, default 'pending')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `access_requests` table
    - Add policy for public insert (anyone can request access)
    - Add policy for admin read (for reviewing requests)
*/

CREATE TABLE IF NOT EXISTS access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  reason text NOT NULL,
  company text,
  portfolio_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit access requests
CREATE POLICY "Anyone can submit access requests"
  ON access_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Only authenticated users can read their own requests
CREATE POLICY "Users can read own requests"
  ON access_requests
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt()->>'email');

-- Create trigger for updated_at
CREATE TRIGGER access_requests_updated_at
  BEFORE UPDATE ON access_requests
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS access_requests_email_idx ON access_requests(email);
CREATE INDEX IF NOT EXISTS access_requests_status_idx ON access_requests(status);
CREATE INDEX IF NOT EXISTS access_requests_created_at_idx ON access_requests(created_at DESC);