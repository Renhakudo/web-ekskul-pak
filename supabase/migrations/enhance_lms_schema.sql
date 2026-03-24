-- ============================================================
-- LMS COMPREHENSIVE ENHANCEMENT MIGRATION
-- ============================================================

-- 1. ENHANCE MATERIALS TABLE
ALTER TABLE materials
  ADD COLUMN IF NOT EXISTS module_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS content_text TEXT,
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 2. ENHANCE DISCUSSIONS (REPLIES) FOR THREADING
ALTER TABLE replies
  ADD COLUMN IF NOT EXISTS parent_reply_id UUID REFERENCES replies(id) ON DELETE CASCADE;

-- 3. CREATE CLASS_SESSIONS TABLE FOR ATTENDANCE
CREATE TABLE IF NOT EXISTS class_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  unique_code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE(class_id, session_date)
);

-- Note: Ensure RLS policies are created or updated for class_sessions if needed
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Enable read access for authenticated users on class_sessions"
  ON class_sessions FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow insert/update/delete for guru and admin
CREATE POLICY "Enable all access for guru and admin on class_sessions"
  ON class_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('guru', 'admin')
    )
  );
