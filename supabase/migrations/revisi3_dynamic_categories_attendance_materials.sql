-- ============================================================
-- REVISI 3 — DYNAMIC CATEGORIES, CENTRALIZED ATTENDANCE, MULTI-CONTENT MATERIALS
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- =========================================================
-- 1. TABEL KATEGORI KELAS DINAMIS
-- =========================================================
CREATE TABLE IF NOT EXISTS class_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  color VARCHAR(50) DEFAULT 'bg-slate-400',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(name)
);

ALTER TABLE class_categories ENABLE ROW LEVEL SECURITY;

-- Semua user yang login bisa baca kategori
CREATE POLICY "class_categories_select_auth" ON class_categories
  FOR SELECT USING (auth.role() = 'authenticated');

-- Hanya admin yang bisa insert/update/delete
CREATE POLICY "class_categories_all_admin" ON class_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Ubah kolom category di classes menjadi FK ke class_categories (opsional, gunakan name string)
-- Kita tetap pakai VARCHAR di classes.category untuk backward compatibility
-- tapi isi nilainya harus sesuai dengan class_categories.name

-- Seed kategori default untuk ekskul coding
INSERT INTO class_categories (name, color) VALUES
  ('Web Development', 'bg-violet-400'),
  ('Mobile Development', 'bg-blue-400'),
  ('Data Science', 'bg-cyan-400'),
  ('UI/UX Design', 'bg-pink-400'),
  ('Algoritma & Logika', 'bg-amber-400'),
  ('Backend & Database', 'bg-emerald-400'),
  ('DevOps & Cloud', 'bg-indigo-400'),
  ('Cybersecurity', 'bg-red-400'),
  ('Robotika & IoT', 'bg-orange-400'),
  ('Umum', 'bg-slate-400')
ON CONFLICT (name) DO NOTHING;

-- =========================================================
-- 2. PERBAIKAN TABEL ATTENDANCES UNTUK ABSENSI BERBASIS KODE
-- =========================================================

-- Tambah kolom session_id dan class_id ke attendances (jika belum ada)
ALTER TABLE attendances ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES class_sessions(id) ON DELETE SET NULL;
ALTER TABLE attendances ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL;
ALTER TABLE attendances ADD COLUMN IF NOT EXISTS xp_awarded INTEGER DEFAULT 0;

-- Normalisasi: tambah unique constraint agar siswa tidak bisa absen 2x di sesi yang sama
-- (hanya untuk row baru yang punya session_id)
-- Catatan: constraint partial agar tidak merusak data lama yang session_id-nya NULL
CREATE UNIQUE INDEX IF NOT EXISTS attendances_user_session_unique
  ON attendances (user_id, session_id)
  WHERE session_id IS NOT NULL;

-- =========================================================
-- 3. PASTIKAN class_sessions TIDAK ADA UNIQUE CONSTRAINT HARIAN
-- (agar satu kelas bisa punya beberapa sesi dalam satu hari)
-- =========================================================
-- Drop constraint lama yang membatasi 1 sesi per (class_id, session_date)
-- agar sistem lebih fleksibel
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'class_sessions_class_id_session_date_key'
  ) THEN
    ALTER TABLE class_sessions DROP CONSTRAINT class_sessions_class_id_session_date_key;
  END IF;
END $$;

-- Ganti dengan index saja (non-unique) untuk performa
CREATE INDEX IF NOT EXISTS class_sessions_class_date_idx ON class_sessions (class_id, session_date);

-- Tambah kolom title opsional untuk label sesi
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS title VARCHAR(200);

-- =========================================================
-- 4. TABEL MATERIAL CONTENT BLOCKS (MULTI-KONTEN)
-- =========================================================
CREATE TABLE IF NOT EXISTS material_content_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  block_type VARCHAR(20) NOT NULL CHECK (block_type IN ('text', 'video', 'file_link')),
  content TEXT,        -- HTML untuk blok teks (dari rich editor)
  url TEXT,            -- URL YouTube atau link file
  label TEXT,          -- Label tampilan untuk file_link
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS material_content_blocks_material_idx ON material_content_blocks (material_id, sort_order);

ALTER TABLE material_content_blocks ENABLE ROW LEVEL SECURITY;

-- Semua user yang login bisa baca blok materi
CREATE POLICY "material_blocks_select_auth" ON material_content_blocks
  FOR SELECT USING (auth.role() = 'authenticated');

-- Guru dan admin bisa insert/update/delete
CREATE POLICY "material_blocks_write_guru_admin" ON material_content_blocks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('guru', 'admin'))
  );

-- =========================================================
-- 5. TAMBAH KOLOM STATUS (DRAFT/PUBLISHED) KE MATERIALS
-- =========================================================
ALTER TABLE materials ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published'));
ALTER TABLE materials ADD COLUMN IF NOT EXISTS description TEXT;

-- =========================================================
-- 6. PERBAIKAN NORMALISASI XP (SAMAKAN KE KOLOM points)
-- =========================================================
-- Catatan: Kolom canonical yang dipakai di app adalah 'points'
-- Kolom 'xp' di beberapa tempat harus dimigrasikan
-- Pastikan kedua kolom sinkron
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'xp'
  ) THEN
    -- Sync xp ke points jika points lebih kecil
    UPDATE profiles SET points = GREATEST(points, COALESCE(xp, 0)) WHERE xp IS NOT NULL AND xp > 0;
  END IF;
END $$;

-- ============================================================
-- SELESAI — Jalankan di Supabase SQL Editor
-- ============================================================
