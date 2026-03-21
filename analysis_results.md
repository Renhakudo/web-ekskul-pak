# Analisis & Solusi Limit Email Supabase (Free Tier)

## Akar Masalah
Supabase versi gratis (Free Tier) menyediakan server SMTP bawaan dengan batasan yang sangat ketat untuk mencegah spam, yaitu **sekitar 3 hingga 4 email per jam per proyek**. Jika batas ini terlewati, proses `signUp` (verifikasi email) dan `resetPasswordForEmail` akan ditolak oleh sistem dengan kode HTTP 429 (Too Many Requests).

## Rekomendasi Solusi yang Bisa Diterapkan

### Solusi 1: Matikan "Email Confirmations" (Paling Cepat & Efektif)
Karena ini adalah platform ekstrakurikuler (di mana siswa biasanya sudah saling kenal/diketahui identitasnya), langkah paling masuk akal adalah mematikan syarat verifikasi email.

**Langkah Mandiri di Dashboard Supabase:**
1. Buka Proyek Supabase Anda.
2. Ke menu **Authentication** -> **Providers** -> **Email**.
3. Matikan / *Toggle Off* opsi **Confirm email**.
4. *(Opsional)* Matikan juga **Secure email change** jika sewaktu-waktu siswa ingin ganti email tanpa verifikasi tumpang-tindih.

Dengan ini, **proses registrasi akan langsung berhasil (Instant Login)** dan sama sekali tidak menghabiskan kuota email Supabase.

### Solusi 2: Gunakan Layanan SMTP Pihak Ketiga (Gratis)
Untuk fitur **Lupa Kata Sandi** yang *wajib* mengirim email, server bawaan Supabase tidak dapat diandalkan. Anda perlu menyambungkan "Custom SMTP". Penyedia terbaik gratis saat ini adalah **Resend.com**.

**Langkah Implementasi:**
1. Daftar di [Resend.com](https://resend.com) (Gratis 3.000 email per bulan).
2. Buat API Key di menu *API Keys*.
3. Buka Dashboard Supabase -> **Authentication** -> **Providers** -> **Email**.
4. Aktifkan **Enable Custom SMTP**.
5. Isi data:
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: `[API_KEY_DARI_RESEND]`
   - Sender Email: Email terverifikasi Anda atau `onboarding@resend.dev` (untuk mode tes).

Dengan cara ini, pengiriman email Lupa Sandi akan beralih dari peladen lambat Supabase ke peladen super cepat Resend, meniadakan batasan 3 email/jam.

### Solusi 3: Perbanyak Penggunaan OAuth (Google Login)
Proyek Anda saat ini **sudah memiliki** tombol "Lanjut dengan Google" di form Login. Sistem OAuth tidak memerlukan email konfirmasi atau pengiriman reset sandi (semua di-handle oleh Google).
Pastikan **Google Provider** di Supabase Authentication sudah menyala dan Client ID/Secret sudah terisi. Ini adalah *fallback* (cadangan rute) terbaik.

### Solusi 4: (Kode) Menangani Error Batas di Antarmuka
Meskipun infrastrukturnya ada pada sisi peladen, situs Web Anda ([login/page.tsx](file:///C:/Users/fishw/3D%20Objects/web-ekskul-pak/src/app/%28auth%29/login/page.tsx)) harus dapat menangkap error Limit (Kode Status 429) tersebut lalu memberikan pesan instruksi yang jelas (bukan malah terkesan `Gagal server`).
Saya akan mengubah pesan kegagalan (*error handling*) di form reset/register untuk mencerminkan status ini.

---
## Kesimpulan Eksekusi
Saya akan langsung mengimplementasikan **Solusi 4** ke dalam kode [src/app/(auth)/login/page.tsx](file:///c:/Users/fishw/3D%20Objects/web-ekskul-pak/src/app/%28auth%29/login/page.tsx) sekarang. Untuk **Solusi 1, 2, dan 3**, hal tersebut merupakan konfigurasi di *Dashboard* Supabase yang **perlu Anda lakukan secara manual** karena saya tidak memiliki akses kontrol ke pengaturan server Supabase Anda.
