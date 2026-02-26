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
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AdminUserActionsProps {
    userId: string
    currentRole: string
}

export function AdminUserActions({ userId, currentRole }: AdminUserActionsProps) {
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleChangeRole = async (newRole: string) => {
        if (newRole === currentRole) return
        if (!confirm(`Ubah role user ini menjadi "${newRole}"?`)) return

        setLoading(true)
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId)

        if (error) {
            alert('Gagal mengubah role: ' + error.message)
        } else {
            router.refresh()
        }
        setLoading(false)
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
        <Select defaultValue={currentRole} onValueChange={handleChangeRole}>
            <SelectTrigger className="h-7 w-[90px] text-xs border-slate-200">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="siswa" className="text-xs">Siswa</SelectItem>
                <SelectItem value="guru" className="text-xs">Guru</SelectItem>
                <SelectItem value="admin" className="text-xs">Admin</SelectItem>
            </SelectContent>
        </Select>
    )
}
