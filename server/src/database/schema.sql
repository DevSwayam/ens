-- Supabase PostgreSQL Schema for Friend Relationships
-- Run this SQL in your Supabase SQL Editor

-- Create friend_relationships table
CREATE TABLE IF NOT EXISTS friend_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  friend_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  CONSTRAINT unique_friendship UNIQUE (user_id, friend_id),
  CONSTRAINT no_self_friendship CHECK (user_id != friend_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_friend_relationships_user_id ON friend_relationships(user_id);
CREATE INDEX IF NOT EXISTS idx_friend_relationships_friend_id ON friend_relationships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friend_relationships_created_at ON friend_relationships(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_friend_relationships_updated_at
  BEFORE UPDATE ON friend_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE friend_relationships ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your auth needs)
-- For now, allowing all operations - you can restrict this based on user authentication
CREATE POLICY "Allow all operations on friend_relationships"
  ON friend_relationships
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Optional: Create a view for bidirectional friendships
CREATE OR REPLACE VIEW bidirectional_friendships AS
SELECT 
  id,
  user_id,
  friend_id,
  created_at,
  updated_at
FROM friend_relationships
UNION
SELECT 
  id,
  friend_id as user_id,
  user_id as friend_id,
  created_at,
  updated_at
FROM friend_relationships;

