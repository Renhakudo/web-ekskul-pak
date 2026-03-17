-- ============================================================
-- LEARNING ACTIVITY STREAK MIGRATION
-- Jalankan skrip ini di Supabase SQL Editor
-- ============================================================

-- 1. Tambah kolom last_activity_date (DATE) jika belum ada
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_activity_date DATE;

-- 2. Salin data lama dari last_attended_at ke last_activity_date
--    (hanya jika format kolom lama adalah 'YYYY-MM-DD')
UPDATE profiles
  SET last_activity_date = last_attended_at::date
  WHERE last_attended_at IS NOT NULL
    AND last_attended_at ~ '^\d{4}-\d{2}-\d{2}$'
    AND last_activity_date IS NULL;

-- 3. Pastikan kolom streak tidak NULL (default 0)
UPDATE profiles
  SET streak = 0
  WHERE streak IS NULL;

ALTER TABLE profiles
  ALTER COLUMN streak SET DEFAULT 0;

-- ============================================================
-- CATATAN:
-- - Kolom last_attended_at tetap ada di tabel (tidak dihapus)
--   agar absensi masih bisa mencatat riwayat kehadiran.
-- - last_activity_date adalah kolom BARU yang merepresentasikan
--   tanggal terakhir aktivitas belajar bermakna (materi, tugas,
--   quiz, forum, atau absensi).
-- - Sistem streak kini akan menggunakan last_activity_date.
-- ============================================================
