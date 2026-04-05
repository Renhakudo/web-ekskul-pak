import { createClient } from '@supabase/supabase-js'

/**
 * Server-only Supabase admin client menggunakan service_role key.
 * BYPASS semua RLS — hanya gunakan server-side dan setelah verifikasi role user.
 * Jangan pernah expose ke client/browser.
 */
export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error(
            'SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env.local. ' +
            'Dapatkan dari Supabase Dashboard → Project Settings → API → service_role key'
        )
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}
