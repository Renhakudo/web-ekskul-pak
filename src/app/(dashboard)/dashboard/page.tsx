import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Flame, Trophy, Star, BookOpen, ArrowRight, CalendarCheck, Sparkles, Rocket, Library, Hand } from "lucide-react"
import Link from "next/link"

export default async function StudentDashboard() {
  const supabase = await createClient()

  // Server-side auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { count: joinedClassCount },
    { count: attendanceCount },
    { data: recentClasses },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('class_members').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('attendances').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('class_members').select('classes(id, title, description, materials(count))').eq('user_id', user.id).limit(4),
  ])

  const currentPoints = profile?.points || 0
  const level = Math.floor(currentPoints / 100) + 1
  const xpProgress = currentPoints % 100

  const firstName = profile?.full_name?.split(' ')[0] || 'Siswa'
  const totalClasses = joinedClassCount || 0
  const totalAttendances = attendanceCount || 0

  return (
    <div className="p-6 md:p-8 space-y-10 max-w-7xl mx-auto font-sans">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-yellow-200 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] p-8 -rotate-1 hover:rotate-0 transition-transform duration-300">
        <div className="flex gap-4 items-center">
          <div className="w-16 h-16 bg-white border-2 border-slate-900 rounded-full flex items-center justify-center shadow-[4px_4px_0px_#0f172a]">
            <Hand className="w-8 h-8 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Halo, {firstName}!
            </h1>
            <p className="text-slate-700 font-bold mt-1 text-lg">Siap bereksperimen hari ini?</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-orange-400 text-slate-900 px-6 py-3 rounded-full border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rotate-2 hover:-rotate-2 transition-transform">
          <Flame className="h-6 w-6 fill-yellow-300 text-slate-900" />
          <span className="font-black text-xl">{profile?.streak || 0} Hari</span>
        </div>
      </div>

      {/* Gamification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Level Card */}
        <Card className="border-4 border-slate-900 bg-violet-300 shadow-[6px_6px_0px_#0f172a] rounded-[32px] overflow-hidden hover:-translate-y-2 transition-transform">
          <CardHeader className="pb-2 bg-violet-400 border-b-4 border-slate-900">
            <CardTitle className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Star className="h-5 w-5 fill-slate-900 text-slate-900" /> Current Level
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-5xl font-black text-slate-900 mb-4">{level}</div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold text-slate-800">
                <span>Ke Level {level + 1}</span>
                <span>{xpProgress}/100 XP</span>
              </div>
              <Progress value={xpProgress} className="h-4 bg-white border-2 border-slate-900 [&>div]:bg-slate-900 rounded-full" />
            </div>
          </CardContent>
        </Card>

        {/* Total XP Card */}
        <Card className="border-4 border-slate-900 bg-emerald-300 shadow-[6px_6px_0px_#0f172a] rounded-[32px] overflow-hidden hover:-translate-y-2 transition-transform delay-75">
          <CardHeader className="pb-2 bg-emerald-400 border-b-4 border-slate-900">
            <CardTitle className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Trophy className="h-5 w-5 text-slate-900" /> Total XP
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-5xl font-black text-slate-900">{currentPoints}</div>
            <p className="text-sm font-bold text-slate-800 mt-4 leading-relaxed">Kumpulkan XP dari karya dan kehadiran rajinmu!</p>
          </CardContent>
        </Card>

        {/* Real Stats Card */}
        <Card className="border-4 border-slate-900 bg-blue-300 shadow-[6px_6px_0px_#0f172a] rounded-[32px] overflow-hidden hover:-translate-y-2 transition-transform delay-150">
          <CardHeader className="pb-2 bg-blue-400 border-b-4 border-slate-900">
            <CardTitle className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-slate-900" /> Track Record
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between bg-white border-2 border-slate-900 px-4 py-3 rounded-2xl shadow-[2px_2px_0px_#0f172a]">
              <span className="text-sm font-bold text-slate-700">Kelas Diikuti</span>
              <span className="font-black text-slate-900 text-xl">{totalClasses}</span>
            </div>
            <div className="flex items-center justify-between bg-white border-2 border-slate-900 px-4 py-3 rounded-2xl shadow-[2px_2px_0px_#0f172a]">
              <span className="text-sm font-bold text-slate-700">Total Check-In</span>
              <span className="font-black text-slate-900 text-xl">{totalAttendances}×</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Widgets */}
      <div className="grid md:grid-cols-2 gap-8">

        {/* Widget 1: CTA Lanjutkan Belajar */}
        <div className="p-8 rounded-[40px] bg-slate-900 text-white relative overflow-hidden shadow-[10px_10px_0px_#cbd5e1] border-4 border-slate-900 group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600 rounded-full blur-[80px] opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Rocket className="w-8 h-8 text-orange-400" />
              <h2 className="text-3xl font-black">Lanjutkan Belajar</h2>
            </div>
            <p className="text-slate-300 mb-8 max-w-sm text-lg font-medium leading-relaxed">
              {totalClasses > 0
                ? `Kamu terdaftar di ${totalClasses} kelas. Lanjutkan materimu dan capai target barumu!`
                : 'Pilih kelas barumu sekarang. Mari mulai belajar!'}
            </p>
            <Link href="/dashboard/courses">
              <Button className="bg-orange-400 hover:bg-orange-300 text-slate-900 font-black text-lg h-14 px-8 rounded-full border-2 border-orange-200 shadow-[4px_4px_0px_#ea580c] hover:translate-y-1 hover:shadow-none transition-all">
                Mulai Belajar <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Widget 2: Kelas yang Diikuti (real data) */}
        <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[40px] bg-white overflow-hidden">
          <CardHeader className="pb-4 border-b-4 border-slate-900 bg-slate-50 flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Library className="w-6 h-6 text-violet-600" /> Kelas Aktif
            </CardTitle>
            <Link href="/dashboard/courses">
              <Button variant="ghost" size="sm" className="font-bold text-violet-600 hover:text-violet-700 hover:bg-violet-100 rounded-full">
                Lihat Semua <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-6 space-y-4 bg-white">
            {recentClasses && recentClasses.length > 0 ? (
              (recentClasses as any[]).map((member) => {
                const kelas = member.classes
                if (!kelas) return null
                const materialCount = kelas.materials?.[0]?.count || 0
                return (
                  <Link key={kelas.id} href={`/dashboard/classes/${kelas.id}`}>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white border-2 border-slate-900 hover:bg-violet-50 transition-colors group shadow-sm hover:shadow-[3px_3px_0px_#0f172a] cursor-pointer">
                      <div>
                        <p className="font-black text-slate-900 group-hover:text-violet-700 transition-colors text-lg">{kelas.title}</p>
                        <p className="font-bold text-slate-500 text-sm mt-1">{materialCount} Modul Materi</p>
                      </div>
                      <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-emerald-400 flex items-center justify-center text-slate-900 group-hover:rotate-45 transition-transform shadow-[2px_2px_0px_#0f172a]">
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    </div>
                  </Link>
                )
              })
            ) : (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-slate-300 border-dashed">
                  <BookOpen className="h-8 w-8 text-slate-400" />
                </div>
                <p className="font-bold text-slate-600">Belum ada kelas yang diambil.</p>
                <Link href="/dashboard/courses">
                  <Button className="mt-4 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] font-bold">
                    Cari Kelas Baru
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
        {[
          { href: '/dashboard/absensi', icon: CalendarCheck, label: 'Absensi', bg: 'bg-emerald-300' },
          { href: '/dashboard/leaderboard', icon: Trophy, label: 'Papan Skor', bg: 'bg-yellow-300' },
          { href: '/dashboard/courses', icon: BookOpen, label: 'Daftar Kelas', bg: 'bg-violet-300' },
          { href: '/dashboard/profile', icon: Star, label: 'Profilku', bg: 'bg-orange-300' },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex flex-col items-center justify-center gap-3 p-6 rounded-[32px] border-4 border-slate-900 text-slate-900 shadow-[6px_6px_0px_#0f172a] hover:-translate-y-2 transition-all cursor-pointer ${item.bg}`}>
                <div className="w-12 h-12 bg-white rounded-full border-2 border-slate-900 flex items-center justify-center shadow-sm">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-lg font-black">{item.label}</span>
              </div>
            </Link>
          )
        })}
      </div>

    </div>
  )
}