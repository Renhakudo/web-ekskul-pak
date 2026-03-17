import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Mengembalikan string tanggal hari ini dalam format 'YYYY-MM-DD'
 * dengan memperhitungkan offset timezone lokal.
 */
function getTodayLocalDate(): string {
    const today = new Date()
    // Koreksi timezone agar tidak geser ke tanggal kemarin/besok saat UTC
    const offset = today.getTimezoneOffset()
    today.setMinutes(today.getMinutes() - offset)
    return today.toISOString().split('T')[0]
}

/**
 * Mengembalikan string tanggal kemarin dalam format 'YYYY-MM-DD'
 * dengan memperhitungkan offset timezone lokal.
 */
function getYesterdayLocalDate(): string {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const offset = yesterday.getTimezoneOffset()
    yesterday.setMinutes(yesterday.getMinutes() - offset)
    return yesterday.toISOString().split('T')[0]
}

/**
 * Memperbarui learning streak pengguna berdasarkan aktivitas belajar bermakna.
 *
 * Aturan streak:
 * - Jika last_activity_date = hari ini   → tidak ada perubahan (idempotent, max 1x per hari)
 * - Jika last_activity_date = kemarin    → streak bertambah 1
 * - Jika lebih lama dari kemarin        → streak direset ke 1
 *
 * Dipanggil dari event: absensi, selesaikan materi, kumpul tugas, submit quiz, posting forum.
 *
 * @param userId   - UUID pengguna yang melakukan aktivitas
 * @param supabase - Supabase client instance (bisa server atau client)
 * @returns        - Nilai streak terbaru setelah update, atau null jika gagal
 */
export async function updateLearningStreak(
    userId: string,
    supabase: SupabaseClient
): Promise<number | null> {
    try {
        const today = getTodayLocalDate()
        const yesterday = getYesterdayLocalDate()

        // Ambil data streak & tanggal aktivitas terakhir dari profil
        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('streak, last_activity_date')
            .eq('id', userId)
            .single()

        if (fetchError || !profile) {
            console.warn('[streak-utils] Gagal mengambil profil:', fetchError?.message)
            return null
        }

        const lastActivityDate: string | null = profile.last_activity_date
        const currentStreak: number = profile.streak || 0

        // --- GUARD: Jika sudah ada aktivitas hari ini, jangan update (idempotent) ---
        if (lastActivityDate === today) {
            return currentStreak // Streak tidak berubah
        }

        // --- Hitung streak baru ---
        let newStreak: number
        if (lastActivityDate === yesterday) {
            // Aktivitas berurutan → lanjutkan streak
            newStreak = currentStreak + 1
        } else {
            // Melewatkan satu hari atau lebih → reset ke 1
            newStreak = 1
        }

        // --- Simpan ke database ---
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                streak: newStreak,
                last_activity_date: today,
            })
            .eq('id', userId)

        if (updateError) {
            console.warn('[streak-utils] Gagal update streak:', updateError.message)
            return null
        }

        return newStreak
    } catch (err) {
        // Fail silently agar tidak menghentikan alur aktivitas utama
        console.warn('[streak-utils] Error tidak terduga:', err)
        return null
    }
}
