-- ============================================================
-- ACTIVITY LOGS TABLE MIGRATION
-- Jalankan di Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- ===== TABEL UTAMA =====
CREATE TABLE IF NOT EXISTS activity_logs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- user yang melakukan aksi (misal: siswa yang absen, admin yang ubah XP)
    user_id          UUID REFERENCES profiles(id) ON DELETE SET NULL,
    -- actor = siapa yang memicu aksi ini (bisa sama dengan user_id, atau admin)
    actor_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
    -- tipe event spesifik
    event_type       TEXT NOT NULL,
    -- kategori besar untuk filter
    event_category   TEXT NOT NULL CHECK (event_category IN (
        'gamification', 'admin', 'learning', 'attendance', 'forum', 'auth', 'system'
    )),
    -- data detail event dalam format JSON (fleksibel)
    metadata         JSONB DEFAULT '{}'::jsonb,
    -- status: success / error / info
    status           TEXT DEFAULT 'success' CHECK (status IN ('success', 'error', 'info')),
    created_at       TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ===== INDEXES (untuk query filter yang cepat) =====
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id
    ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor_id
    ON activity_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_event_type
    ON activity_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_event_category
    ON activity_logs(event_category);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at
    ON activity_logs(created_at DESC);
-- Composite index untuk filter user + waktu (paling umum digunakan)
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_time
    ON activity_logs(user_id, created_at DESC);

-- ===== ROW LEVEL SECURITY =====
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Admin bisa baca semua log
CREATE POLICY "Admin can read all activity_logs"
    ON activity_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Semua authenticated user bisa insert log (dikontrol dari sisi aplikasi)
CREATE POLICY "Authenticated can insert activity_logs"
    ON activity_logs FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Admin bisa delete log (untuk fitur clear/archive)
CREATE POLICY "Admin can delete activity_logs"
    ON activity_logs FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ===== CATATAN EVENT TYPES =====
-- Gamification: xp_add, xp_reduce, xp_adjust, badge_earned, streak_update, level_up
-- Admin:        role_change, xp_admin_add, xp_admin_reduce
-- Learning:     material_complete, assignment_submit, quiz_submit
-- Attendance:   attendance_checkin
-- Forum:        forum_post, forum_reply, forum_delete
-- Auth:         login, logout, register

-- ===== VERIFIKASI =====
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'activity_logs';
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'activity_logs';
