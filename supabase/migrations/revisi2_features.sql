-- ============================================================
-- REVISI 2 — LMS COMPREHENSIVE ENHANCEMENT MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. TAMBAH KOLOM CATEGORY KE TABEL CLASSES
ALTER TABLE classes ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- 2. TAMBAH KOLOM MODULE_NAME KE MATERIALS (jika belum ada dari migration sebelumnya)
ALTER TABLE materials ADD COLUMN IF NOT EXISTS module_name VARCHAR(255);

-- 3. BUAT TABEL CLASS_TEACHERS (Multi-Guru per kelas)
CREATE TABLE IF NOT EXISTS class_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'co_teacher', -- 'co_teacher' | 'grader'
  granted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(class_id, user_id)
);

ALTER TABLE class_teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "class_teachers_select_auth" ON class_teachers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "class_teachers_all_admin" ON class_teachers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- 4. BUAT TABEL MATERIAL_PROGRESS (tracking selesai baca materi)
CREATE TABLE IF NOT EXISTS material_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT TRUE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, material_id)
);

ALTER TABLE material_progress ENABLE ROW LEVEL SECURITY;

-- Siswa bisa baca/insert progress sendiri
CREATE POLICY "material_progress_select_own" ON material_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "material_progress_insert_own" ON material_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Guru & admin bisa baca semua progress
CREATE POLICY "material_progress_select_guru_admin" ON material_progress
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('guru', 'admin'))
  );

-- 5. PASTIKAN CLASS_SESSIONS SUDAH ADA (sudah ada di migration sebelumnya, ini safety check)
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

ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "class_sessions_select_auth" ON class_sessions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "class_sessions_all_guru_admin" ON class_sessions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('guru', 'admin'))
  );

-- 6. PASTIKAN CLASS_MEMBERS SUDAH ADA
CREATE TABLE IF NOT EXISTS class_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(class_id, user_id)
);

ALTER TABLE class_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "class_members_select_auth" ON class_members
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "class_members_insert_own" ON class_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "class_members_delete_own" ON class_members
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "class_members_all_admin" ON class_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- 7. TAMBAH KOLOM XP KE PROFILES jika pakai 'xp' (cek nama kolom yang benar di app = 'points')
-- Already uses 'points' column — skip

-- ============================================================
-- SELESAI — Run di Supabase SQL Editor
-- ============================================================
