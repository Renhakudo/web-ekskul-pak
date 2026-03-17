import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, GraduationCap, BookUser, ShieldCheck, UserCircle } from 'lucide-react'
import { AdminUserActions } from './AdminUserActions'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: currentProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isAdmin = currentProfile?.role === 'admin'

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

    const roleCount = {
        admin: profiles?.filter(p => p.role === 'admin').length || 0,
        guru: profiles?.filter(p => p.role === 'guru').length || 0,
        siswa: profiles?.filter(p => p.role === 'siswa').length || 0,
    }

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return <Badge className="bg-red-400 text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] font-black uppercase text-[10px] tracking-wider">Kaisar</Badge>
            case 'guru':
                return <Badge className="bg-violet-400 text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] font-black uppercase text-[10px] tracking-wider">Master</Badge>
            default:
                return <Badge className="bg-slate-100 text-slate-600 border-2 border-slate-300 shadow-sm font-black uppercase text-[10px] tracking-wider">Pemula</Badge>
        }
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-red-100 border-4 border-slate-900 text-red-900 font-black text-xl rounded-2xl shadow-[6px_6px_0px_#0f172a] max-w-2xl mx-auto mt-20">
                Gagal memuat sekte ini. Coba segarkan lagi halamannya.
            </div>
        )
    }

    return (
        <div className="p-6 md:p-8 space-y-10 max-w-7xl mx-auto min-h-screen font-sans">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-amber-300 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] p-8 md:p-10 relative overflow-hidden mt-2">
                <div className="relative z-10">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        <div className="bg-white p-3 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] transform -rotate-3">
                            <Users className="h-10 w-10 text-amber-600" />
                        </div>
                        Catatan Warga
                    </h1>
                    <p className="text-amber-900 font-bold text-lg mt-4 bg-white/60 inline-block px-4 py-1.5 border-2 border-slate-900 rounded-xl shadow-sm rotate-1">
                        Atur pangkat dan wewenang tiap individu di ekosistem ini.
                    </p>
                </div>
            </div>

            {/* Role Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-[24px] bg-white transform -rotate-1 hover:rotate-0 hover:-translate-y-1 transition-all overflow-hidden flex flex-col">
                    <div className="h-4 bg-red-400 border-b-4 border-slate-900 w-full" />
                    <CardHeader className="p-5 pb-0 flex flex-row items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-lg flex items-center justify-center">
                            <ShieldCheck className="h-5 w-5 text-red-600" />
                        </div>
                        <CardTitle className="text-sm font-black text-slate-600 uppercase tracking-widest mt-1">Admin</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 pt-2">
                        <div className="text-5xl font-black text-slate-900">{roleCount.admin}</div>
                    </CardContent>
                </Card>
                <Card className="border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-[24px] bg-white transform hover:-translate-y-1 transition-all overflow-hidden flex flex-col">
                    <div className="h-4 bg-violet-400 border-b-4 border-slate-900 w-full" />
                    <CardHeader className="p-5 pb-0 flex flex-row items-center gap-3">
                        <div className="w-10 h-10 bg-violet-100 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-lg flex items-center justify-center">
                            <BookUser className="h-5 w-5 text-violet-600" />
                        </div>
                        <CardTitle className="text-sm font-black text-slate-600 uppercase tracking-widest mt-1">Guru / Mentor</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 pt-2">
                        <div className="text-5xl font-black text-slate-900">{roleCount.guru}</div>
                    </CardContent>
                </Card>
                <Card className="border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-[24px] bg-white transform rotate-1 hover:rotate-0 hover:-translate-y-1 transition-all overflow-hidden flex flex-col">
                    <div className="h-4 bg-emerald-400 border-b-4 border-slate-900 w-full" />
                    <CardHeader className="p-5 pb-0 flex flex-row items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-lg flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-emerald-600" />
                        </div>
                        <CardTitle className="text-sm font-black text-slate-600 uppercase tracking-widest mt-1">Siswa</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 pt-2">
                        <div className="text-5xl font-black text-slate-900">{roleCount.siswa}</div>
                    </CardContent>
                </Card>
            </div>

            {/* User Table */}
            <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] overflow-hidden bg-white">
                <CardHeader className="border-b-4 border-slate-900 bg-amber-100 p-6 flex flex-row items-center justify-between">
                    <CardTitle className="text-2xl font-black flex items-center gap-3 text-slate-900">
                        <UserCircle className="h-8 w-8 text-amber-600" />
                        Daftar Lengkap Warga
                    </CardTitle>
                    <Badge variant="secondary" className="bg-white border-2 border-slate-900 text-slate-900 font-black shadow-sm text-sm px-3">{profiles?.length || 0} Total</Badge>
                </CardHeader>
                <CardContent className="p-0">
                    {!profiles || profiles.length === 0 ? (
                        <div className="p-16 text-center text-slate-500 font-bold border-2 border-dashed border-slate-300 m-8 rounded-2xl">
                            Belum ada satupun yang terdaftar di basis data ini.
                        </div>
                    ) : (
                        <div className="divide-y-4 divide-slate-100">
                            {profiles.map((profile) => {
                                const level = Math.floor((profile.points || 0) / 100) + 1
                                const isCurrentUser = profile.id === user.id
                                return (
                                    <div key={profile.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 hover:bg-slate-50 transition-colors gap-4">
                                        <div className="flex items-center gap-5">
                                            <Avatar className="h-14 w-14 border-4 border-slate-900 shadow-[2px_2px_0px_#0f172a] shrink-0 transform -rotate-2">
                                                <AvatarImage src={profile.avatar_url} />
                                                <AvatarFallback className="bg-amber-200 text-slate-900 text-lg font-black tracking-tighter">
                                                    {profile.full_name?.[0]?.toUpperCase() || '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-black text-slate-900 text-xl flex items-center gap-3">
                                                    {profile.full_name || 'Hantu Tanpa Nama'}
                                                    {isCurrentUser && (
                                                        <Badge className="text-[10px] h-5 px-2 bg-emerald-400 text-slate-900 border-2 border-slate-900 shadow-sm font-black uppercase">Anda</Badge>
                                                    )}
                                                </div>
                                                <div className="text-sm font-bold text-slate-500 mt-1 flex items-center gap-2">
                                                    @{profile.username || '-'} <span className="text-slate-300">|</span>
                                                    <span className="text-violet-600">Level {level}</span> <span className="text-slate-300">|</span>
                                                    <span className="bg-yellow-100 px-2 rounded-md border border-slate-200">{profile.points || 0} XP</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 w-full sm:w-auto p-4 sm:p-0 bg-slate-100 sm:bg-transparent rounded-xl border-2 border-slate-200 sm:border-transparent mt-2 sm:mt-0 justify-between sm:justify-end">
                                            {getRoleBadge(profile.role)}
                                            {isAdmin && !isCurrentUser && (
                                                <AdminUserActions
                                                    userId={profile.id}
                                                    currentRole={profile.role}
                                                />
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
