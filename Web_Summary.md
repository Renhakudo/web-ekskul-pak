# 📚 Master Project Context: Web Profil & LMS Ekskul (Gamifikasi)

## 1. 🎯 Visi & Tujuan
Membangun sebuah website modern untuk ekstrakurikuler yang berfungsi sebagai:
1. **Public Website:** Profil ekskul yang menarik, informatif, dan interaktif untuk umum.
2. **Internal LMS + Gamification:** Sistem pembelajaran digital untuk Siswa dan Guru yang dilengkapi elemen *game* (XP, Leaderboard, Streak) agar proses belajar lebih seru dan interaktif.

## 2. 🚀 Tech Stack Utama
- **Framework:** Next.js 14/15+ (App Router, Server Components, Turbopack)
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn UI (Radix UI, Lucide Icons)
- **Backend as a Service (BaaS):** Supabase
  - **Auth:** Email/Password (Target: OAuth Google)
  - **Database:** PostgreSQL dengan Row Level Security (RLS)
  - **Realtime:** Sinkronisasi data forum diskusi (Polling/WebSockets)
  - **Storage:** Upload foto profil, dokumen tugas, dan gambar blog (Segera)

---

## 3. 👥 User Roles (Hak Akses)
Sistem menggunakan kontrol akses berbasis role (RBAC) pada tabel `profiles`:
1. **`admin` (Administrator):** - Akses penuh ke seluruh sistem. Mengatur saklar global (Register & Absensi).
   - *Roadmap:* Kelola semua user (ubah role), import/export data, kelola seluruh blog & materi.
2. **`guru` (Teacher):** - *Core:* Membuat kelas, materi, tugas, menilai (grading), moderasi forum (hapus pesan).
   - *Roadmap:* Membuat Quiz auto-koreksi, memantau statistik kelas, kelola blog.
3. **`siswa` (Student):** - *Core:* Mengikuti kelas, baca materi, kumpul tugas, diskusi, isi absensi, dapat XP.
   - *Roadmap:* Share pencapaian (social share), ngerjain Quiz, kumpulin Badge & Streak harian.

---

## 4. 🗄️ Database Schema (Current State - Supabase)

1. **`profiles`** -> `id`, `full_name`, `username`, `bio`, `role`, `points` (XP), `avatar_url`, `updated_at`.
2. **`classes`** -> `id`, `title`, `description`, `created_by`, `created_at`.
3. **`class_members`** -> `id`, `class_id`, `user_id`, `joined_at`.
4. **`materials`** -> `id`, `class_id`, `title`, `type` (video/text/file), `content`, `xp_reward`, `created_at`.
5. **`assignments`** -> `id`, `class_id`, `title`, `description`, `due_date`, `created_at`.
6. **`submissions`** -> `id`, `assignment_id`, `user_id`, `answer`, `file_url`, `score`, `submitted_at`.
7. **`discussions`** -> `id`, `class_id`, `user_id`, `title`, `content`, `created_at`, `updated_at`.
8. **`replies`** -> `id`, `discussion_id`, `user_id`, `content`, `created_at`, `updated_at`.
9. **`attendances`** -> `id`, `user_id`, `status`, `created_at`, `date_only` (Unique Constraint per user per day).
10. **`app_settings`** -> `id` (default 1), `is_attendance_open`, `is_registration_open`, `updated_at`.

*(Catatan untuk AI Agent: Terapkan RLS policy yang ketat untuk setiap operasi CRUD).*

---

## 5. ✅ STATUS IMPLEMENTASI (Sudah Selesai)

1. **Autentikasi & Profiling:** Login, middleware proteksi rute, dan halaman edit profil (Bio, Nama, Username).
2. **LMS Core:** - Admin/Guru bisa buat kelas, materi, dan tugas.
   - Siswa bisa melihat kelas, mengumpulkan tugas.
   - Guru memiliki panel **Grading** untuk memberi nilai (0-100).
3. **Forum Diskusi Terintegrasi:** Forum Q&A per-kelas. Mendukung *inline-editing* (edit pesan sendiri), Hapus pesan (Siswa hapus miliknya, Guru/Admin bebas hapus), dan flag `(diedit)`. Auto-sync data.
4. **Gamification (Tahap 1):** Sistem poin (XP) yang diakumulasi dari absen harian (+10 XP) dan materi. Konversi Level (`Floor(XP/100) + 1`). Global Leaderboard dengan UI podium juara.
5. **Sistem Absensi Pintar:** Terhubung dengan "Saklar Admin". Mencegah *double absen* di hari yang sama.
6. **Admin Global Control:** Halaman `/admin/settings` dengan UI Toggle Switch untuk mematikan/menyalakan fitur "Register" dan "Absensi".

---

## 6. ⏳ ROADMAP PENGEMBANGAN (To-Do List AI Agent)

AI Agent diharapkan fokus mengembangkan fitur-fitur berikut secara bertahap:

### A. Halaman Depan (Public Website / Landing Page)
- **Target UI:** Modern, clean, animasi halus (Framer Motion), responsif.
- **Komponen:** - Hero Section (Nama ekskul, Tagline, CTA Login).
  - Tentang Ekskul (Visi, Misi, Sejarah).
  - Program/Kegiatan & Galeri Dokumentasi.
  - Preview Blog/Berita.
  - Testimoni & Statistik (Anggota, Karya).
  - Footer komprehensif.

### B. Blog & Publikasi
- **Sistem:** CRUD artikel oleh Admin/Guru.
- **Fitur:** Rich text editor, upload cover/gambar (Supabase Storage), kategori/tag.

### C. Advanced LMS (Quiz & Media)
- **Quiz Engine:** Pilihan ganda, auto-koreksi, pembatasan waktu.
- **Materi:** Dukungan native embed YouTube (saat ini baru text/file dasar).

### D. Advanced Gamification & Social
- **Daily Streak:** Sistem hitung *login* berturut-turut ala Duolingo/TikTok.
- **Badges:** Lencana otomatis jika memenuhi syarat (misal: "First Blood" buat tugas pertama).
- **Share Generator:** Auto-generate *Image Card* (Bawaan Next.js `ImageResponse` / `@vercel/og`) yang menampilkan Level, XP, dan Avatar siswa untuk di-share ke medsos.

### E. Advanced Presensi & Laporan (Import/Export)
- **Metode Presensi:** Upgrade dari klik tombol menjadi Input Kode Unik Harian atau Scan QR Code.
- **Export/Import:** Fitur *Export* nilai, absensi, dan data siswa ke CSV/Excel. Fitur *Import* data siswa baru massal.

### F. Dashboard Analitik & Historikal
- **Grafik:** Chart perkembangan poin/nilai siswa (Recharts / Chart.js).
- **Admin Stats:** Total user aktif, total materi, persentase kehadiran ekskul.

---

## 7. 🗺️ Struktur Routing Next.js

**Tersedia (Selesai):**
- `/login`, `/register` (Public)
- `/dashboard` (Siswa Home)
- `/dashboard/courses` (List Kelas)
- `/dashboard/classes/[id]` (Detail Kelas: Tabs Materi, Tugas, Diskusi)
- `/dashboard/absensi` (Check-in Harian)
- `/dashboard/leaderboard` (Peringkat)
- `/dashboard/profile` (Edit Identitas)
- `/admin`, `/admin/classes` (Admin Home & CRUD Kelas)
- `/admin/classes/[id]/grading/[assignmentId]` (Panel Penilaian)
- `/admin/settings` (Global Settings)

**Direncakan (Belum Dibuat):**
- `/` (Landing Page)
- `/blog` (Public List Artikel)
- `/blog/[slug]` (Public Detail Artikel)
- `/admin/blog` (CRUD Artikel)
- `/admin/users` (User Management)
- `/dashboard/quizzes` (Engine Ujian)

---
*Instruksi untuk AI: Saat generate kode baru, gunakan warna tema Slate (slate-900), Emerald (emerald-600), dan Violet (violet-600). Pastikan komponen UI menggunakan pendekatan Shadcn UI dan class Tailwind CSS.*