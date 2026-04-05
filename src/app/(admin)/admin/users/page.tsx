'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, GraduationCap, BookUser, ShieldCheck, UserCircle, Search, Download, Loader2 } from 'lucide-react'
import { AdminUserActions } from './AdminUserActions'

export default function AdminUsersPage() {
    const supabase = createClient()

    const [currentUser, setCurrentUser] = useState<any>(null)
    const [profiles, setProfiles] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // Fitur Live Search & Filter
    const [searchQuery, setSearchQuery] = useState('')
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'guru' | 'siswa'>('all')

    // Mengambil Data Profil dan Session
    const fetchProfiles = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) setCurrentUser(user)

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) setError(error.message)
        else setProfiles(data || [])
        
        setLoading(false)
    }

    useEffect(() => {
        fetchProfiles()

        // 🪄 MAGIC: Real-Time Auto Update!
        // Jika ada perubahan data di tabel profiles (user baru/ubah role), layar akan otomatis update!
        const channel = supabase
            .channel('public:profiles')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
                fetchProfiles()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const isAdmin = profiles.find(p => p.id === currentUser?.id)?.role === 'admin'

    const roleCount = {
        admin: profiles.filter(p => p.role === 'admin').length || 0,
        guru: profiles.filter(p => p.role === 'guru').length || 0,
        siswa: profiles.filter(p => p.role === 'siswa').length || 0,
    }

    // Logic Filtering
    const filteredProfiles = profiles.filter(profile => {
        const matchesSearch = profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              profile.username?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'all' || profile.role === roleFilter;
        return matchesSearch && matchesRole;
    })

    // Logic Export CSV (Fitur Wajib Admin)
    const handleExportCSV = () => {
        const headers = ['ID', 'Nama Lengkap', 'Username', 'Pangkat', 'XP', 'Tanggal Bergabung']
        const csvContent = [
            headers.join(','),
            ...filteredProfiles.map(p => 
                `${p.id},"${p.full_name || ''}","${p.username || ''}","${p.role}",${p.points || 0},"${new Date(p.created_at).toLocaleDateString('id-ID')}"`
            )
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `Data_Warga_Ekskul_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return <Badge className="bg-red-400 text-slate-900 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] font-black uppercase text-[10px] sm:text-xs px-2 sm:px-3 py-1 tracking-wider transform rotate-2">Kaisar</Badge>
            case 'guru':
                return <Badge className="bg-violet-400 text-slate-900 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] font-black uppercase text-[10px] sm:text-xs px-2 sm:px-3 py-1 tracking-wider transform -rotate-1">Master</Badge>
            default:
                return <Badge className="bg-emerald-300 text-slate-900 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] font-black uppercase text-[10px] sm:text-xs px-2 sm:px-3 py-1 tracking-wider">Pemula</Badge>
        }
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-red-200 border-4 border-slate-900 text-slate-900 font-black text-2xl rounded-[2rem] shadow-[8px_8px_0px_#0f172a] max-w-2xl mx-auto mt-20 transform rotate-1">
                Gagal memuat sekte ini. Coba segarkan lagi halamannya.
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 space-y-10 max-w-7xl mx-auto min-h-screen font-sans relative z-0 overflow-x-hidden pb-24">

            {/* Background Dot Pattern */}
            <div className="absolute inset-0 z-[-1] bg-[radial-gradient(#cbd5e1_2px,transparent_2px)] [background-size:32px_32px] opacity-40 fixed"></div>

            {/* ====== HEADER ====== */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-amber-300 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] md:shadow-[12px_12px_0px_#0f172a] rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 relative overflow-hidden mt-4">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 10px)' }}></div>
                
                <div className="relative z-10">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        <div className="bg-white p-3 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] transform -rotate-3 hover:rotate-6 transition-transform shrink-0">
                            <Users className="h-8 w-8 md:h-10 md:w-10 text-amber-600" />
                        </div>
                        Catatan Warga
                    </h1>
                    <p className="text-slate-800 font-bold text-base md:text-lg mt-4 bg-white/70 inline-block px-4 py-1.5 border-2 border-slate-900 rounded-xl shadow-sm rotate-1 hover:-rotate-1 transition-transform backdrop-blur-sm">
                        Atur pangkat dan wewenang tiap individu di ekosistem ini.
                    </p>
                </div>

                <div className="relative z-10 shrink-0">
                    <Button onClick={handleExportCSV} className="w-full md:w-auto h-14 bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] active:shadow-none active:translate-y-1 rounded-2xl text-base uppercase transition-all flex items-center gap-2">
                        <Download className="w-5 h-5" /> Export Data (CSV)
                    </Button>
                </div>
            </div>

            {/* ====== ROLE SUMMARY CARDS ====== */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                <Card className="group border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-[1.5rem] md:rounded-[24px] bg-white transform transition-all duration-300 overflow-hidden flex flex-col hover:-rotate-2 hover:-translate-y-2 hover:shadow-[10px_10px_0px_#0f172a] cursor-default">
                    <div className="h-4 md:h-5 bg-red-400 border-b-4 border-slate-900 w-full" />
                    <CardHeader className="p-6 pb-2 flex flex-row items-center gap-4">
                        <div className="w-12 h-12 bg-red-200 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ShieldCheck className="h-6 w-6 text-red-700" />
                        </div>
                        <CardTitle className="text-sm md:text-base font-black text-slate-500 uppercase tracking-widest mt-1">Komandan</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-2 mt-auto">
                        <div className="text-5xl md:text-6xl font-black text-slate-900 group-hover:text-red-600 transition-colors">
                            {loading ? <Loader2 className="w-10 h-10 animate-spin text-slate-300" /> : roleCount.admin}
                        </div>
                    </CardContent>
                </Card>

                <Card className="group border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-[1.5rem] md:rounded-[24px] bg-white transform transition-all duration-300 overflow-hidden flex flex-col hover:rotate-2 hover:-translate-y-2 hover:shadow-[10px_10px_0px_#0f172a] cursor-default">
                    <div className="h-4 md:h-5 bg-violet-400 border-b-4 border-slate-900 w-full" />
                    <CardHeader className="p-6 pb-2 flex flex-row items-center gap-4">
                        <div className="w-12 h-12 bg-violet-200 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <BookUser className="h-6 w-6 text-violet-700" />
                        </div>
                        <CardTitle className="text-sm md:text-base font-black text-slate-500 uppercase tracking-widest mt-1">Instruktur</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-2 mt-auto">
                        <div className="text-5xl md:text-6xl font-black text-slate-900 group-hover:text-violet-600 transition-colors">
                            {loading ? <Loader2 className="w-10 h-10 animate-spin text-slate-300" /> : roleCount.guru}
                        </div>
                    </CardContent>
                </Card>

                <Card className="group border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-[1.5rem] md:rounded-[24px] bg-white transform transition-all duration-300 overflow-hidden flex flex-col hover:-rotate-2 hover:-translate-y-2 hover:shadow-[10px_10px_0px_#0f172a] cursor-default">
                    <div className="h-4 md:h-5 bg-emerald-400 border-b-4 border-slate-900 w-full" />
                    <CardHeader className="p-6 pb-2 flex flex-row items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-200 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <GraduationCap className="h-6 w-6 text-emerald-700" />
                        </div>
                        <CardTitle className="text-sm md:text-base font-black text-slate-500 uppercase tracking-widest mt-1">Pasukan</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-2 mt-auto">
                        <div className="text-5xl md:text-6xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                            {loading ? <Loader2 className="w-10 h-10 animate-spin text-slate-300" /> : roleCount.siswa}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ====== CONTROL BAR (SEARCH & FILTER) ====== */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-white p-4 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a]">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" />
                    <Input 
                        placeholder="Cari nama atau username..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-14 pl-12 bg-slate-50 border-2 border-slate-300 focus:border-slate-900 rounded-2xl font-bold text-base focus-visible:ring-0 focus:shadow-[4px_4px_0px_#0f172a] transition-all"
                    />
                </div>
                <div className="flex bg-slate-100 border-2 border-slate-300 p-1.5 rounded-2xl overflow-x-auto hide-scrollbar shrink-0">
                    <button onClick={() => setRoleFilter('all')} className={`px-4 py-3 font-black text-xs md:text-sm uppercase rounded-xl transition-all whitespace-nowrap ${roleFilter === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>Semua</button>
                    <button onClick={() => setRoleFilter('admin')} className={`px-4 py-3 font-black text-xs md:text-sm uppercase rounded-xl transition-all whitespace-nowrap ${roleFilter === 'admin' ? 'bg-red-400 text-slate-900 shadow-[2px_2px_0px_#0f172a] border-2 border-slate-900' : 'text-slate-500 hover:bg-slate-200 border-2 border-transparent'}`}>Kaisar</button>
                    <button onClick={() => setRoleFilter('guru')} className={`px-4 py-3 font-black text-xs md:text-sm uppercase rounded-xl transition-all whitespace-nowrap ${roleFilter === 'guru' ? 'bg-violet-400 text-slate-900 shadow-[2px_2px_0px_#0f172a] border-2 border-slate-900' : 'text-slate-500 hover:bg-slate-200 border-2 border-transparent'}`}>Master</button>
                    <button onClick={() => setRoleFilter('siswa')} className={`px-4 py-3 font-black text-xs md:text-sm uppercase rounded-xl transition-all whitespace-nowrap ${roleFilter === 'siswa' ? 'bg-emerald-400 text-slate-900 shadow-[2px_2px_0px_#0f172a] border-2 border-slate-900' : 'text-slate-500 hover:bg-slate-200 border-2 border-transparent'}`}>Pemula</button>
                </div>
            </div>

            {/* ====== USER TABLE (LIST) ====== */}
            <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[2rem] overflow-hidden bg-slate-50">
                <CardHeader className="border-b-4 border-slate-900 bg-amber-100 p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <CardTitle className="text-2xl md:text-3xl font-black flex items-center gap-3 text-slate-900 uppercase">
                        <UserCircle className="h-8 w-8 md:h-10 md:w-10 text-amber-600" />
                        Daftar Lengkap Warga
                    </CardTitle>
                    <Badge variant="secondary" className="bg-white border-4 border-slate-900 text-slate-900 font-black shadow-[4px_4px_0px_#0f172a] text-sm md:text-base px-4 py-1.5 transform rotate-2">
                        {filteredProfiles.length} Total Data
                    </Badge>
                </CardHeader>

                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-24 flex justify-center bg-white"><Loader2 className="w-12 h-12 animate-spin text-amber-500" /></div>
                    ) : filteredProfiles.length === 0 ? (
                        <div className="p-16 md:p-24 text-center text-slate-400 font-black text-xl bg-white border-b-4 border-slate-900 uppercase tracking-widest">
                            Warga tidak ditemukan.
                        </div>
                    ) : (
                        <div className="divide-y-4 divide-slate-900">
                            {filteredProfiles.map((profile) => {
                                const level = Math.floor((profile.points || 0) / 100) + 1
                                const isCurrentUser = profile.id === currentUser?.id
                                
                                return (
                                    <div key={profile.id} className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 md:p-8 bg-white hover:bg-slate-100 transition-colors gap-6 group cursor-default">
                                        
                                        {/* Info User */}
                                        <div className="flex items-center gap-4 md:gap-6 w-full lg:w-auto">
                                            <Avatar className="h-14 w-14 md:h-16 md:w-16 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] shrink-0 transform -rotate-2 group-hover:rotate-2 transition-transform bg-white">
                                                <AvatarImage src={profile.avatar_url} />
                                                <AvatarFallback className="bg-amber-200 text-slate-900 text-xl font-black tracking-tighter">
                                                    {profile.full_name?.[0]?.toUpperCase() || '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                            
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-3 flex-wrap mb-2">
                                                    <h3 className="font-black text-slate-900 text-xl md:text-2xl leading-tight truncate group-hover:text-violet-700 transition-colors">
                                                        {profile.full_name || 'Hantu Tanpa Nama'}
                                                    </h3>
                                                    {isCurrentUser && (
                                                        <Badge className="text-[10px] md:text-xs h-5 md:h-6 px-2 bg-yellow-300 text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] font-black uppercase transform -rotate-3 shrink-0">
                                                            Anda
                                                        </Badge>
                                                    )}
                                                </div>
                                                
                                                <div className="text-xs md:text-sm font-bold text-slate-600 flex flex-wrap items-center gap-2">
                                                    <span className="bg-slate-200 border-2 border-slate-900 px-2 py-0.5 rounded-md shadow-[2px_2px_0px_#0f172a]">@{profile.username || '-'}</span> 
                                                    
                                                    {profile.role === 'siswa' && (
                                                        <>
                                                            <span className="text-violet-900 bg-violet-300 border-2 border-slate-900 px-2.5 py-0.5 rounded-md shadow-[2px_2px_0px_#0f172a]">Level {level}</span>
                                                            <span className="text-emerald-900 bg-emerald-300 border-2 border-slate-900 px-2.5 py-0.5 rounded-md shadow-[2px_2px_0px_#0f172a]">{profile.points || 0} XP</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Area Khusus Mobile dan Desktop */}
                                        <div className="flex flex-row items-center justify-between w-full lg:w-auto mt-2 lg:mt-0 p-3 lg:p-0 bg-slate-50 lg:bg-transparent border-2 border-slate-900 lg:border-transparent rounded-xl lg:rounded-none shrink-0 shadow-inner lg:shadow-none">
                                            {getRoleBadge(profile.role)}
                                            
                                            {isAdmin && !isCurrentUser && (
                                                <div className="transform group-hover:-translate-y-1 transition-transform ml-4">
                                                    <AdminUserActions
                                                        userId={profile.id}
                                                        currentRole={profile.role}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}