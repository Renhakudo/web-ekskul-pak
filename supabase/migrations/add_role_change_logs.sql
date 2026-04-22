-- ============================================================
-- ROLE CHANGE SECURITY MIGRATION v2
-- Jalankan SELURUH skrip ini di Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- ===== BAGIAN 1: RPC FUNCTION (SECURITY DEFINER) =====
-- Fungsi ini berjalan sebagai DB owner, sehingga bisa bypass RLS
-- tanpa perlu service_role key. Ini solusi yang PALING DIREKOMENDASIKAN
-- jika tidak ingin menambahkan service_role key ke .env.local.

CREATE OR REPLACE FUNCTION admin_change_user_role(
    p_target_user_id UUID,
    p_new_role        TEXT,
    p_caller_id       UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_role TEXT;
BEGIN
    -- 1. Verifikasi bahwa caller adalah admin (double-check, meski API route sudah cek)
    SELECT role INTO v_caller_role
    FROM profiles
    WHERE id = p_caller_id;

    IF v_caller_role IS NULL OR v_caller_role != 'admin' THEN
        RAISE EXCEPTION 'AKSES DITOLAK: Hanya admin yang bisa mengubah role.';
        RETURN FALSE;
    END IF;

    -- 2. Validasi role yang diinput
    IF p_new_role NOT IN ('siswa', 'guru', 'admin') THEN
        RAISE EXCEPTION 'Role tidak valid: %', p_new_role;
        RETURN FALSE;
    END IF;

    -- 3. Cegah admin mengubah role dirinya sendiri
    IF p_target_user_id = p_caller_id THEN
        RAISE EXCEPTION 'Tidak bisa mengubah role diri sendiri.';
        RETURN FALSE;
    END IF;

    -- 4. Lakukan update — hanya kolom role
    -- CATATAN: Fungsi ini HANYA mengubah profiles.role.
    -- Tidak menyentuh: submissions, points_logs, attendances, user_badges,
    --                  discussions, replies, class_members, streak, points.
    UPDATE profiles
    SET role = p_new_role
    WHERE id = p_target_user_id;

    -- 5. Cek apakah ada yang terupdate
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target user tidak ditemukan: %', p_target_user_id;
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$;

-- Berikan akses execute ke authenticated users
-- (keamanan sebenarnya ada di dalam fungsi itu sendiri)
GRANT EXECUTE ON FUNCTION admin_change_user_role(UUID, TEXT, UUID) TO authenticated;


-- ===== BAGIAN 2: TABEL AUDIT LOG =====

CREATE TABLE IF NOT EXISTS role_change_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    changed_by      UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    target_user_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    old_role        TEXT NOT NULL,
    new_role        TEXT NOT NULL,
    changed_at      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE role_change_logs ENABLE ROW LEVEL SECURITY;

-- Hanya admin yang bisa baca log
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'role_change_logs' AND policyname = 'Admin can read role_change_logs'
    ) THEN
        CREATE POLICY "Admin can read role_change_logs"
            ON role_change_logs FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
                )
            );
    END IF;
END $$;

-- Admin bisa insert log
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'role_change_logs' AND policyname = 'Admin can insert role_change_logs'
    ) THEN
        CREATE POLICY "Admin can insert role_change_logs"
            ON role_change_logs FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
                )
            );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_role_change_logs_changed_at ON role_change_logs (changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_role_change_logs_target ON role_change_logs (target_user_id);


-- ===== BAGIAN 3: RLS POLICY UNTUK profiles (UPDATE) =====
-- Tambahkan policy ini supaya direct update (Strategi C) juga bekerja.

-- Policy: Admin bisa update profil siapapun
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'profiles' AND policyname = 'Admin can update any profile'
    ) THEN
        CREATE POLICY "Admin can update any profile"
            ON profiles FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM profiles p
                    WHERE p.id = auth.uid() AND p.role = 'admin'
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM profiles p
                    WHERE p.id = auth.uid() AND p.role = 'admin'
                )
            );
    END IF;
END $$;

-- Policy: User biasa hanya bisa update profil dirinya sendiri
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile"
            ON profiles FOR UPDATE
            USING (auth.uid() = id)
            WITH CHECK (auth.uid() = id);
    END IF;
END $$;


-- ===== BAGIAN 4: VERIFIKASI (Jalankan terpisah untuk cek) =====
-- SELECT proname, prosecdef FROM pg_proc WHERE proname = 'admin_change_user_role';
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'role_change_logs';
-- SELECT policyname, cmd FROM pg_policies WHERE tablename IN ('profiles', 'role_change_logs');
