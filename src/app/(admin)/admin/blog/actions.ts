'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

function generateSlug(title: string): string {
    return (
        title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim() +
        '-' +
        Date.now().toString(36)
    )
}

export type BlogActionResult = {
    success: boolean
    error?: string
    postId?: string
}

async function verifyAdminOrGuru(): Promise<{ userId: string } | { error: string }> {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: 'Tidak terautentikasi. Silakan login kembali.' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !['admin', 'guru'].includes(profile.role)) {
        return { error: 'Akses ditolak. Hanya admin dan guru yang bisa mengelola blog.' }
    }

    return { userId: user.id }
}

export async function createBlogPost(formData: {
    title: string
    content: string
    category: string
    status: 'draft' | 'published'
    cover_url?: string | null
}): Promise<BlogActionResult> {

    // 1. Verifikasi user adalah admin/guru via regular auth
    const authResult = await verifyAdminOrGuru()
    if ('error' in authResult) return { success: false, error: authResult.error }

    // 2. Gunakan admin client (bypass RLS) untuk insert
    const adminClient = createAdminClient()
    const slug = generateSlug(formData.title)

    const { data, error } = await adminClient
        .from('posts')
        .insert({
            title: formData.title.trim(),
            slug,
            content: formData.content.trim(),
            category: formData.category || null,
            status: formData.status,
            cover_url: formData.cover_url || null,
            author_id: authResult.userId,
        })
        .select('id')
        .single()

    if (error) {
        // Fallback: jika ada kolom yang belum ada, coba insert minimal
        if (error.code === 'PGRST204') {
            const { data: d2, error: e2 } = await adminClient
                .from('posts')
                .insert({ title: formData.title.trim(), content: formData.content.trim() })
                .select('id')
                .single()
            if (e2) { console.error('[createBlogPost] fallback error:', e2); return { success: false, error: e2.message } }
            revalidatePath('/admin/blog'); revalidatePath('/blog')
            return { success: true, postId: d2.id }
        }
        console.error('[createBlogPost] error:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/blog')
    revalidatePath('/blog')
    return { success: true, postId: data.id }
}

export async function updateBlogPost(
    postId: string,
    formData: {
        title: string
        content: string
        category: string
        status: 'draft' | 'published'
        cover_url?: string | null
    }
): Promise<BlogActionResult> {

    const authResult = await verifyAdminOrGuru()
    if ('error' in authResult) return { success: false, error: authResult.error }

    const adminClient = createAdminClient()
    const { error } = await adminClient
        .from('posts')
        .update({
            title: formData.title.trim(),
            content: formData.content.trim(),
            category: formData.category || null,
            status: formData.status,
            cover_url: formData.cover_url ?? null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', postId)

    if (error) {
        if (error.code === 'PGRST204') {
            await adminClient.from('posts').update({ title: formData.title.trim(), content: formData.content.trim() }).eq('id', postId)
        } else {
            console.error('[updateBlogPost] error:', error)
            return { success: false, error: error.message }
        }
    }

    revalidatePath('/admin/blog')
    revalidatePath('/blog')
    return { success: true }
}

export async function deleteBlogPost(postId: string): Promise<BlogActionResult> {
    const authResult = await verifyAdminOrGuru()
    if ('error' in authResult) return { success: false, error: authResult.error }

    const adminClient = createAdminClient()
    const { error } = await adminClient.from('posts').delete().eq('id', postId)
    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/blog')
    revalidatePath('/blog')
    return { success: true }
}
