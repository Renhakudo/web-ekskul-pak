'use client'

import { useState, useEffect } from 'react'
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
    
    // State untuk mencegah Hydration Mismatch
    const [isMounted, setIsMounted] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [pendingRole, setPendingRole] = useState<string | null>(null)

    // Efek ini memastikan komponen Select hanya di-render setelah tiba di Browser
    useEffect(() => {
        setIsMounted(true)
    }, [])

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
            toast.error('Gagal mengubah wewenang: ' + error.message)
            setPendingRole(null)
        } else {
            toast.success(`Berhasil mengangkat warga menjadi ${pendingRole.toUpperCase()}`)
            router.refresh()
        }
        setLoading(false)
        setIsOpen(false)
    }

    const cancelChangeRole = () => {
        setPendingRole(null)
        setIsOpen(false)
    }

    // Tampilan Skeleton saat halaman pertama kali di-load (Mencegah Error Merah)
    if (!isMounted) {
        return (
            <div className="h-10 w-[120px] bg-slate-200 border-2 border-slate-300 rounded-xl animate-pulse shadow-sm"></div>
        )
    }

    if (loading) {
        return (
            <Button variant="outline" className="h-10 w-[120px] text-xs font-black border-2 border-slate-900 rounded-xl cursor-not-allowed uppercase" disabled>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Proses...
            </Button>
        )
    }

    return (
        <>
            <Select value={pendingRole || currentRole} onValueChange={handleChangeRole}>
                {/* Desain Neobrutalism pada Trigger Select */}
                <SelectTrigger className="h-10 w-[120px] border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] font-black text-xs md:text-sm bg-white hover:bg-slate-50 focus:ring-0 focus:shadow-[1px_1px_0px_#0f172a] focus:translate-y-[2px] focus:translate-x-[2px] transition-all rounded-xl uppercase tracking-wider outline-none">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-[1rem] font-bold p-1">
                    <SelectItem value="siswa" className="focus:bg-emerald-300 focus:text-slate-900 focus:font-black cursor-pointer rounded-lg py-2.5 transition-colors uppercase tracking-wider text-xs">
                        Siswa
                    </SelectItem>
                    <SelectItem value="guru" className="focus:bg-violet-300 focus:text-slate-900 focus:font-black cursor-pointer rounded-lg py-2.5 transition-colors uppercase tracking-wider text-xs">
                        Guru
                    </SelectItem>
                    <SelectItem value="admin" className="focus:bg-red-300 focus:text-slate-900 focus:font-black cursor-pointer rounded-lg py-2.5 transition-colors uppercase tracking-wider text-xs">
                        Admin
                    </SelectItem>
                </SelectContent>
            </Select>

            {/* Dialog Konfirmasi Neobrutalism */}
            <Dialog open={isOpen} onOpenChange={(open) => { if (!open) cancelChangeRole(); setIsOpen(open); }}>
                <DialogContent className="border-4 border-slate-900 shadow-[10px_10px_0px_#0f172a] rounded-[24px] max-w-sm bg-[#FDFBF7]">
                    <DialogHeader>
                        <DialogTitle className="font-black text-2xl text-slate-900 flex items-center gap-3">
                            <div className="bg-yellow-300 p-2 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] transform -rotate-6">
                                <AlertTriangle className="h-6 w-6 text-slate-900" />
                            </div>
                            Ubah Pangkat?
                        </DialogTitle>
                    </DialogHeader>
                    <p className="font-bold text-slate-600 my-4 text-base">
                        Anda yakin ingin mengangkat warga ini menjadi <span className="text-slate-900 font-black uppercase px-2 py-0.5 bg-yellow-200 border-2 border-slate-900 rounded-md shadow-sm mx-1">{pendingRole}</span>?
                    </p>
                    <div className="flex gap-3 justify-end mt-2">
                        <Button 
                            variant="outline" 
                            onClick={cancelChangeRole} 
                            className="font-black uppercase tracking-wider border-2 border-slate-900 h-12 rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            Batal
                        </Button>
                        <Button 
                            onClick={confirmChangeRole} 
                            className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-black border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] active:shadow-none active:translate-y-1 h-12 rounded-xl uppercase tracking-wider transition-all"
                        >
                            Ya, Laksanakan!
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}