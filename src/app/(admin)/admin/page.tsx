import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, BookOpen, ClipboardCheck, Star, GraduationCap, Activity } from 'lucide-react'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Ambil semua statistik secara paralel untuk efisiensi
  const [
    { count: totalUsers },
    { count: totalStudents },
    { count: totalClasses },
    { count: totalMaterials },
    { count: totalSubmissions },
    { count: todayAttendance },
    { data: topStudents },
    { data: settings },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'siswa'),
    supabase.from('classes').select('*', { count: 'exact', head: true }),
    supabase.from('materials').select('*', { count: 'exact', head: true }),
    supabase.from('submissions').select('*', { count: 'exact', head: true }),
    supabase
      .from('attendances')
      .select('*', { count: 'exact', head: true })
      .eq('date_only', new Date().toISOString().split('T')[0]),
    supabase
      .from('profiles')
      .select('id, full_name, username, points, avatar_url')
      .eq('role', 'siswa')
      .order('points', { ascending: false })
      .limit(5),
    supabase.from('app_settings').select('is_attendance_open, is_registration_open').eq('id', 1).single(),
  ])

  const statCards = [
    {
      title: 'Total Siswa',
      value: totalStudents ?? 0,
      icon: GraduationCap,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      border: 'border-violet-100',
    },
    {
      title: 'Total Pengguna',
      value: totalUsers ?? 0,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      title: 'Total Kelas',
      value: totalClasses ?? 0,
      icon: BookOpen,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      title: 'Total Materi',
      value: totalMaterials ?? 0,
      icon: Star,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-100',
    },
    {
      title: 'Tugas Dikumpulkan',
      value: totalSubmissions ?? 0,
      icon: ClipboardCheck,
      color: 'text-pink-600',
      bg: 'bg-pink-50',
      border: 'border-pink-100',
    },
    {
      title: 'Absensi Hari Ini',
      value: todayAttendance ?? 0,
      icon: Activity,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-100',
    },
  ]

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Admin</h1>
        <p className="text-slate-500 mt-1">Ringkasan statistik dan aktivitas sistem.</p>
      </div>

      {/* System Status Badges */}
      <div className="flex flex-wrap gap-3">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${settings?.is_attendance_open
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
          <span className={`w-2 h-2 rounded-full ${settings?.is_attendance_open ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          Absensi: {settings?.is_attendance_open ? 'Dibuka' : 'Ditutup'}
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${settings?.is_registration_open
            ? 'bg-blue-50 text-blue-700 border-blue-200'
            : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
          <span className={`w-2 h-2 rounded-full ${settings?.is_registration_open ? 'bg-blue-500' : 'bg-slate-400'}`} />
          Pendaftaran: {settings?.is_registration_open ? 'Dibuka' : 'Ditutup'}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className={`border ${stat.border} shadow-sm hover:shadow-md transition-shadow`}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-xs font-semibold uppercase tracking-wider ${stat.color} flex items-center gap-2`}>
                  <div className={`p-1.5 rounded-md ${stat.bg}`}>
                    <Icon className={`h-3.5 w-3.5 ${stat.color}`} />
                  </div>
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-slate-900">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Top Students */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b bg-slate-50/50">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            Top 5 Siswa Berdasarkan XP
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {topStudents && topStudents.length > 0 ? (
              topStudents.map((student, idx) => {
                const level = Math.floor((student.points || 0) / 100) + 1
                const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣']
                return (
                  <div key={student.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="text-xl w-8 text-center">{medals[idx]}</span>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">{student.full_name}</div>
                        <div className="text-xs text-slate-400">@{student.username} · Level {level}</div>
                      </div>
                    </div>
                    <div className="font-bold text-violet-700 tabular-nums text-sm">
                      {student.points} XP
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="p-8 text-center text-slate-500 text-sm">Belum ada data siswa.</div>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}