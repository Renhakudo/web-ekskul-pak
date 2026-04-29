-- ============================================================
-- FIX RLS ATTENDANCES (MENGIZINKAN ADMIN & GURU BACA DATA)
-- ============================================================

-- Pastikan RLS aktif
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;

-- 1. Policy untuk Admin (Bisa lihat semua data absensi)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'attendances' 
      AND policyname = 'attendances_select_admin'
  ) THEN
    CREATE POLICY "attendances_select_admin" ON attendances
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
      );
  END IF;
END $$;

-- 2. Policy untuk Guru (Bisa lihat semua data absensi)
-- (Catatan: bisa dibatasi hanya untuk kelasnya dengan join ke classes, 
--  tapi untuk mempermudah akses dashboard, kita buka hak baca level global untuk guru)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'attendances' 
      AND policyname = 'attendances_select_guru'
  ) THEN
    CREATE POLICY "attendances_select_guru" ON attendances
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'guru')
      );
  END IF;
END $$;

-- 3. Policy untuk Admin & Guru (Opsional: menghapus absensi)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'attendances' 
      AND policyname = 'attendances_delete_admin_guru'
  ) THEN
    CREATE POLICY "attendances_delete_admin_guru" ON attendances
      FOR DELETE USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'guru'))
      );
  END IF;
END $$;

-- 3.5. Policy untuk Siswa (Bisa INSERT dan SELECT absensinya sendiri)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'attendances' 
      AND policyname = 'attendances_insert_user'
  ) THEN
    CREATE POLICY "attendances_insert_user" ON attendances
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'attendances' 
      AND policyname = 'attendances_select_user'
  ) THEN
    CREATE POLICY "attendances_select_user" ON attendances
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================
-- FIX RLS CLASS_SESSIONS (Siswa perlu baca sesi kelas saat absen)
-- ============================================================

-- Pastikan RLS aktif
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;

-- 4. Policy agar Siswa bisa melihat detail sesi (dibutuhkan saat validasi kode absensi)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'class_sessions' 
      AND policyname = 'class_sessions_select_all'
  ) THEN
    CREATE POLICY "class_sessions_select_all" ON class_sessions
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;
