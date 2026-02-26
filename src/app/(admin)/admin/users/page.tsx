import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, GraduationCap, BookUser, ShieldCheck, Search } from 'lucide-react'
import { AdminUserActions } from './AdminUserActions'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
    const supabase = await createClient()

    // Verifikasi bahwa user yang akses adalah admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: currentProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isAdmin = currentProfile?.role === 'admin'

    // Ambil semua user profiles
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
                return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Admin</Badge>
            case 'guru':
                return <Badge className="bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-100">Guru</Badge>
            default:
                return <Badge className="bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100">Siswa</Badge>
        }
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-600">
                Gagal memuat data user. Silakan refresh halaman.
            </div>
        )
    }

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manajemen User</h1>
                <p className="text-slate-500 mt-1">Kelola semua pengguna dan role mereka di sini.</p>
            </div>

            {/* Role Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="border-red-100">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <ShieldCheck className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-extrabold text-slate-900">{roleCount.admin}</div>
                            <div className="text-xs text-slate-500">Admin</div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-violet-100">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                            <BookUser className="h-5 w-5 text-violet-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-extrabold text-slate-900">{roleCount.guru}</div>
                            <div className="text-xs text-slate-500">Guru</div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-100">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-extrabold text-slate-900">{roleCount.siswa}</div>
                            <div className="text-xs text-slate-500">Siswa</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* User Table */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b bg-slate-50/50">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-5 w-5 text-slate-500" />
                        Semua Pengguna
                        <Badge variant="secondary" className="ml-auto">{profiles?.length || 0} total</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {!profiles || profiles.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            <Users className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                            <p>Belum ada pengguna.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {profiles.map((profile) => {
                                const level = Math.floor((profile.points || 0) / 100) + 1
                                const isCurrentUser = profile.id === user.id
                                return (
                                    <div key={profile.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors gap-4">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-10 w-10 border border-slate-200 shrink-0">
                                                <AvatarImage src={profile.avatar_url} />
                                                <AvatarFallback className="bg-slate-100 text-slate-600 text-sm font-bold">
                                                    {profile.full_name?.[0]?.toUpperCase() || '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                                                    {profile.full_name || 'Tanpa Nama'}
                                                    {isCurrentUser && (
                                                        <Badge className="text-[10px] h-4 px-1.5 bg-violet-600 text-white">Kamu</Badge>
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-400 mt-0.5">
                                                    @{profile.username || '-'} · Level {level} · {profile.points || 0} XP
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {getRoleBadge(profile.role)}
                                            {/* Role change action — hanya admin yang bisa ubah role */}
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
