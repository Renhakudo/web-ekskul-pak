import type { SupabaseClient } from '@supabase/supabase-js'
import { logActivity } from './activity-logger'

/**
 * Memeriksa dan memberikan badge yang layak diterima oleh user.
 * Dipanggil setelah event penting: absen, selesaikan materi, kumpul tugas.
 */
export async function awardEligibleBadges(userId: string, supabase: SupabaseClient) {
    try {
        // 1. Ambil semua badge yang tersedia
        const { data: allBadges } = await supabase.from('badges').select('*')
        if (!allBadges || allBadges.length === 0) return

        // 2. Ambil badge yang sudah dimiliki user
        const { data: ownedBadges } = await supabase
            .from('user_badges')
            .select('badge_id')
            .eq('user_id', userId)
        const ownedIds = new Set((ownedBadges || []).map((b: any) => b.badge_id))

        // 3. Ambil data user untuk pengecekan kondisi
        const { data: profile } = await supabase
            .from('profiles')
            .select('points, streak')
            .eq('id', userId)
            .single()

        // 4. Ambil jumlah materi yang diselesaikan
        const { count: materialsCompleted } = await supabase
            .from('points_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .ilike('source', 'material_%')

        // 5. Ambil jumlah tugas yang dikumpulkan
        const { count: assignmentsSubmitted } = await supabase
            .from('submissions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)

        const totalXp = profile?.points || 0
        const streak = profile?.streak || 0

        // 6. Cek setiap badge — award jika memenuhi syarat dan belum punya
        const badgesToAward: { badge_id: string; user_id: string }[] = []
        const badgeDetails: Array<{ id: string; name: string; icon: string }> = []

        for (const badge of allBadges) {
            if (ownedIds.has(badge.id)) continue // sudah punya, skip

            let qualified = false

            switch (badge.condition_type) {
                case 'total_xp':
                    qualified = totalXp >= badge.condition_value
                    break
                case 'streak':
                    qualified = streak >= badge.condition_value
                    break
                case 'materials_completed':
                    qualified = (materialsCompleted ?? 0) >= badge.condition_value
                    break
                case 'assignments_submitted':
                    qualified = (assignmentsSubmitted ?? 0) >= badge.condition_value
                    break
            }

            if (qualified) {
                badgesToAward.push({ badge_id: badge.id, user_id: userId })
                badgeDetails.push({ id: badge.id, name: badge.name, icon: badge.icon || '🏅' })
            }
        }

        // 7. Insert semua badge baru sekaligus (gunakan onConflict agar aman dari race condition)
        if (badgesToAward.length > 0) {
            await supabase
                .from('user_badges')
                .upsert(badgesToAward, { onConflict: 'user_id,badge_id', ignoreDuplicates: true })

            // Log setiap badge yang diperoleh ke activity_logs
            for (const badge of badgeDetails) {
                await logActivity(supabase, {
                    userId,
                    eventType: 'badge_earned',
                    eventCategory: 'gamification',
                    metadata: {
                        badgeId: badge.id,
                        badgeName: badge.name,
                        badgeIcon: badge.icon,
                    },
                })
            }
        }

        return badgesToAward.length // Jumlah badge baru yang didapat
    } catch (err) {
        // Jika tabel badges belum ada (belum di-migrate), fungsi ini hanya fail silently
        console.warn('awardEligibleBadges: error (mungkin tabel belum ada):', err)
        return 0
    }
}
