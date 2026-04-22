import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Tipe event yang didukung sistem activity log.
 */
export type ActivityEventType =
    // Gamification
    | 'xp_add'
    | 'xp_reduce'
    | 'xp_adjust'
    | 'badge_earned'
    | 'streak_update'
    | 'level_up'
    // Admin actions
    | 'role_change'
    | 'xp_admin_add'
    | 'xp_admin_reduce'
    // Learning
    | 'material_complete'
    | 'assignment_submit'
    | 'quiz_submit'
    // Attendance
    | 'attendance_checkin'
    // Forum
    | 'forum_post'
    | 'forum_reply'
    | 'forum_delete'
    // Auth
    | 'login'
    | 'register'

export type ActivityEventCategory =
    | 'gamification'
    | 'admin'
    | 'learning'
    | 'attendance'
    | 'forum'
    | 'auth'
    | 'system'

export interface LogActivityParams {
    /** User yang menjadi subjek event (misal: siswa yang naik level) */
    userId?: string
    /** Actor yang memicu event (misal: admin yang tambah XP) — null jika sama dgn userId */
    actorId?: string
    /** Jenis event */
    eventType: ActivityEventType
    /** Kategori besar */
    eventCategory: ActivityEventCategory
    /** Data detail tambahan berformat JSON */
    metadata?: Record<string, unknown>
    /** Status event */
    status?: 'success' | 'error' | 'info'
}

/**
 * Helper terpusat untuk mencatat aktivitas ke tabel `activity_logs`.
 *
 * Fail silently — tidak pernah melempar error atau mempengaruhi alur utama.
 * Gunakan ini di mana saja setelah operasi penting berhasil dijalankan.
 *
 * @example
 * await logActivity(supabase, {
 *   userId: user.id,
 *   eventType: 'material_complete',
 *   eventCategory: 'learning',
 *   metadata: { materialId, materialTitle, xpEarned: 50 }
 * })
 */
export async function logActivity(
    supabase: SupabaseClient,
    params: LogActivityParams
): Promise<void> {
    try {
        const { userId, actorId, eventType, eventCategory, metadata = {}, status = 'success' } = params

        const { error } = await supabase.from('activity_logs').insert({
            user_id: userId || null,
            actor_id: actorId || userId || null,
            event_type: eventType,
            event_category: eventCategory,
            metadata,
            status,
        })

        if (error) {
            // Fail silently — log ke console tapi tidak interrupt alur utama
            console.warn(`[activity-logger] Failed to log '${eventType}':`, error.message)
        }
    } catch (err) {
        // Double-safe fail silently
        console.warn(`[activity-logger] Unexpected error for '${params.eventType}':`, err)
    }
}

/**
 * Helper label & warna untuk UI display event types.
 */
export const EVENT_TYPE_CONFIG: Record<string, {
    label: string
    color: string // Tailwind bg class
    textColor: string
    icon: string
}> = {
    xp_add:            { label: '+XP',           color: 'bg-emerald-200', textColor: 'text-emerald-900', icon: '⚡' },
    xp_reduce:         { label: '-XP',           color: 'bg-red-200',     textColor: 'text-red-900',     icon: '⬇' },
    xp_adjust:         { label: 'XP Koreksi',    color: 'bg-orange-200',  textColor: 'text-orange-900',  icon: '✏️' },
    xp_admin_add:      { label: 'Admin +XP',     color: 'bg-emerald-300', textColor: 'text-emerald-900', icon: '👑⚡' },
    xp_admin_reduce:   { label: 'Admin -XP',     color: 'bg-red-300',     textColor: 'text-red-900',     icon: '👑⬇' },
    badge_earned:      { label: 'Badge',          color: 'bg-yellow-200',  textColor: 'text-yellow-900',  icon: '🏅' },
    streak_update:     { label: 'Streak',         color: 'bg-orange-200',  textColor: 'text-orange-900',  icon: '🔥' },
    level_up:          { label: 'Level Up!',      color: 'bg-violet-200',  textColor: 'text-violet-900',  icon: '🎖️' },
    role_change:       { label: 'Ganti Role',     color: 'bg-blue-200',    textColor: 'text-blue-900',    icon: '🔄' },
    material_complete: { label: 'Materi Selesai', color: 'bg-cyan-200',    textColor: 'text-cyan-900',    icon: '📚' },
    assignment_submit: { label: 'Kumpul Tugas',   color: 'bg-indigo-200',  textColor: 'text-indigo-900',  icon: '📝' },
    quiz_submit:       { label: 'Quiz',           color: 'bg-purple-200',  textColor: 'text-purple-900',  icon: '🧠' },
    attendance_checkin:{ label: 'Absensi',        color: 'bg-green-200',   textColor: 'text-green-900',   icon: '✅' },
    forum_post:        { label: 'Post Forum',     color: 'bg-pink-200',    textColor: 'text-pink-900',    icon: '💬' },
    forum_reply:       { label: 'Reply Forum',    color: 'bg-pink-100',    textColor: 'text-pink-800',    icon: '↩️' },
    forum_delete:      { label: 'Hapus Post',     color: 'bg-red-100',     textColor: 'text-red-800',     icon: '🗑️' },
    login:             { label: 'Login',          color: 'bg-slate-200',   textColor: 'text-slate-900',   icon: '🔐' },
    register:          { label: 'Register',       color: 'bg-slate-200',   textColor: 'text-slate-800',   icon: '🆕' },
}

export const CATEGORY_CONFIG: Record<string, { label: string; color: string; textColor: string }> = {
    gamification: { label: 'Gamifikasi', color: 'bg-yellow-300', textColor: 'text-yellow-900' },
    admin:        { label: 'Admin',      color: 'bg-red-300',    textColor: 'text-red-900'    },
    learning:     { label: 'Learning',   color: 'bg-blue-300',   textColor: 'text-blue-900'   },
    attendance:   { label: 'Absensi',    color: 'bg-emerald-300',textColor: 'text-emerald-900'},
    forum:        { label: 'Forum',      color: 'bg-pink-300',   textColor: 'text-pink-900'   },
    auth:         { label: 'Auth',       color: 'bg-slate-300',  textColor: 'text-slate-900'  },
    system:       { label: 'System',     color: 'bg-orange-300', textColor: 'text-orange-900' },
}
