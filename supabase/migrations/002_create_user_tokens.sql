-- Create tesla_user_access_tokens table for storing sensitive OAuth tokens
CREATE TABLE IF NOT EXISTS tesla_user_access_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tesla_access_token TEXT NOT NULL,
  tesla_refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE tesla_user_access_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy: Users cannot read their own tokens (server-side only)
-- This ensures tokens are never exposed to the client
CREATE POLICY "No client access to tokens"
  ON tesla_user_access_tokens FOR SELECT
  USING (false);

-- Create policy: Only service role can insert/update tokens
-- This is handled server-side via service role key
-- Regular users cannot insert or update tokens directly

-- Create function to update updated_at timestamp
CREATE TRIGGER update_tesla_user_access_tokens_updated_at
  BEFORE UPDATE ON tesla_user_access_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

