import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity-logger'

const VALID_MODES = ['add', 'reduce', 'set'] as const
type Mode = typeof VALID_MODES[number]

/**
 * POST /api/admin/manage-xp
 *
 * Body:
 *   { targetUserId: string, delta: number, reason: string, mode?: 'add'|'reduce'|'set' }
 * 
 * mode 'add'    → points += delta  (delta harus positif)
 * mode 'reduce' → points -= delta  (delta harus positif, hasil min 0)
 * mode 'set'    → points = delta   (set langsung ke nilai tertentu, min 0)
 *
 * Bulk variant (array):
 *   { userIds: string[], delta: number, reason: string, mode?: 'add'|'reduce' }
 */
export async function POST(request: NextRequest) {
    try {
        let body: {
            targetUserId?: string
            userIds?: string[]
            delta?: number
            reason?: string
            mode?: string
        }
        try {
            body = await request.json()
        } catch {
            return NextResponse.json({ success: false, error: 'Request body tidak valid.' }, { status: 400 })
        }

        const { targetUserId, userIds, reason, mode = 'add' } = body
        const delta = Number(body.delta)

        // === Validasi Input ===
        if (!VALID_MODES.includes(mode as Mode)) {
            return NextResponse.json({ success: false, error: `Mode tidak valid. Pilihan: ${VALID_MODES.join(', ')}.` }, { status: 400 })
        }
        if (isNaN(delta) || delta < 0) {
            return NextResponse.json({ success: false, error: 'delta harus berupa angka positif.' }, { status: 400 })
        }
        if (mode !== 'set' && delta === 0) {
            return NextResponse.json({ success: false, error: 'delta tidak boleh 0.' }, { status: 400 })
        }
        if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
            return NextResponse.json({ success: false, error: 'Alasan harus diisi minimal 3 karakter.' }, { status: 400 })
        }

        const targetIds: string[] = []
        if (targetUserId && typeof targetUserId === 'string') {
            targetIds.push(targetUserId)
        } else if (Array.isArray(userIds) && userIds.length > 0) {
            if (userIds.length > 50) {
                return NextResponse.json({ success: false, error: 'Maksimal 50 user sekaligus.' }, { status: 400 })
            }
            targetIds.push(...userIds)
        } else {
            return NextResponse.json({ success: false, error: 'targetUserId atau userIds harus diisi.' }, { status: 400 })
        }

        // === Verifikasi sesi caller (server-side) ===
        const supabase = await createClient()
        const { data: { user: callerUser }, error: authError } = await supabase.auth.getUser()
        if (authError || !callerUser) {
            return NextResponse.json({ success: false, error: 'Tidak terautentikasi.' }, { status: 401 })
        }

        // === Verifikasi caller adalah ADMIN dari DB ===
        const { data: callerProfile } = await supabase
            .from('profiles').select('role, full_name').eq('id', callerUser.id).single()
        if (!callerProfile || callerProfile.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Akses ditolak. Hanya administrator.' }, { status: 403 })
        }

        // === Eksekusi per user ===
        const results: Array<{
            userId: string; success: boolean; oldPoints: number; newPoints: number;
            oldLevel: number; newLevel: number; leveledUp: boolean; error?: string
        }> = []

        for (const uid of targetIds) {
            // Cegah admin ubah XP diri sendiri (opsional, tapi good practice)
            if (uid === callerUser.id) {
                results.push({ userId: uid, success: false, oldPoints: 0, newPoints: 0, oldLevel: 1, newLevel: 1, leveledUp: false, error: 'Tidak bisa ubah XP diri sendiri.' })
                continue
            }

            // Ambil data profile target
            const { data: targetProfile, error: tErr } = await supabase
                .from('profiles').select('id, full_name, points').eq('id', uid).single()
            if (tErr || !targetProfile) {
                results.push({ userId: uid, success: false, oldPoints: 0, newPoints: 0, oldLevel: 1, newLevel: 1, leveledUp: false, error: 'User tidak ditemukan.' })
                continue
            }

            const oldPoints: number = targetProfile.points || 0
            const oldLevel = Math.floor(oldPoints / 100) + 1

            let newPoints: number
            if (mode === 'add') {
                newPoints = oldPoints + delta
            } else if (mode === 'reduce') {
                newPoints = Math.max(0, oldPoints - delta)
            } else { // set
                newPoints = Math.max(0, delta)
            }
            const newLevel = Math.floor(newPoints / 100) + 1
            const leveledUp = newLevel > oldLevel

            // Lakukan update XP - coba via service_role key dulu
            let updateOk = false
            const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
            if (serviceRoleKey) {
                try {
                    const { createClient: sc } = await import('@supabase/supabase-js')
                    const adminDb = sc(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
                        auth: { autoRefreshToken: false, persistSession: false }
                    })
                    const { error: upErr } = await adminDb.from('profiles').update({ points: newPoints }).eq('id', uid)
                    if (!upErr) updateOk = true
                } catch { /* fallthrough */ }
            }

            if (!updateOk) {
                const { error: upErr } = await supabase.from('profiles').update({ points: newPoints }).eq('id', uid)
                if (!upErr) {
                    // Verifikasi tidak di-silent block oleh RLS
                    const { data: vd } = await supabase.from('profiles').select('points').eq('id', uid).single()
                    if (vd?.points === newPoints) updateOk = true
                }
            }

            if (!updateOk) {
                results.push({ userId: uid, success: false, oldPoints, newPoints: oldPoints, oldLevel, newLevel: oldLevel, leveledUp: false, error: 'Gagal update XP. Cek RLS policy atau tambah SUPABASE_SERVICE_ROLE_KEY.' })
                continue
            }

            // Insert points_log
            const source = `admin_xp_${mode}_${Date.now()}`
            const logDelta = mode === 'add' ? delta : mode === 'reduce' ? -Math.min(delta, oldPoints) : (newPoints - oldPoints)
            try {
                await supabase.from('points_logs').insert({
                    user_id: uid,
                    amount: logDelta,
                    reason: `[Admin] ${reason.trim()}`,
                    source,
                })
            } catch { /* graceful */ }

            // Activity log
            const eventType = mode === 'add' ? 'xp_admin_add' : mode === 'reduce' ? 'xp_admin_reduce' : 'xp_adjust'
            await logActivity(supabase, {
                userId: uid,
                actorId: callerUser.id,
                eventType,
                eventCategory: 'admin',
                metadata: {
                    oldPoints, newPoints, delta: logDelta,
                    reason: reason.trim(),
                    adminName: callerProfile.full_name,
                    targetName: targetProfile.full_name,
                    leveledUp, oldLevel, newLevel,
                },
            })

            // Log level_up jika ada
            if (leveledUp) {
                await logActivity(supabase, {
                    userId: uid,
                    actorId: callerUser.id,
                    eventType: 'level_up',
                    eventCategory: 'gamification',
                    metadata: { oldLevel, newLevel, triggeredBy: 'admin_xp_change' },
                })
            }

            results.push({ userId: uid, success: true, oldPoints, newPoints, oldLevel, newLevel, leveledUp })
        }

        const allSuccess = results.every(r => r.success)
        const anySuccess = results.some(r => r.success)

        return NextResponse.json({
            success: anySuccess,
            isBulk: targetIds.length > 1,
            results,
            summary: {
                total: results.length,
                succeeded: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                levelUps: results.filter(r => r.leveledUp).length,
            },
        }, { status: allSuccess ? 200 : anySuccess ? 207 : 500 })

    } catch (err) {
        console.error('[manage-xp] Unexpected error:', err)
        return NextResponse.json({ success: false, error: 'Kesalahan server tidak terduga.' }, { status: 500 })
    }
}
