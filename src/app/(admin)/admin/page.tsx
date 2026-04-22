import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Users, BookOpen, ClipboardCheck, Star, GraduationCap, Activity, ShieldAlert, Trophy, ArrowRight, PenTool, PlusCircle, UserPlus, Radio } from 'lucide-react'
import { AdminCharts } from '@/components/AdminCharts'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

// PERFORMA JOSSS: Cache halaman selama 60 detik agar database tidak jebol
export const revalidate = 60

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const thirtyDaysAgoDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const thirtyDaysAgoISO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

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
    { data: subData },
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
    supabase.from('profiles').select('points, role'),
    supabase.from('attendances').select('date_only').gte('date_only', thirtyDaysAgoDate),
    supabase.from('submissions').select('submitted_at').gte('submitted_at', thirtyDaysAgoISO),
  ])

  // --- DATA PROCESSING 30 HARI ---
  const attendanceMap: Record<string, number> = {}
  const submissionMap: Record<string, number> = {}
  
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const label = d.split('-').slice(1).reverse().join('/') 
    attendanceMap[label] = 0
    submissionMap[label] = 0
  }
  
  if (attData) {
    attData.forEach(a => {
      const label = a.date_only.split('-').slice(1).reverse().join('/')
      if (attendanceMap[label] !== undefined) attendanceMap[label]++
    })
  }

  if (subData) {
    subData.forEach(s => {
      const dateOnly = s.submitted_at.split('T')[0]
      const label = dateOnly.split('-').slice(1).reverse().join('/')
      if (submissionMap[label] !== undefined) submissionMap[label]++
    })
  }

  const chartAttendance = Object.keys(attendanceMap).map(k => ({ date: k, count: attendanceMap[k] }))
  const chartSubmissions = Object.keys(submissionMap).map(k => ({ date: k, count: submissionMap[k] }))

  // --- DATA PROCESSING XP & ROLES ---
  const xpRanges = [
    { name: '0-100', min: 0, max: 100, count: 0 },
    { name: '101-500', min: 101, max: 500, count: 0 },
    { name: '501-1k', min: 501, max: 1000, count: 0 },
    { name: '1000+', min: 1001, max: 9999999, count: 0 },
  ]
  
  const roleCounts = { siswa: 0, guru: 0, admin: 0 }

  if (profilesData) {
    profilesData.forEach(p => {
      if (p.role === 'siswa') {
        const xp = p.points || 0
        const range = xpRanges.find(r => xp >= r.min && xp <= r.max)
        if (range) range.count++
      }
      if (p.role === 'siswa') roleCounts.siswa++
      if (p.role === 'guru') roleCounts.guru++
      if (p.role === 'admin') roleCounts.admin++
    })
  }

  const chartRoles = [
    { name: 'Siswa', value: roleCounts.siswa, color: '#34d399' },
    { name: 'Guru', value: roleCounts.guru, color: '#facc15' },   
    { name: 'Admin', value: roleCounts.admin, color: '#a855f7' }, 
  ]

  const statCards = [
    { title: 'Total Siswa', value: totalStudents ?? 0, icon: GraduationCap, color: 'text-slate-900', bg: 'bg-violet-300', hoverRotation: 'hover:-rotate-2' },
    { title: 'Total Akun', value: totalUsers ?? 0, icon: Users, color: 'text-slate-900', bg: 'bg-blue-300', hoverRotation: 'hover:rotate-2' },
    { title: 'Total Modul', value: totalClasses ?? 0, icon: BookOpen, color: 'text-slate-900', bg: 'bg-emerald-300', hoverRotation: 'hover:-rotate-2' },
    { title: 'Total Materi', value: totalMaterials ?? 0, icon: Star, color: 'text-slate-900', bg: 'bg-yellow-300', hoverRotation: 'hover:rotate-2' },
    { title: 'Tugas Masuk', value: totalSubmissions ?? 0, icon: ClipboardCheck, color: 'text-slate-900', bg: 'bg-pink-300', hoverRotation: 'hover:-rotate-2' },
    { title: 'Absen Hari Ini', value: todayAttendance ?? 0, icon: Activity, color: 'text-slate-900', bg: 'bg-orange-300', hoverRotation: 'hover:rotate-2' },
  ]

  // Logic Sapaan berdasarkan Jam (WIB)
  const currentHour = new Date().getHours()
  let greeting = 'Selamat Malam'
  if (currentHour >= 5 && currentHour < 12) greeting = 'Selamat Pagi'
  else if (currentHour >= 12 && currentHour < 15) greeting = 'Selamat Siang'
  else if (currentHour >= 15 && currentHour < 18) greeting = 'Selamat Sore'

  return (
    <div className="p-4 md:p-8 space-y-10 max-w-7xl mx-auto min-h-screen font-sans overflow-x-hidden">

      {/* Header Pusat Komando */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-100 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] md:shadow-[12px_12px_0px_#0f172a] rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 relative overflow-hidden mt-4">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        <div className="relative z-10 flex-1">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <div className="bg-yellow-300 p-3 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] transform -rotate-3 hover:rotate-6 transition-transform shrink-0">
              <ShieldAlert className="h-8 w-8 md:h-10 md:w-10 text-slate-900" />
            </div>
            Pusat Komando
          </h1>
          <p className="text-slate-700 font-bold text-base md:text-lg mt-4 md:mt-5 bg-white inline-block px-4 py-1.5 border-2 border-slate-900 rounded-xl shadow-sm rotate-1 hover:-rotate-1 transition-transform">
            {greeting}, Komandan! Pantau semua metrik sistem dari sini.
          </p>
        </div>

        {/* System Status Badges */}
        <div className="relative z-10 flex flex-col sm:flex-row gap-4 mt-6 lg:mt-0 shrink-0">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border-4 shadow-[4px_4px_0px_#0f172a] font-black text-sm md:text-base transform -rotate-1 hover:rotate-0 transition-transform ${settings?.is_attendance_open ? 'bg-emerald-300 border-slate-900 text-slate-900' : 'bg-slate-200 border-slate-900 text-slate-500'}`}>
            <span className={`w-4 h-4 rounded-full border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] ${settings?.is_attendance_open ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            Absensi {settings?.is_attendance_open ? 'Dibuka' : 'Ditutup'}
          </div>
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border-4 shadow-[4px_4px_0px_#0f172a] font-black text-sm md:text-base transform rotate-1 hover:rotate-0 transition-transform ${settings?.is_registration_open ? 'bg-blue-300 border-slate-900 text-slate-900' : 'bg-slate-200 border-slate-900 text-slate-500'}`}>
            <span className={`w-4 h-4 rounded-full border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] ${settings?.is_registration_open ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'}`} />
            Daftar {settings?.is_registration_open ? 'Terbuka' : 'Ditutup'}
          </div>
        </div>
      </div>

      {/* Tindakan Cepat (Quick Actions) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-2">
        <Link href="/admin/blog/new">
          <Button className="w-full h-16 bg-pink-400 hover:bg-pink-300 text-slate-900 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] active:shadow-none active:translate-y-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0f172a] transition-all rounded-[1.5rem] text-lg uppercase flex items-center justify-center gap-3">
            <PenTool className="h-6 w-6" /> Tulis Berita
          </Button>
        </Link>
        <Link href="/admin/classes">
          <Button className="w-full h-16 bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] active:shadow-none active:translate-y-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0f172a] transition-all rounded-[1.5rem] text-lg uppercase flex items-center justify-center gap-3">
            <PlusCircle className="h-6 w-6" /> Buat Kelas
          </Button>
        </Link>
        <Link href="/admin/users">
          <Button className="w-full h-16 bg-orange-400 hover:bg-orange-300 text-slate-900 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] active:shadow-none active:translate-y-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0f172a] transition-all rounded-[1.5rem] text-lg uppercase flex items-center justify-center gap-3">
            <UserPlus className="h-6 w-6" /> Kelola Akun
          </Button>
        </Link>
        <Link href="/admin/activity">
          <Button className="w-full h-16 bg-slate-900 hover:bg-slate-800 text-white font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] active:shadow-none active:translate-y-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0f172a] transition-all rounded-[1.5rem] text-lg uppercase flex items-center justify-center gap-3">
            <Radio className="h-6 w-6 text-yellow-400" /> Activity Log
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 pt-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className={`group border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-[1.5rem] md:rounded-[24px] bg-white transform transition-all duration-300 overflow-hidden flex flex-col ${stat.hoverRotation} hover:-translate-y-2 hover:shadow-[10px_10px_0px_#0f172a] cursor-default`}>
              <div className={`h-4 md:h-5 w-full border-b-4 border-slate-900 ${stat.bg}`}></div>
              <CardHeader className="pb-2 pt-5 md:pt-6">
                <CardTitle className={`text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-slate-500 flex flex-col xl:flex-row xl:items-center gap-2 xl:gap-3`}>
                  <div className={`p-2 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] ${stat.bg} w-fit group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-5 w-5 md:h-6 md:w-6 ${stat.color}`} />
                  </div>
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="mt-auto pb-5 md:pb-6">
                <div className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight group-hover:text-violet-600 transition-colors duration-300">
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Analytics Charts */}
      <div className="pt-4">
        <AdminCharts 
          xpData={xpRanges} 
          attendanceData={chartAttendance} 
          submissionData={chartSubmissions}
          roleData={chartRoles}
        />
      </div>

      {/* ====== TOP STUDENTS LEADERBOARD (UPGRADED) ====== */}
      <div className="pt-4 pb-12">
        <h3 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 md:mb-8 flex items-center gap-3 pl-2">
          <Star className="w-8 h-8 md:w-10 md:h-10 text-yellow-500 fill-yellow-400 animate-pulse" /> Papan Penguasa Basecamp
        </h3>
        
        <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[2rem] overflow-hidden bg-slate-50 flex flex-col">
          <CardHeader className="border-b-4 border-slate-900 bg-yellow-400 p-6 md:p-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(0deg,transparent,transparent_19px,#000_20px)]" />
            <CardTitle className="text-2xl md:text-3xl font-black flex items-center gap-3 text-slate-900 uppercase relative z-10">
              🎖️ Top 5 Siswa Veteran 
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-0 flex-1">
            <div className="divide-y-4 divide-slate-900">
              {topStudents && topStudents.length > 0 ? (
                topStudents.map((student, idx) => {
                  const level = Math.floor((student.points || 0) / 100) + 1
                  
                  let rankBg = 'bg-white'
                  let rankShadow = 'shadow-[4px_4px_0px_#cbd5e1]'
                  let rankBorder = 'border-slate-300 text-slate-400'
                  let isTop = false

                  if (idx === 0) { rankBg = 'bg-yellow-300'; rankShadow = 'shadow-[4px_4px_0px_#0f172a]'; rankBorder = 'border-slate-900 text-slate-900'; isTop = true }
                  else if (idx === 1) { rankBg = 'bg-slate-300'; rankShadow = 'shadow-[4px_4px_0px_#0f172a]'; rankBorder = 'border-slate-900 text-slate-900'; isTop = true }
                  else if (idx === 2) { rankBg = 'bg-orange-400'; rankShadow = 'shadow-[4px_4px_0px_#0f172a]'; rankBorder = 'border-slate-900 text-slate-900'; isTop = true }
                  
                  return (
                    <div key={student.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-6 md:p-8 hover:bg-white transition-all gap-4 group cursor-default hover:-translate-y-1`}>
                      <div className="flex items-center gap-4 md:gap-6">
                        <div className={`w-14 h-14 md:w-16 md:h-16 flex items-center justify-center font-black text-2xl md:text-3xl rounded-2xl border-4 shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-3 ${rankBorder} ${rankBg} ${rankShadow}`}>
                          {idx === 0 ? <Trophy className="w-8 h-8 text-slate-900 fill-slate-900" /> : idx + 1}
                        </div>

                        <div className="min-w-0">
                          <div className="font-black text-slate-900 text-xl md:text-2xl leading-tight truncate group-hover:text-violet-700 transition-colors">
                            {student.full_name}
                          </div>
                          <div className="text-xs md:text-sm font-bold text-slate-600 mt-2 flex flex-wrap items-center gap-2">
                            <span className="bg-slate-200 border-2 border-slate-900 px-2 py-0.5 rounded-md shadow-[2px_2px_0px_#0f172a]">@{student.username}</span> 
                            <span className="text-violet-900 bg-violet-300 border-2 border-slate-900 px-3 py-0.5 rounded-md shadow-[2px_2px_0px_#0f172a]">Level {level}</span>
                          </div>
                        </div>
                      </div>

                      <div className={`font-black text-2xl md:text-3xl text-slate-900 flex items-center gap-2 self-start sm:self-auto px-6 py-3 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] transform transition-transform shrink-0 mt-3 sm:mt-0 ${isTop ? 'bg-emerald-300 sm:rotate-2 group-hover:rotate-0' : 'bg-white group-hover:-rotate-2'}`}>
                        {student.points} <span className="text-sm md:text-base font-bold text-slate-700 uppercase tracking-widest mt-1">XP</span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="p-16 md:p-24 text-center text-slate-400 font-black text-xl bg-white border-b-4 border-slate-900 uppercase tracking-widest">
                  Belum ada data pahlawan.
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="p-0 border-t-4 border-slate-900">
            <Link href="/admin/users" className="w-full">
              <Button className="w-full h-16 md:h-20 rounded-none bg-slate-900 hover:bg-slate-800 text-white font-black text-lg md:text-xl uppercase tracking-widest transition-colors flex items-center justify-center group">
                Intip Semua Pasukan <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

    </div>
  )
}