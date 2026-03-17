import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, BookOpen, ClipboardCheck, Star, GraduationCap, Activity, ShieldAlert } from 'lucide-react'
import { AdminCharts } from '@/components/AdminCharts'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const [
    { count: totalUsers },
    { count: totalStudents },
    { count: totalClasses },
    { count: totalMaterials },
    { count: totalSubmissions },
    { count: todayAttendance },
    { data: topStudents },
    { data: settings },
    { data: profilesData },
    { data: attData },
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
    supabase.from('profiles').select('points').eq('role', 'siswa'),
    supabase.from('attendances').select('date_only').gte('date_only', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
  ])

  // Data Processing for Charts
  const attendanceMap: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    // Use DD/MM format for x-axis
    const label = d.split('-').slice(1).reverse().join('/')
    attendanceMap[label] = 0
  }
  
  if (attData) {
    attData.forEach(a => {
      const label = a.date_only.split('-').slice(1).reverse().join('/')
      if (attendanceMap[label] !== undefined) {
        attendanceMap[label]++
      }
    })
  }

  const chartAttendance = Object.keys(attendanceMap).map(k => ({ date: k, count: attendanceMap[k] }))

  const xpRanges = [
    { name: '0-100', min: 0, max: 100, count: 0 },
    { name: '101-500', min: 101, max: 500, count: 0 },
    { name: '501-1k', min: 501, max: 1000, count: 0 },
    { name: '1000+', min: 1001, max: 9999999, count: 0 },
  ]
  
  if (profilesData) {
    profilesData.forEach(p => {
      const xp = p.points || 0
      const range = xpRanges.find(r => xp >= r.min && xp <= r.max)
      if (range) range.count++
    })
  }

  const statCards = [
    {
      title: 'Total Siswa',
      value: totalStudents ?? 0,
      icon: GraduationCap,
      color: 'text-slate-900',
      bg: 'bg-violet-300',
      rotation: '-rotate-1',
    },
    {
      title: 'Total Akun',
      value: totalUsers ?? 0,
      icon: Users,
      color: 'text-slate-900',
      bg: 'bg-blue-300',
      rotation: 'rotate-1',
    },
    {
      title: 'Total Modul',
      value: totalClasses ?? 0,
      icon: BookOpen,
      color: 'text-slate-900',
      bg: 'bg-emerald-300',
      rotation: '-rotate-2',
    },
    {
      title: 'Total Materi',
      value: totalMaterials ?? 0,
      icon: Star,
      color: 'text-slate-900',
      bg: 'bg-yellow-300',
      rotation: 'rotate-2',
    },
    {
      title: 'Tugas Masuk',
      value: totalSubmissions ?? 0,
      icon: ClipboardCheck,
      color: 'text-slate-900',
      bg: 'bg-pink-300',
      rotation: '-rotate-1',
    },
    {
      title: 'Absen Hari Ini',
      value: todayAttendance ?? 0,
      icon: Activity,
      color: 'text-slate-900',
      bg: 'bg-orange-300',
      rotation: 'rotate-1',
    },
  ]

  return (
    <div className="p-6 md:p-8 space-y-10 max-w-7xl mx-auto min-h-screen font-sans">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-100 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] p-8 md:p-10 relative overflow-hidden mt-2">
        {/* Background pattern polos */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <div className="bg-yellow-300 p-3 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] transform -rotate-6">
              <ShieldAlert className="h-10 w-10 text-slate-900" />
            </div>
            Pusat Komando
          </h1>
          <p className="text-slate-700 font-bold text-lg mt-3 bg-white inline-block px-4 py-1 border-2 border-slate-900 rounded-xl shadow-sm rotate-1">
            Pantau semua aktivitas dan metrik sistem dari satu tempat.
          </p>
        </div>

        {/* System Status Badges */}
        <div className="relative z-10 flex flex-col sm:flex-row gap-4 mt-6 md:mt-0">
          <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-4 shadow-[4px_4px_0px_#0f172a] font-black text-sm md:text-base transform -rotate-1 ${settings?.is_attendance_open
            ? 'bg-emerald-300 border-slate-900 text-slate-900'
            : 'bg-slate-200 border-slate-900 text-slate-500'
            }`}>
            <span className={`w-4 h-4 rounded-full border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] ${settings?.is_attendance_open ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            Absensi {settings?.is_attendance_open ? 'Dibuka' : 'Ditutup'}
          </div>
          <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-4 shadow-[4px_4px_0px_#0f172a] font-black text-sm md:text-base transform rotate-1 ${settings?.is_registration_open
            ? 'bg-blue-300 border-slate-900 text-slate-900'
            : 'bg-slate-200 border-slate-900 text-slate-500'
            }`}>
            <span className={`w-4 h-4 rounded-full border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] ${settings?.is_registration_open ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'}`} />
            Daftar {settings?.is_registration_open ? 'Terbuka' : 'Ditutup'}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className={`border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-[24px] bg-white transform ${stat.rotation} hover:rotate-0 hover:-translate-y-2 hover:shadow-[4px_4px_0px_#0f172a] transition-all overflow-hidden flex flex-col`}>
              <div className={`h-4 w-full border-b-4 border-slate-900 ${stat.bg}`}></div>
              <CardHeader className="pb-2 pt-6">
                <CardTitle className={`text-sm md:text-base font-black uppercase tracking-wider text-slate-500 flex flex-row items-center gap-3`}>
                  <div className={`p-2 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] ${stat.bg}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="mt-auto pb-6">
                <div className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Analytics Charts */}
      <AdminCharts xpData={xpRanges} attendanceData={chartAttendance} />

      {/* Top Students */}
      <h3 className="text-3xl font-black text-slate-900 mt-12 mb-6 flex items-center gap-3 pl-2">
        <Star className="w-8 h-8 text-yellow-500" /> Penguasa Leaderboard
      </h3>
      <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] overflow-hidden bg-white">
        <CardHeader className="border-b-4 border-slate-900 bg-yellow-100 p-6">
          <CardTitle className="text-xl font-black flex items-center gap-2 text-slate-900">
            Top 5 Siswa Veteran (Max XP)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y-2 divide-slate-100">
            {topStudents && topStudents.length > 0 ? (
              topStudents.map((student, idx) => {
                const level = Math.floor((student.points || 0) / 100) + 1
                const rankColors = ['bg-yellow-300 text-slate-900', 'bg-slate-200 text-slate-900', 'bg-orange-300 text-slate-900', 'bg-white text-slate-400', 'bg-white text-slate-400']
                const isTop3 = idx < 3
                return (
                  <div key={student.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-slate-50 transition-colors gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 flex items-center justify-center font-black text-xl rounded-xl border-2 ${isTop3 ? 'border-slate-900 shadow-[3px_3px_0px_#0f172a]' : 'border-slate-300'} ${rankColors[idx]}`}>
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-black text-slate-900 text-lg sm:text-xl leading-tight">{student.full_name}</div>
                        <div className="text-sm font-bold text-slate-500 mt-1 flex items-center gap-2 bg-slate-100 px-2 py-0.5 rounded-md w-fit">
                          @{student.username} <span className="text-slate-300">|</span> <span className="text-violet-600">Level {level}</span>
                        </div>
                      </div>
                    </div>
                    <div className="font-black text-2xl text-slate-900 flex items-center gap-2 self-start sm:self-auto bg-yellow-100 px-4 py-2 rounded-2xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] transform sm:rotate-2">
                      {student.points} <span className="text-sm font-bold text-slate-600">XP</span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="p-16 text-center text-slate-400 font-bold text-lg border-2 border-dashed border-slate-200 m-6 rounded-2xl">
                Belum ada data pahlawan.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}