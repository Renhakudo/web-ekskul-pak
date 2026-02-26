import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Flame, Trophy, Star, BookOpen, ArrowRight, CalendarCheck } from "lucide-react"
import Link from "next/link"

export default async function StudentDashboard() {
  const supabase = await createClient()

  // Server-side auth check (lebih aman dari useEffect client)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Ambil semua data secara paralel
  const [
    { data: profile },
    { count: joinedClassCount },
    { count: attendanceCount },
    { data: recentClasses },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    // Bug #5 Fix: Ambil jumlah kelas yang BENAR-BENAR diikuti siswa (via class_members)
    supabase
      .from('class_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('attendances')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    // Ambil kelas yang diikuti siswa (bukan semua kelas)
    supabase
      .from('class_members')
      .select('classes(id, title, description, materials(count))')
      .eq('user_id', user.id)
      .limit(4),
  ])

  // Gamification Logic
  const currentPoints = profile?.points || 0
  const level = Math.floor(currentPoints / 100) + 1
  const xpProgress = currentPoints % 100

  const firstName = profile?.full_name?.split(' ')[0] || 'Siswa'
  const totalClasses = joinedClassCount || 0
  const totalAttendances = attendanceCount || 0

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Halo, {firstName}! 👋
          </h1>
          <p className="text-slate-500 mt-1">Siap mencetak prestasi hari ini?</p>
        </div>
        <div className="flex items-center gap-2 bg-orange-50 text-orange-700 px-4 py-2 rounded-full border border-orange-100 shadow-sm">
          <Flame className="h-5 w-5 fill-orange-500 text-orange-500" />
          <span className="font-bold">{profile?.streak || 0} Day Streak</span>
        </div>
      </div>

      {/* Gamification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Level Card */}
        <Card className="border-violet-100 bg-gradient-to-br from-violet-50 to-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-violet-600 uppercase tracking-wider flex items-center gap-2">
              <Star className="h-4 w-4" /> Current Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-slate-900 mb-2">{level}</div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Progress ke Level {level + 1}</span>
                <span>{xpProgress}/100 XP</span>
              </div>
              <Progress value={xpProgress} className="h-2 bg-violet-100 [&>div]:bg-violet-600" />
            </div>
          </CardContent>
        </Card>

        {/* Total XP Card */}
        <Card className="border-yellow-100 bg-gradient-to-br from-yellow-50 to-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600 uppercase tracking-wider flex items-center gap-2">
              <Trophy className="h-4 w-4" /> Total XP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-slate-900">{currentPoints}</div>
            <p className="text-xs text-slate-500 mt-2">Kumpulkan XP dari materi & absensi.</p>
          </CardContent>
        </Card>

        {/* Real Stats Card — Bug #5 Fixed */}
        <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Status Belajar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Kelas Diikuti</span>
              <span className="font-extrabold text-slate-900 text-lg">{totalClasses}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Total Kehadiran</span>
              <span className="font-extrabold text-slate-900 text-lg">{totalAttendances}×</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Widgets */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Widget 1: CTA Lanjutkan Belajar */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white relative overflow-hidden shadow-lg">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">Lanjutkan Belajar 🚀</h2>
            <p className="text-violet-100 mb-6 text-sm leading-relaxed">
              {totalClasses > 0
                ? `Kamu mengikuti ${totalClasses} kelas aktif. Lanjutkan progress dan raih lebih banyak XP!`
                : 'Bergabunglah dengan kelas untuk mulai belajar dan mendapatkan XP!'}
            </p>
            <Link href="/dashboard/courses">
              <Button className="bg-white text-violet-700 hover:bg-violet-50 font-bold border-0">
                Lihat Semua Materi & Tugas <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <BookOpen className="absolute -bottom-6 -right-6 h-40 w-40 text-white opacity-10 rotate-12" />
        </div>

        {/* Widget 2: Kelas yang Diikuti (real data) */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              📚 Kelas Saya
            </CardTitle>
            <Link href="/dashboard/courses">
              <Button variant="ghost" size="sm" className="text-violet-600 hover:text-violet-700 text-xs">
                Lihat Semua <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentClasses && recentClasses.length > 0 ? (
              (recentClasses as any[]).map((member) => {
                const kelas = member.classes
                if (!kelas) return null
                const materialCount = kelas.materials?.[0]?.count || 0
                return (
                  <Link key={kelas.id} href={`/dashboard/classes/${kelas.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-slate-100 transition-colors group">
                      <div>
                        <p className="font-medium text-slate-900 text-sm group-hover:text-violet-700 transition-colors">{kelas.title}</p>
                        <p className="text-xs text-slate-400">{materialCount} materi</p>
                      </div>
                      <Badge variant="secondary" className="text-xs bg-violet-100 text-violet-700">
                        Buka
                      </Badge>
                    </div>
                  </Link>
                )
              })
            ) : (
              <div className="text-center py-8 text-slate-400">
                <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Belum bergabung ke kelas apapun.</p>
                <Link href="/dashboard/courses">
                  <Button variant="outline" size="sm" className="mt-3 text-xs">
                    Jelajahi Kelas
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/dashboard/absensi', icon: CalendarCheck, label: 'Absensi', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
          { href: '/dashboard/leaderboard', icon: Trophy, label: 'Leaderboard', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
          { href: '/dashboard/courses', icon: BookOpen, label: 'Materi', color: 'bg-violet-100 text-violet-700 border-violet-200' },
          { href: '/dashboard/profile', icon: Star, label: 'Profil Saya', color: 'bg-blue-100 text-blue-700 border-blue-200' },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center hover:shadow-md transition-all cursor-pointer ${item.color}`}>
                <Icon className="h-6 w-6" />
                <span className="text-sm font-semibold">{item.label}</span>
              </div>
            </Link>
          )
        })}
      </div>

    </div>
  )
}