'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    Loader2, AlertTriangle, ArrowRight, ShieldAlert, Info,
    Zap, Plus, Minus, TrendingUp, ChevronUp
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface AdminUserActionsProps {
    userId: string
    currentRole: string
    currentPoints: number
    userName: string
}

const ROLE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    siswa: { label: 'Siswa', color: 'text-emerald-900', bg: 'bg-emerald-200' },
    guru:  { label: 'Guru',  color: 'text-violet-900',  bg: 'bg-violet-200'  },
    admin: { label: 'Admin', color: 'text-red-900',     bg: 'bg-red-200'     },
}

function RolePill({ role }: { role: string }) {
    const info = ROLE_LABELS[role] || { label: role, color: 'text-slate-900', bg: 'bg-slate-200' }
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] font-black uppercase text-xs ${info.bg} ${info.color}`}>
            {info.label}
        </span>
    )
}

function getWarningMessage(oldRole: string, newRole: string): string | null {
    if (newRole === 'admin') return 'Akses ADMIN memberikan kendali penuh atas seluruh sistem.'
    if (oldRole === 'guru' && newRole === 'siswa') return 'Kelas dan materi yang sudah dibuat tidak akan hilang, namun ia tidak dapat mengakses panel guru lagi.'
    if (oldRole === 'admin' && newRole !== 'admin') return 'Pengguna ini akan kehilangan seluruh hak akses administrator.'
    return null
}

function calcLevel(points: number): number {
    return Math.floor(points / 100) + 1
}

// ====================================================================
// SUB COMPONENT: XP Manager Modal
// ====================================================================
function XpManagerModal({
    isOpen, onClose, userId, userName, currentPoints, onSuccess
}: {
    isOpen: boolean
    onClose: () => void
    userId: string
    userName: string
    currentPoints: number
    onSuccess: (newPoints: number) => void
}) {
    const [mode, setMode] = useState<'add' | 'reduce'>('add')
    const [delta, setDelta] = useState('')
    const [reason, setReason] = useState('')
    const [loading, setLoading] = useState(false)

    const deltaNum = parseInt(delta, 10) || 0
    const currentLevel = calcLevel(currentPoints)
    const previewPoints = mode === 'add'
        ? currentPoints + deltaNum
        : Math.max(0, currentPoints - deltaNum)
    const previewLevel = calcLevel(previewPoints)
    const willLevelUp = previewLevel > currentLevel
    const willLevelDown = previewLevel < currentLevel

    const handleReset = () => {
        setDelta('')
        setReason('')
        setMode('add')
    }

    const handleClose = () => {
        handleReset()
        onClose()
    }

    const handleSubmit = async () => {
        if (!deltaNum || deltaNum <= 0) {
            toast.error('Masukkan jumlah XP yang valid (lebih dari 0).')
            return
        }
        if (!reason.trim() || reason.trim().length < 3) {
            toast.error('Alasan harus diisi minimal 3 karakter.')
            return
        }

        setLoading(true)
        try {
            const response = await fetch('/api/admin/manage-xp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: userId, delta: deltaNum, reason: reason.trim(), mode }),
            })
            const result = await response.json()

            if (!response.ok || !result.success) {
                const errMsg = result.results?.[0]?.error || result.error || 'Gagal mengubah XP.'
                toast.error(errMsg)
            } else {
                const r = result.results?.[0]
                if (r?.leveledUp) {
                    toast.success(`🎖️ ${userName} NAIK ke Level ${r.newLevel}! XP: ${r.oldPoints} → ${r.newPoints}`, { duration: 5000 })
                } else {
                    const emoji = mode === 'add' ? '⚡' : '⬇️'
                    toast.success(`${emoji} XP ${userName}: ${r?.oldPoints ?? currentPoints} → ${r?.newPoints ?? previewPoints}`)
                }
                onSuccess(r?.newPoints ?? previewPoints)
                handleClose()
            }
        } catch {
            toast.error('Koneksi gagal. Periksa jaringan dan coba lagi.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
            <DialogContent className="border-4 border-slate-900 shadow-[10px_10px_0px_#0f172a] rounded-[24px] max-w-md bg-[#FDFBF7] p-0 overflow-hidden">
                {/* Header */}
                <div className="bg-violet-400 border-b-4 border-slate-900 p-6">
                    <DialogHeader>
                        <DialogTitle className="font-black text-2xl text-slate-900 flex items-center gap-3">
                            <div className="bg-white p-2 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] transform -rotate-6 shrink-0">
                                <Zap className="h-6 w-6 text-violet-700" />
                            </div>
                            Manager XP
                        </DialogTitle>
                    </DialogHeader>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {/* Target User */}
                    <div className="bg-white border-2 border-slate-900 rounded-2xl p-4 shadow-[3px_3px_0px_#0f172a]">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Target</p>
                        <p className="font-black text-slate-900 text-lg truncate">{userName}</p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span className="text-xs font-black bg-yellow-200 border-2 border-slate-900 px-2 py-0.5 rounded-lg shadow-[2px_2px_0px_#0f172a]">
                                {currentPoints} XP
                            </span>
                            <span className="text-xs font-black bg-violet-200 border-2 border-slate-900 px-2 py-0.5 rounded-lg shadow-[2px_2px_0px_#0f172a]">
                                Level {currentLevel}
                            </span>
                        </div>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex bg-slate-100 border-2 border-slate-900 rounded-2xl p-1.5 gap-1">
                        <button
                            onClick={() => setMode('add')}
                            className={`flex-1 py-2.5 rounded-xl font-black text-sm uppercase flex items-center justify-center gap-2 transition-all ${mode === 'add' ? 'bg-emerald-400 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] text-slate-900' : 'text-slate-500 hover:bg-slate-200'}`}
                        >
                            <Plus className="h-4 w-4" /> Tambah
                        </button>
                        <button
                            onClick={() => setMode('reduce')}
                            className={`flex-1 py-2.5 rounded-xl font-black text-sm uppercase flex items-center justify-center gap-2 transition-all ${mode === 'reduce' ? 'bg-red-400 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] text-slate-900' : 'text-slate-500 hover:bg-slate-200'}`}
                        >
                            <Minus className="h-4 w-4" /> Kurangi
                        </button>
                    </div>

                    {/* Delta Input */}
                    <div className="space-y-2">
                        <Label className="font-black text-slate-900 uppercase text-xs">Jumlah XP</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                min={1}
                                max={99999}
                                value={delta}
                                onChange={(e) => setDelta(e.target.value)}
                                placeholder="Contoh: 50"
                                className="h-12 border-2 border-slate-900 font-black text-xl focus:shadow-[4px_4px_0px_#0f172a] focus-visible:ring-0 rounded-xl bg-slate-50 pr-16"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-black text-sm">XP</span>
                        </div>
                        {/* Quick amount buttons */}
                        <div className="flex gap-2 flex-wrap">
                            {[10, 25, 50, 100, 200].map(v => (
                                <button
                                    key={v}
                                    onClick={() => setDelta(String(v))}
                                    className={`px-3 py-1.5 text-xs font-black border-2 border-slate-900 rounded-xl shadow-[2px_2px_0px_#0f172a] transition-all hover:-translate-y-0.5 ${delta === String(v) ? (mode === 'add' ? 'bg-emerald-400' : 'bg-red-400') : 'bg-white hover:bg-slate-100'}`}
                                >
                                    {mode === 'add' ? '+' : '-'}{v}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Reason Input */}
                    <div className="space-y-2">
                        <Label className="font-black text-slate-900 uppercase text-xs">Alasan</Label>
                        <Input
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Contoh: Bonus tugas ekstra, koreksi XP..."
                            className="h-12 border-2 border-slate-900 font-bold focus:shadow-[4px_4px_0px_#0f172a] focus-visible:ring-0 rounded-xl bg-slate-50"
                        />
                    </div>

                    {/* Preview */}
                    {deltaNum > 0 && (
                        <div className={`border-2 rounded-xl p-4 flex items-center justify-between gap-3 ${willLevelUp ? 'bg-violet-50 border-violet-400' : willLevelDown ? 'bg-red-50 border-red-400' : 'bg-slate-50 border-slate-300'}`}>
                            <div>
                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Preview Hasil</p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="font-black text-slate-600">{currentPoints} XP</span>
                                    <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
                                    <span className={`font-black text-lg ${mode === 'add' ? 'text-emerald-700' : 'text-red-700'}`}>
                                        {previewPoints} XP
                                    </span>
                                </div>
                            </div>
                            {willLevelUp && (
                                <div className="flex items-center gap-1.5 bg-violet-400 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] px-3 py-2 rounded-xl shrink-0">
                                    <ChevronUp className="h-4 w-4 text-slate-900" />
                                    <span className="font-black text-xs text-slate-900 uppercase">Lv {currentLevel} → {previewLevel}</span>
                                    <TrendingUp className="h-4 w-4 text-slate-900" />
                                </div>
                            )}
                            {willLevelDown && (
                                <div className="flex items-center gap-1.5 bg-red-200 border-2 border-slate-900 px-3 py-2 rounded-xl shrink-0">
                                    <span className="font-black text-xs text-slate-900 uppercase">Lv {currentLevel} → {previewLevel}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-end pt-1">
                        <Button variant="outline" onClick={handleClose} className="font-black uppercase border-2 border-slate-900 h-12 rounded-xl">
                            Batal
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading || !deltaNum || deltaNum <= 0}
                            className={`font-black border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] active:shadow-none active:translate-y-1 h-12 rounded-xl uppercase tracking-wider transition-all disabled:opacity-50 ${mode === 'add' ? 'bg-emerald-400 hover:bg-emerald-300' : 'bg-red-400 hover:bg-red-300'} text-slate-900`}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : (mode === 'add' ? <Plus className="h-4 w-4 mr-2" /> : <Minus className="h-4 w-4 mr-2" />)}
                            Terapkan!
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ====================================================================
// MAIN COMPONENT: AdminUserActions
// ====================================================================
export function AdminUserActions({ userId, currentRole, currentPoints: initialPoints, userName }: AdminUserActionsProps) {
    const router = useRouter()

    const [isMounted, setIsMounted] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isRoleOpen, setIsRoleOpen] = useState(false)
    const [isXpOpen, setIsXpOpen] = useState(false)
    const [pendingRole, setPendingRole] = useState<string | null>(null)
    const [displayRole, setDisplayRole] = useState(currentRole)
    const [localPoints, setLocalPoints] = useState(initialPoints)

    useEffect(() => { setDisplayRole(currentRole) }, [currentRole])
    useEffect(() => { setLocalPoints(initialPoints) }, [initialPoints])
    useEffect(() => { setIsMounted(true) }, [])

    const handleChangeRole = (newRole: string) => {
        if (newRole === currentRole) return
        setPendingRole(newRole)
        setIsRoleOpen(true)
    }

    const confirmChangeRole = async () => {
        if (!pendingRole) return
        setLoading(true)
        try {
            const response = await fetch('/api/admin/change-role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: userId, newRole: pendingRole }),
            })
            const result = await response.json()
            if (!response.ok || !result.success) {
                toast.error(result.error || 'Gagal mengubah role.')
                setDisplayRole(currentRole)
            } else {
                toast.success(`✅ ${userName} kini menjadi ${ROLE_LABELS[pendingRole]?.label || pendingRole}`)
                setDisplayRole(pendingRole)
                router.refresh()
            }
        } catch {
            toast.error('Koneksi gagal.')
            setDisplayRole(currentRole)
        } finally {
            setLoading(false)
            setPendingRole(null)
            setIsRoleOpen(false)
        }
    }

    const cancelChangeRole = () => {
        setDisplayRole(currentRole)
        setPendingRole(null)
        setIsRoleOpen(false)
    }

    const warningMessage = pendingRole ? getWarningMessage(currentRole, pendingRole) : null

    if (!isMounted) {
        return <div className="flex gap-2"><div className="h-10 w-[115px] bg-slate-200 border-2 border-slate-300 rounded-xl animate-pulse" /><div className="h-10 w-10 bg-slate-200 border-2 border-slate-300 rounded-xl animate-pulse" /></div>
    }

    if (loading) {
        return <Button disabled className="h-10 w-[120px] text-xs font-black border-2 border-slate-900 rounded-xl uppercase"><Loader2 className="h-4 w-4 animate-spin mr-2" />Proses...</Button>
    }

    return (
        <>
            {/* Action Buttons Row */}
            <div className="flex items-center gap-2">
                {/* Role Dropdown */}
                <Select value={displayRole} onValueChange={handleChangeRole}>
                    <SelectTrigger className="h-10 w-[115px] border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] font-black text-xs bg-white hover:bg-slate-50 focus:ring-0 focus:shadow-[1px_1px_0px_#0f172a] focus:translate-y-[1px] transition-all rounded-xl uppercase tracking-wider outline-none">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-[1rem] font-bold p-1">
                        <SelectItem value="siswa" className="focus:bg-emerald-300 focus:font-black cursor-pointer rounded-lg py-2.5 uppercase text-xs">Siswa</SelectItem>
                        <SelectItem value="guru"  className="focus:bg-violet-300 focus:font-black cursor-pointer rounded-lg py-2.5 uppercase text-xs">Guru</SelectItem>
                        <SelectItem value="admin" className="focus:bg-red-300   focus:font-black cursor-pointer rounded-lg py-2.5 uppercase text-xs">Admin</SelectItem>
                    </SelectContent>
                </Select>

                {/* XP Button */}
                <button
                    onClick={() => setIsXpOpen(true)}
                    title={`XP: ${localPoints} | Level ${calcLevel(localPoints)}`}
                    className="h-10 w-10 bg-yellow-300 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] rounded-xl flex items-center justify-center hover:bg-yellow-200 active:shadow-none active:translate-y-0.5 transition-all shrink-0"
                >
                    <Zap className="h-4 w-4 text-slate-900" />
                </button>
            </div>

            {/* Role Change Confirmation Dialog */}
            <Dialog open={isRoleOpen} onOpenChange={(open) => { if (!open) cancelChangeRole() }}>
                <DialogContent className="border-4 border-slate-900 shadow-[10px_10px_0px_#0f172a] rounded-[24px] max-w-md bg-[#FDFBF7] p-0 overflow-hidden">
                    <div className="bg-yellow-300 border-b-4 border-slate-900 p-6">
                        <DialogHeader>
                            <DialogTitle className="font-black text-2xl text-slate-900 flex items-center gap-3">
                                <div className="bg-white p-2 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] transform -rotate-6 shrink-0">
                                    <AlertTriangle className="h-6 w-6 text-slate-900" />
                                </div>
                                Konfirmasi Ubah Pangkat
                            </DialogTitle>
                        </DialogHeader>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="bg-white border-2 border-slate-900 rounded-2xl p-4 shadow-[3px_3px_0px_#0f172a]">
                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Target</p>
                            <p className="font-black text-slate-900 text-lg truncate">{userName}</p>
                            <div className="flex items-center gap-3 mt-3 flex-wrap">
                                <RolePill role={currentRole} />
                                <ArrowRight className="h-4 w-4 text-slate-600 shrink-0" />
                                <RolePill role={pendingRole || ''} />
                            </div>
                        </div>
                        <div className="flex items-start gap-3 bg-blue-50 border-2 border-blue-300 rounded-xl p-3">
                            <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                            <p className="text-xs font-bold text-blue-800 leading-relaxed">
                                Data historis (XP, tugas, badge, streak, forum) tidak tersentuh. Hanya hak akses yang berubah.
                            </p>
                        </div>
                        {warningMessage && (
                            <div className="flex items-start gap-3 bg-orange-50 border-2 border-orange-300 rounded-xl p-3">
                                <ShieldAlert className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                                <p className="text-xs font-bold text-orange-800">{warningMessage}</p>
                            </div>
                        )}
                        <div className="flex gap-3 justify-end pt-2">
                            <Button variant="outline" onClick={cancelChangeRole} className="font-black uppercase border-2 border-slate-900 h-12 rounded-xl hover:bg-slate-200">Batal</Button>
                            <Button onClick={confirmChangeRole} className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-black border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] active:shadow-none active:translate-y-1 h-12 rounded-xl uppercase transition-all">
                                Ya, Ubah!
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* XP Manager Modal */}
            <XpManagerModal
                isOpen={isXpOpen}
                onClose={() => setIsXpOpen(false)}
                userId={userId}
                userName={userName}
                currentPoints={localPoints}
                onSuccess={(newPoints) => {
                    setLocalPoints(newPoints)
                    router.refresh()
                }}
            />
        </>
    )
}