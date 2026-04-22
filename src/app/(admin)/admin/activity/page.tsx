'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Activity, Search, Download, RefreshCw, Trash2,
    ChevronLeft, ChevronRight, Loader2, Filter, X, Info
} from 'lucide-react'
import { EVENT_TYPE_CONFIG, CATEGORY_CONFIG } from '@/lib/activity-logger'
import { toast } from 'sonner'

interface Log {
    id: string
    user_id: string | null
    actor_id: string | null
    event_type: string
    event_category: string
    metadata: Record<string, unknown>
    status: string
    created_at: string
    user_profile?: { full_name: string; username: string; avatar_url: string; role: string } | null
    actor_profile?: { full_name: string; username: string } | null
}

const PAGE_SIZE = 30

const TIME_FILTERS = [
    { label: 'Hari Ini', value: '1d' },
    { label: '7 Hari',   value: '7d' },
    { label: '30 Hari',  value: '30d' },
    { label: 'Semua',    value: 'all' },
]

const CATEGORY_FILTERS = [
    { label: 'Semua',      value: 'all' },
    { label: 'Gamifikasi', value: 'gamification' },
    { label: 'Admin',      value: 'admin' },
    { label: 'Learning',   value: 'learning' },
    { label: 'Absensi',    value: 'attendance' },
    { label: 'Forum',      value: 'forum' },
    { label: 'Auth',       value: 'auth' },
]

function formatRelativeTime(dateStr: string): string {
    const now = Date.now()
    const date = new Date(dateStr).getTime()
    const diff = Math.floor((now - date) / 1000)
    if (diff < 60) return `${diff}d lalu`
    if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`
    if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function MetadataChip({ label, value }: { label: string; value: unknown }) {
    if (value === null || value === undefined || value === '') return null
    return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-full">
            <span className="text-slate-400">{label}:</span> {String(value)}
        </span>
    )
}

function EventBadge({ eventType }: { eventType: string }) {
    const cfg = EVENT_TYPE_CONFIG[eventType] || { label: eventType, color: 'bg-slate-200', textColor: 'text-slate-800', icon: '●' }
    return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-1 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] ${cfg.color} ${cfg.textColor} uppercase tracking-wider whitespace-nowrap`}>
            <span>{cfg.icon}</span> {cfg.label}
        </span>
    )
}

function CategoryBadge({ category }: { category: string }) {
    const cfg = CATEGORY_CONFIG[category] || { label: category, color: 'bg-slate-200', textColor: 'text-slate-700' }
    return (
        <span className={`inline-flex items-center text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${cfg.color} ${cfg.textColor}`}>
            {cfg.label}
        </span>
    )
}

export default function AdminActivityPage() {
    const supabase = createClient()

    const [logs, setLogs] = useState<Log[]>([])
    const [totalCount, setTotalCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(0)
    const [expandedId, setExpandedId] = useState<string | null>(null)

    // Filters
    const [search, setSearch] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [timeFilter, setTimeFilter] = useState('30d')
    const [statusFilter, setStatusFilter] = useState('all')

    // Actions
    const [isClearing, setIsClearing] = useState(false)
    const [isExporting, setIsExporting] = useState(false)

    const fetchLogs = useCallback(async () => {
        setLoading(true)
        try {
            let query = supabase
                .from('activity_logs')
                .select(`
                    id, user_id, actor_id, event_type, event_category, metadata, status, created_at,
                    user_profile:profiles!activity_logs_user_id_fkey(full_name, username, avatar_url, role),
                    actor_profile:profiles!activity_logs_actor_id_fkey(full_name, username)
                `, { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

            // Time filter
            if (timeFilter !== 'all') {
                const days = parseInt(timeFilter)
                const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
                query = query.gte('created_at', cutoff)
            }

            // Category filter
            if (categoryFilter !== 'all') {
                query = query.eq('event_category', categoryFilter)
            }

            // Status filter
            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter)
            }

            const { data, count, error } = await query

            if (error) {
                // Tabel belum ada
                if (error.code === '42P01' || error.message?.includes('does not exist')) {
                    toast.error('Tabel activity_logs belum dibuat. Jalankan SQL migration terlebih dahulu.')
                }
                setLogs([])
                setTotalCount(0)
            } else {
                // Filter search di client (untuk nama user)
                let filtered: any[] = data || []
                if (search.trim()) {
                    filtered = filtered.filter((log: any) => {
                        const name = log.user_profile?.full_name?.toLowerCase() || ''
                        const uname = log.user_profile?.username?.toLowerCase() || ''
                        const evt = log.event_type?.toLowerCase() || ''
                        const q = search.toLowerCase()
                        return name.includes(q) || uname.includes(q) || evt.includes(q)
                    })
                }
                setLogs((data || []) as unknown as Log[])
                setTotalCount(count ?? 0)
            }
        } catch {
            setLogs([])
        } finally {
            setLoading(false)
        }
    }, [supabase, page, categoryFilter, timeFilter, statusFilter, search])

    useEffect(() => {
        setPage(0)
    }, [categoryFilter, timeFilter, statusFilter, search])

    useEffect(() => {
        fetchLogs()
    }, [fetchLogs])

    const handleExportCSV = async () => {
        setIsExporting(true)
        const headers = ['ID', 'Waktu', 'User', 'Username', 'Event', 'Kategori', 'Status', 'Metadata', 'Actor']
        const csvContent = [
            headers.join(','),
            ...logs.map(log =>
                [
                    log.id,
                    `"${new Date(log.created_at).toLocaleString('id-ID')}"`,
                    `"${(log.user_profile as any)?.full_name || '-'}"`,
                    `"${(log.user_profile as any)?.username || '-'}"`,
                    log.event_type,
                    log.event_category,
                    log.status,
                    `"${JSON.stringify(log.metadata).replace(/"/g, "'")}"`,
                    `"${(log.actor_profile as any)?.full_name || '-'}"`,
                ].join(',')
            )
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.setAttribute('href', URL.createObjectURL(blob))
        link.setAttribute('download', `Activity_Log_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success(`Berhasil export ${logs.length} log ke CSV.`)
        setIsExporting(false)
    }

    const handleClearOldLogs = async () => {
        if (!confirm('Hapus semua log yang berusia lebih dari 90 hari? Tindakan ini tidak bisa dibatalkan.')) return
        setIsClearing(true)
        const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
        const { error, count } = await supabase.from('activity_logs').delete({ count: 'exact' }).lt('created_at', cutoff)
        if (error) {
            toast.error('Gagal menghapus log: ' + error.message)
        } else {
            toast.success(`✅ ${count || 0} log lama berhasil dihapus.`)
            fetchLogs()
        }
        setIsClearing(false)
    }

    const totalPages = Math.ceil(totalCount / PAGE_SIZE)

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto min-h-screen font-sans relative z-0 overflow-x-hidden pb-24">

            {/* Background Dot */}
            <div className="absolute inset-0 z-[-1] bg-[radial-gradient(#cbd5e1_2px,transparent_2px)] [background-size:32px_32px] opacity-40 fixed" />

            {/* ====== HEADER ====== */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[2rem] p-6 md:p-10 relative overflow-hidden mt-4">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 2px, transparent 2px, transparent 10px)' }} />
                <div className="relative z-10">
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight flex items-center gap-4">
                        <div className="bg-yellow-400 p-3 rounded-2xl border-4 border-yellow-200 shadow-[4px_4px_0px_rgba(255,255,255,0.3)] transform -rotate-3 hover:rotate-6 transition-transform shrink-0">
                            <Activity className="h-8 w-8 md:h-10 md:w-10 text-slate-900" />
                        </div>
                        Smart Activity Log
                    </h1>
                    <p className="text-slate-400 font-bold text-base md:text-lg mt-4 bg-slate-800 inline-block px-4 py-1.5 border-2 border-slate-600 rounded-xl shadow-sm rotate-1">
                        Pantau seluruh interaksi sistem secara real-time.
                    </p>
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row gap-3 shrink-0">
                    <Button onClick={() => fetchLogs()} className="h-12 bg-slate-700 hover:bg-slate-600 text-white border-2 border-slate-500 font-black rounded-xl uppercase flex items-center gap-2 transition-all">
                        <RefreshCw className="h-4 w-4" /> Refresh
                    </Button>
                    <Button onClick={handleExportCSV} disabled={isExporting || logs.length === 0} className="h-12 bg-emerald-500 hover:bg-emerald-400 text-slate-900 border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] font-black rounded-xl uppercase flex items-center gap-2 transition-all">
                        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Export CSV
                    </Button>
                    <Button onClick={handleClearOldLogs} disabled={isClearing} variant="outline" className="h-12 bg-red-100 hover:bg-red-200 text-red-800 border-2 border-red-400 font-black rounded-xl uppercase flex items-center gap-2 transition-all">
                        {isClearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Hapus &gt;90 Hari
                    </Button>
                </div>
            </div>

            {/* ====== FILTER BAR ====== */}
            <Card className="border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-3xl overflow-hidden bg-white">
                <CardContent className="p-4 md:p-6 space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama user, username, atau event..."
                            className="h-12 pl-12 bg-slate-50 border-2 border-slate-300 focus:border-slate-900 rounded-2xl font-bold text-base focus-visible:ring-0 focus:shadow-[4px_4px_0px_#0f172a] transition-all"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-4 items-center">
                        {/* Category Filter */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <Filter className="h-4 w-4 text-slate-500 shrink-0" />
                            <div className="flex bg-slate-100 border-2 border-slate-300 p-1 rounded-2xl gap-0.5 flex-wrap">
                                {CATEGORY_FILTERS.map(f => (
                                    <button
                                        key={f.value}
                                        onClick={() => setCategoryFilter(f.value)}
                                        className={`px-3 py-1.5 text-xs font-black uppercase rounded-xl transition-all whitespace-nowrap ${categoryFilter === f.value
                                            ? (CATEGORY_CONFIG[f.value]
                                                ? `${CATEGORY_CONFIG[f.value].color} ${CATEGORY_CONFIG[f.value].textColor} border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]`
                                                : 'bg-slate-900 text-white')
                                            : 'text-slate-500 hover:bg-slate-200 border-2 border-transparent'
                                        }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Time Filter */}
                        <div className="flex bg-slate-100 border-2 border-slate-300 p-1 rounded-2xl gap-0.5">
                            {TIME_FILTERS.map(f => (
                                <button
                                    key={f.value}
                                    onClick={() => setTimeFilter(f.value)}
                                    className={`px-3 py-1.5 text-xs font-black uppercase rounded-xl transition-all whitespace-nowrap ${timeFilter === f.value ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        {/* Status Filter */}
                        <div className="flex bg-slate-100 border-2 border-slate-300 p-1 rounded-2xl gap-0.5">
                            {['all', 'success', 'error', 'info'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={`px-3 py-1.5 text-xs font-black uppercase rounded-xl transition-all whitespace-nowrap ${statusFilter === s
                                        ? s === 'all' ? 'bg-slate-900 text-white'
                                            : s === 'success' ? 'bg-emerald-400 text-slate-900 border-2 border-slate-900'
                                                : s === 'error' ? 'bg-red-400 text-slate-900 border-2 border-slate-900'
                                                    : 'bg-blue-400 text-slate-900 border-2 border-slate-900'
                                        : 'text-slate-500 hover:bg-slate-200'}`}
                                >
                                    {s === 'all' ? 'Semua' : s}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ====== LOG TABLE ====== */}
            <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[2rem] overflow-hidden bg-slate-50">
                <CardHeader className="border-b-4 border-slate-900 bg-slate-800 p-5 md:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <CardTitle className="text-xl md:text-2xl font-black text-white flex items-center gap-3 uppercase">
                        <Activity className="h-6 w-6 text-yellow-400" /> Event Log
                    </CardTitle>
                    <div className="flex items-center gap-3">
                        <Badge className="bg-yellow-400 text-slate-900 border-2 border-slate-500 font-black text-sm px-4 py-1">
                            {totalCount.toLocaleString('id-ID')} Total
                        </Badge>
                        {(categoryFilter !== 'all' || timeFilter !== '30d' || statusFilter !== 'all' || search) && (
                            <button
                                onClick={() => { setCategoryFilter('all'); setTimeFilter('30d'); setStatusFilter('all'); setSearch('') }}
                                className="text-xs font-black text-slate-400 hover:text-white uppercase tracking-wider flex items-center gap-1 transition-colors"
                            >
                                <X className="h-3 w-3" /> Reset Filter
                            </button>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-24 flex justify-center bg-white">
                            <Loader2 className="w-12 h-12 animate-spin text-slate-400" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-16 text-center bg-white">
                            <div className="w-20 h-20 bg-slate-100 border-4 border-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Activity className="h-10 w-10 text-slate-400" />
                            </div>
                            <p className="font-black text-slate-400 text-xl uppercase tracking-widest">Tidak ada log ditemukan.</p>
                            <p className="text-slate-400 font-bold text-sm mt-2">Coba ubah filter atau jalankan SQL migration `add_activity_logs.sql`.</p>
                        </div>
                    ) : (
                        <div className="divide-y-4 divide-slate-900">
                            {logs.map((log) => {
                                const userP = log.user_profile as any
                                const actorP = log.actor_profile as any
                                const isExpanded = expandedId === log.id
                                const isActorDifferent = log.actor_id && log.actor_id !== log.user_id

                                return (
                                    <div
                                        key={log.id}
                                        className="bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                                    >
                                        {/* Main Row */}
                                        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 p-4 md:p-5">
                                            {/* Avatar + User */}
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <Avatar className="h-10 w-10 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] shrink-0">
                                                    <AvatarImage src={userP?.avatar_url} />
                                                    <AvatarFallback className="bg-amber-200 text-slate-900 font-black text-sm">
                                                        {userP?.full_name?.[0]?.toUpperCase() || '?'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <p className="font-black text-slate-900 text-sm truncate leading-tight">
                                                        {userP?.full_name || 'Unknown User'}
                                                    </p>
                                                    <p className="text-xs font-bold text-slate-500 truncate">
                                                        @{userP?.username || '-'}
                                                        {userP?.role && (
                                                            <span className="ml-1.5 text-[10px] uppercase bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded-full">
                                                                {userP.role}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Event + Category */}
                                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                                                <EventBadge eventType={log.event_type} />
                                                <CategoryBadge category={log.event_category} />
                                                {log.status === 'error' && (
                                                    <span className="text-xs font-black bg-red-200 text-red-800 px-2 py-0.5 rounded-lg uppercase border border-red-400">ERROR</span>
                                                )}
                                            </div>

                                            {/* Metadata Quick Preview */}
                                            <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                                                {log.metadata?.delta !== undefined && (
                                                    <MetadataChip label="Δ XP" value={`${Number(log.metadata.delta) > 0 ? '+' : ''}${String(log.metadata.delta)}`} />
                                                )}
                                                {log.metadata?.newPoints !== undefined && (
                                                    <MetadataChip label="XP baru" value={String(log.metadata.newPoints)} />
                                                )}
                                                {log.metadata?.oldRole !== undefined && (
                                                    <MetadataChip label={`${String(log.metadata.oldRole)} → ${String(log.metadata.newRole)}`} value="" />
                                                )}
                                                {log.metadata?.badgeName !== undefined && (
                                                    <MetadataChip label="badge" value={String(log.metadata.badgeName)} />
                                                )}
                                                {log.metadata?.newStreak !== undefined && (
                                                    <MetadataChip label="streak" value={`${String(log.metadata.newStreak)} hari`} />
                                                )}
                                                {Boolean(log.metadata?.reason) && (
                                                    <MetadataChip label="alasan" value={String(log.metadata.reason)} />
                                                )}
                                                {Boolean(log.metadata?.leveledUp) && (
                                                    <span className="text-[10px] font-black bg-violet-300 border border-violet-500 px-2 py-0.5 rounded-full uppercase text-violet-900">🎖️ Level Up!</span>
                                                )}
                                            </div>

                                            {/* Actor + Time */}
                                            <div className="flex flex-col items-end gap-1 shrink-0 text-right">
                                                <span className="text-xs font-black text-slate-500 whitespace-nowrap">
                                                    {formatRelativeTime(log.created_at)}
                                                </span>
                                                {isActorDifferent && actorP?.full_name && (
                                                    <span className="text-[10px] font-bold text-slate-400">
                                                        via {actorP.full_name}
                                                    </span>
                                                )}
                                                <Info className="h-3.5 w-3.5 text-slate-300" />
                                            </div>
                                        </div>

                                        {/* Expanded Detail */}
                                        {isExpanded && (
                                            <div className="px-5 pb-5 bg-slate-50 border-t-2 border-dashed border-slate-200" onClick={(e) => e.stopPropagation()}>
                                                <div className="mt-3 space-y-2">
                                                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Detail Lengkap</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        <MetadataChip label="ID" value={log.id} />
                                                        <MetadataChip label="Waktu" value={new Date(log.created_at).toLocaleString('id-ID')} />
                                                        <MetadataChip label="User ID" value={log.user_id} />
                                                        {isActorDifferent && <MetadataChip label="Actor ID" value={log.actor_id} />}
                                                    </div>
                                                    {Object.keys(log.metadata || {}).length > 0 && (
                                                        <div className="mt-3">
                                                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Metadata</p>
                                                            <pre className="text-xs bg-slate-900 text-emerald-400 p-4 rounded-xl overflow-x-auto border-2 border-slate-700 font-mono leading-relaxed">
                                                                {JSON.stringify(log.metadata, null, 2)}
                                                            </pre>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ====== PAGINATION ====== */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pb-8">
                    <Button
                        variant="outline"
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="h-12 border-2 border-slate-900 font-black rounded-xl shadow-[3px_3px_0px_#0f172a] disabled:opacity-50"
                    >
                        <ChevronLeft className="h-5 w-5 mr-1" /> Prev
                    </Button>

                    <span className="font-black text-slate-900 bg-white px-6 py-3 border-2 border-slate-900 rounded-xl shadow-[3px_3px_0px_#0f172a] text-sm uppercase">
                        Hal {page + 1} / {totalPages}
                    </span>

                    <Button
                        variant="outline"
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="h-12 border-2 border-slate-900 font-black rounded-xl shadow-[3px_3px_0px_#0f172a] disabled:opacity-50"
                    >
                        Next <ChevronRight className="h-5 w-5 ml-1" />
                    </Button>
                </div>
            )}
        </div>
    )
}
