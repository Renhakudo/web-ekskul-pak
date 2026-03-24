'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

export function AdminBlogActions({ postId, postTitle }: { postId: string; postTitle: string }) {
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)

    const handleDelete = async () => {
        setLoading(true)
        const { error } = await supabase.from('blog_posts').delete().eq('id', postId)
        if (error) {
            toast.error("Gagal menghapus: " + error.message)
        } else {
            toast.success("Artikel berhasil dilenyapkan!")
            router.refresh()
        }
        setLoading(false)
        setIsOpen(false)
    }

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-red-600"
                onClick={() => setIsOpen(true)}
                disabled={loading}
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[24px] max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="font-black text-2xl text-red-600 flex items-center gap-2">
                            <Trash2 className="h-6 w-6"/> Hapus Artikel?
                        </DialogTitle>
                    </DialogHeader>
                    <p className="font-bold text-slate-600 my-2 text-sm">Yakin ingin menghapus artikel "<span className="text-slate-900">{postTitle}</span>"? Tindakan ini permanen.</p>
                    <div className="flex gap-3 justify-end mt-4">
                        <Button variant="outline" onClick={() => setIsOpen(false)} className="font-bold border-2 border-slate-900 h-10 text-xs">Batal</Button>
                        <Button onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white font-black border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] h-10 text-xs" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Ya, Hapus!
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
