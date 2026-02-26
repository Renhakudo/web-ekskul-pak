'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function AdminBlogActions({ postId, postTitle }: { postId: string; postTitle: string }) {
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleDelete = async () => {
        if (!confirm(`Hapus artikel "${postTitle}"? Tindakan ini tidak bisa dibatalkan.`)) return
        setLoading(true)
        await supabase.from('blog_posts').delete().eq('id', postId)
        router.refresh()
        setLoading(false)
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-red-600"
            onClick={handleDelete}
            disabled={loading}
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
    )
}
