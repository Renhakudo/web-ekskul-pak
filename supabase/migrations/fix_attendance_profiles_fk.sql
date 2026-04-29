-- =========================================================================
-- SCRIPT PERBAIKAN: RELASI ATTENDANCES KE PROFILES
-- Tujuannya agar query PostgREST dari admin bisa melakukan JOIN otomatis
-- =========================================================================

-- Tambahkan Foreign Key dari attendances(user_id) ke profiles(id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'attendances_user_id_profiles_fk'
    ) THEN
        ALTER TABLE public.attendances
        ADD CONSTRAINT attendances_user_id_profiles_fk 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id)
        ON DELETE CASCADE;
    END IF;
END $$;
