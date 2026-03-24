'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Loader2, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface AdminUserActionsProps {
    userId: string
    currentRole: string
}

export function AdminUserActions({ userId, currentRole }: AdminUserActionsProps) {
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [pendingRole, setPendingRole] = useState<string | null>(null)

    const handleChangeRole = (newRole: string) => {
        if (newRole === currentRole) return
        setPendingRole(newRole)
        setIsOpen(true)
    }

    const confirmChangeRole = async () => {
        if (!pendingRole) return

        setLoading(true)
        const { error } = await supabase
            .from('profiles')
            .update({ role: pendingRole })
            .eq('id', userId)

        if (error) {
            toast.error('Gagal mengubah role: ' + error.message)
            setPendingRole(null)
        } else {
            toast.success(`Berhasil mengubah role menjadi ${pendingRole}`)
            router.refresh()
        }
        setLoading(false)
        setIsOpen(false)
    }

    const cancelChangeRole = () => {
        setPendingRole(null)
        setIsOpen(false)
    }

    if (loading) {
        return (
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled>
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Menyimpan...
            </Button>
        )
    }

    return (
        <>
            <Select value={pendingRole || currentRole} onValueChange={handleChangeRole}>
                <SelectTrigger className="h-7 w-[90px] text-xs border-slate-200">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="siswa" className="text-xs">Siswa</SelectItem>
                    <SelectItem value="guru" className="text-xs">Guru</SelectItem>
                    <SelectItem value="admin" className="text-xs">Admin</SelectItem>
                </SelectContent>
            </Select>

            <Dialog open={isOpen} onOpenChange={(open) => { if (!open) cancelChangeRole(); setIsOpen(open); }}>
                <DialogContent className="border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[24px] max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="font-black text-xl text-slate-900 flex items-center gap-2">
                            <AlertTriangle className="h-6 w-6 text-yellow-500" /> Ubah Hak Akses?
                        </DialogTitle>
                    </DialogHeader>
                    <p className="font-bold text-slate-600 my-2 text-sm">Anda yakin ingin mengubah role user ini menjadi <span className="text-slate-900 uppercase underline">{pendingRole}</span>?</p>
                    <div className="flex gap-3 justify-end mt-4">
                        <Button variant="outline" onClick={cancelChangeRole} className="font-bold border-2 border-slate-900 h-10 text-xs">Batal</Button>
                        <Button onClick={confirmChangeRole} className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-black border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] h-10 text-xs">
                            Ya, Ubah Role
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
