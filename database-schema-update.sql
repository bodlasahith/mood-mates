-- Database Schema Updates for MoodMates
-- Run this in your Supabase SQL editor

-- 1. Add missing status field to friends table
ALTER TABLE friends ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 2. Add missing fields to moods table
ALTER TABLE moods ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE moods ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 1;

-- 3. Check if we need to rename emoji to mood (if using emoji field)
-- Uncomment this line if your moods table uses 'emoji' instead of 'mood'
-- ALTER TABLE moods RENAME COLUMN emoji TO mood;

-- 4. Add constraints for better data integrity
ALTER TABLE friends DROP CONSTRAINT IF EXISTS friends_status_check;
ALTER TABLE friends ADD CONSTRAINT friends_status_check 
  CHECK (status IN ('sent', 'received', 'accepted', 'declined', 'blocked'));

-- 5. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);
CREATE INDEX IF NOT EXISTS idx_moods_user_id ON moods(user_id);
CREATE INDEX IF NOT EXISTS idx_moods_created_at ON moods(created_at);

-- 6. Update RLS policies for better security

-- Enable RLS on tables if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE moods ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own friendships" ON friends;
DROP POLICY IF EXISTS "Users can insert their own moods" ON moods;
DROP POLICY IF EXISTS "Users can view friends' moods" ON moods;
DROP POLICY IF EXISTS "Users can view their own record" ON users;
DROP POLICY IF EXISTS "Users can insert their own record" ON users;
DROP POLICY IF EXISTS "Users can update their own record" ON users;

-- Create new RLS policies

-- Users table policies
CREATE POLICY "Users can view their own record" ON users
  FOR SELECT USING (auth.email() = email);

CREATE POLICY "Users can insert their own record" ON users
  FOR INSERT WITH CHECK (auth.email() = email);

CREATE POLICY "Users can update their own record" ON users
  FOR UPDATE USING (auth.email() = email);

-- Friends table policies
CREATE POLICY "Users can manage their own friendships" ON friends
  FOR ALL USING (auth.email() = (SELECT email FROM users WHERE id = user_id));

-- Moods table policies
CREATE POLICY "Users can insert their own moods" ON moods
  FOR INSERT WITH CHECK (auth.email() = (SELECT email FROM users WHERE id = user_id));

CREATE POLICY "Users can view friends' moods" ON moods
  FOR SELECT USING (
    user_id IN (
      SELECT friend_id FROM friends 
      WHERE user_id = (SELECT id FROM users WHERE email = auth.email())
      AND status = 'accepted'
    )
    OR user_id = (SELECT id FROM users WHERE email = auth.email())
  );

-- 7. Add helpful comments
COMMENT ON COLUMN friends.status IS 'Friend request status: sent (outgoing request), received (incoming request), accepted, declined, blocked';
COMMENT ON COLUMN moods.streak IS 'Number of consecutive days user has logged moods';
COMMENT ON COLUMN moods.color IS 'Hex color associated with the mood emoji';

-- Done! Your database schema is now updated for the new features.