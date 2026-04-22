import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity-logger'

const VALID_ROLES = ['siswa', 'guru', 'admin'] as const
type ValidRole = typeof VALID_ROLES[number]

/**
 * POST /api/admin/change-role
 *
 * Body: { targetUserId: string, newRole: string }
 *
 * Strategi update (diurut dari paling aman):
 * 1. Admin Client (service_role key) — bypass RLS total
 * 2. RPC SECURITY DEFINER — fungsi DB yang berjalan as db owner, bypass RLS
 * 3. Direct server client — butuh RLS policy "admin bisa update semua profile"
 *
 * Setelah update, VERIFIKASI bahwa nilai role di DB benar-benar berubah.
 * Ini mendeteksi kasus di mana RLS memblokir secara diam-diam (0 rows, no error).
 */
export async function POST(request: NextRequest) {
    try {
        // === LANGKAH 1: Parse request body ===
        let body: { targetUserId?: string; newRole?: string }
        try {
            body = await request.json()
        } catch {
            return NextResponse.json(
                { success: false, error: 'Request body tidak valid (bukan JSON).' },
                { status: 400 }
            )
        }

        const { targetUserId, newRole } = body

        // === LANGKAH 2: Validasi input ===
        if (!targetUserId || typeof targetUserId !== 'string') {
            return NextResponse.json(
                { success: false, error: 'targetUserId tidak valid atau kosong.' },
                { status: 400 }
            )
        }
        if (!newRole || !VALID_ROLES.includes(newRole as ValidRole)) {
            return NextResponse.json(
                { success: false, error: `Role tidak valid. Pilihan: ${VALID_ROLES.join(', ')}.` },
                { status: 400 }
            )
        }

        // === LANGKAH 3: Verifikasi sesi caller dari cookie (server-side) ===
        const supabase = await createClient()
        const { data: { user: callerUser }, error: authError } = await supabase.auth.getUser()

        if (authError || !callerUser) {
            return NextResponse.json(
                { success: false, error: 'Tidak terautentikasi. Silakan login kembali.' },
                { status: 401 }
            )
        }

        // === LANGKAH 4: Verifikasi caller adalah ADMIN dari database ===
        const { data: callerProfile, error: callerError } = await supabase
            .from('profiles')
            .select('role, full_name')
            .eq('id', callerUser.id)
            .single()

        if (callerError || !callerProfile) {
            return NextResponse.json(
                { success: false, error: 'Profil pengguna aktif tidak ditemukan.' },
                { status: 403 }
            )
        }

        if (callerProfile.role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Akses ditolak. Hanya administrator yang dapat mengubah role pengguna.' },
                { status: 403 }
            )
        }

        // === LANGKAH 5: Cegah self-demotion ===
        if (targetUserId === callerUser.id) {
            return NextResponse.json(
                { success: false, error: 'Tidak dapat mengubah role diri sendiri. Hubungi administrator lain.' },
                { status: 400 }
            )
        }

        // === LANGKAH 6: Ambil role lama target user ===
        const { data: targetProfile, error: targetError } = await supabase
            .from('profiles')
            .select('id, full_name, role')
            .eq('id', targetUserId)
            .single()

        if (targetError || !targetProfile) {
            return NextResponse.json(
                { success: false, error: 'Pengguna target tidak ditemukan di database.' },
                { status: 404 }
            )
        }

        const oldRole = targetProfile.role
        if (oldRole === newRole) {
            return NextResponse.json(
                { success: false, error: `Pengguna sudah memiliki role '${newRole}'.` },
                { status: 400 }
            )
        }

        // === LANGKAH 7: Eksekusi update dengan strategi berlapis ===
        // Perubahan ini HANYA mengubah kolom 'role' di profiles.
        // Tidak menyentuh: submissions, points_logs, attendances, user_badges,
        //                  discussions, replies, class_members, streak, points.
        // Semua data historis join by user_id UUID yang tidak berubah.

        let updateSucceeded = false
        let lastError = ''

        // --- Strategi A: Admin Client via service_role key (paling aman) ---
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (serviceRoleKey) {
            try {
                const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
                const adminDb = createSupabaseClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    serviceRoleKey,
                    { auth: { autoRefreshToken: false, persistSession: false } }
                )
                const { error } = await adminDb
                    .from('profiles')
                    .update({ role: newRole })
                    .eq('id', targetUserId)
                if (!error) {
                    updateSucceeded = true
                } else {
                    lastError = `[admin-client] ${error.message}`
                    console.error('[change-role] Admin client error:', error)
                }
            } catch (e) {
                lastError = `[admin-client] Exception: ${e}`
                console.error('[change-role] Admin client exception:', e)
            }
        }

        // --- Strategi B: RPC SECURITY DEFINER (jika ada, bypass RLS tanpa service key) ---
        if (!updateSucceeded) {
            const { data: rpcData, error: rpcError } = await supabase.rpc('admin_change_user_role', {
                p_target_user_id: targetUserId,
                p_new_role: newRole,
                p_caller_id: callerUser.id,
            })

            if (!rpcError) {
                // RPC mengembalikan true jika berhasil, false jika caller bukan admin
                if (rpcData === true) {
                    updateSucceeded = true
                } else {
                    lastError = '[rpc] Fungsi mengembalikan false (access denied)'
                }
            } else {
                // RPC belum ada — catat tapi lanjut ke strategi C
                if (rpcError.code !== 'PGRST202' && rpcError.code !== '42883') {
                    lastError = `[rpc] ${rpcError.message}`
                    console.warn('[change-role] RPC error:', rpcError.code, rpcError.message)
                } else {
                    console.info('[change-role] RPC admin_change_user_role belum ada, coba direct update.')
                }
            }
        }

        // --- Strategi C: Direct server client (butuh RLS policy "admin bisa update semua profile") ---
        if (!updateSucceeded) {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', targetUserId)

            if (!error) {
                // KRITIS: Verifikasi bahwa update benar-benar tersimpan (RLS bisa silent block)
                const { data: verifyData } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', targetUserId)
                    .single()

                if (verifyData?.role === newRole) {
                    updateSucceeded = true
                } else {
                    lastError =
                        '[direct] RLS memblokir update secara diam-diam. ' +
                        'Jalankan SQL migration di Supabase, atau tambahkan SUPABASE_SERVICE_ROLE_KEY ke .env.local'
                    console.error('[change-role] Silent RLS block detected. Role tidak berubah di DB.')
                }
            } else {
                lastError = `[direct] ${error.message}`
                console.error('[change-role] Direct update error:', error)
            }
        }

        // === LANGKAH 8: Respons akhir ===
        if (!updateSucceeded) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        'Gagal mengubah role. ' + lastError +
                        '\n\nSolusi: Jalankan file supabase/migrations/add_role_change_logs.sql ' +
                        'di Supabase SQL Editor, atau tambahkan SUPABASE_SERVICE_ROLE_KEY ke .env.local',
                },
                { status: 500 }
            )
        }

        // === LANGKAH 9: Audit log ke role_change_logs (graceful) ===
        try {
            const { error: logError } = await supabase.from('role_change_logs').insert({
                changed_by: callerUser.id,
                target_user_id: targetUserId,
                old_role: oldRole,
                new_role: newRole,
            })
            if (logError) {
                console.warn('[change-role] Log insert error (mungkin tabel belum ada):', logError.message)
            }
        } catch {
            console.warn('[change-role] Tabel role_change_logs belum ada, skip logging.')
        }

        // === LANGKAH 10: Log ke activity_logs terpusat ===
        await logActivity(supabase, {
            userId: targetUserId,
            actorId: callerUser.id,
            eventType: 'role_change',
            eventCategory: 'admin',
            metadata: {
                oldRole,
                newRole,
                adminName: callerProfile.full_name,
                targetName: targetProfile.full_name,
            },
        })

        console.log(
            `[change-role] ✅ Admin '${callerProfile.full_name}' mengubah role ` +
            `'${targetProfile.full_name}': ${oldRole} → ${newRole}`
        )

        return NextResponse.json({
            success: true,
            message: `Role berhasil diubah: ${oldRole} → ${newRole}`,
            data: { targetUserId, targetName: targetProfile.full_name, oldRole, newRole },
        })

    } catch (err) {
        console.error('[change-role] Unexpected error:', err)
        return NextResponse.json(
            { success: false, error: 'Terjadi kesalahan server yang tidak terduga.' },
            { status: 500 }
        )
    }
}
