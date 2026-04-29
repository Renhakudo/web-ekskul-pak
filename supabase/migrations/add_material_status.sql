-- Tambah kolom status ke tabel materials untuk fitur Draft & Publish
ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published'));
