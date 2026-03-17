-- Struktur tabel (badges & user_badges) DILARANG diubah/dihapus karena telah dibuat oleh pengguna.
-- Kode SQL di bawah ini HANYA MENDALAMKAN SISTEM KEAMANAN (RLS) pada tabel yang sudah ada.

-- Mengaktifkan RLS untuk badges
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Semua orang bisa melihat badges" ON badges;
CREATE POLICY "Semua orang bisa melihat badges"
  ON badges FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin bisa kelola badges" ON badges;
CREATE POLICY "Admin bisa kelola badges"
  ON badges FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Mengaktifkan RLS untuk user_badges
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Semua orang bisa melihat user_badges" ON user_badges;
CREATE POLICY "Semua orang bisa melihat user_badges"
  ON user_badges FOR SELECT USING (true);

DROP POLICY IF EXISTS "Siswa bisa claim badge mereka" ON user_badges;
CREATE POLICY "Siswa bisa claim badge mereka"
  ON user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);
