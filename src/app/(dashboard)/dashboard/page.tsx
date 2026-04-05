import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Flame, Trophy, Star, BookOpen, ArrowRight, CalendarCheck, Rocket, Library, Hand, UserCircle } from "lucide-react"
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
    { data: recentClassesData },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('class_members').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('attendances').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    // Ambil 4 kelas terakhir yang diikuti
    supabase.from('class_members').select('classes(id, title, description, materials(count))').eq('user_id', user.id).limit(4),
  ])

  const currentPoints = profile?.points || 0
  const level = Math.floor(currentPoints / 100) + 1
  const xpProgress = currentPoints % 100

  const firstName = profile?.full_name?.split(' ')[0] || 'Pasukan'
  const totalClasses = joinedClassCount || 0
  const totalAttendances = attendanceCount || 0
  
  // Bersihkan data dari Supabase agar mudah di-map
  const recentClasses = recentClassesData?.map((item: any) => item.classes).filter(Boolean) || []

  // Logic Sapaan
  const currentHour = new Date().getHours()
  let greeting = 'Selamat Malam'
  if (currentHour >= 5 && currentHour < 12) greeting = 'Selamat Pagi'
  else if (currentHour >= 12 && currentHour < 15) greeting = 'Selamat Siang'
  else if (currentHour >= 15 && currentHour < 18) greeting = 'Selamat Sore'

  return (
    <div className="p-3 sm:p-4 md:p-8 space-y-6 md:space-y-10 max-w-7xl mx-auto font-sans relative z-0 overflow-x-hidden pb-24">
      
      {/* ====== BACKGROUND DOT PATTERN ====== */}
      <div className="absolute inset-0 z-[-1] bg-[radial-gradient(#cbd5e1_2px,transparent_2px)] [background-size:32px_32px] opacity-40 fixed"></div>

      {/* ====== HEADER SECTION ====== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 bg-yellow-300 border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] md:shadow-[12px_12px_0px_#0f172a] rounded-[1.5rem] md:rounded-[3rem] p-5 md:p-10 -rotate-1 hover:rotate-0 transition-transform duration-300 mt-2 md:mt-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 10px)' }}></div>
        
        <div className="flex gap-3 md:gap-6 items-center relative z-10 w-full md:w-auto">
          <div className="w-12 h-12 md:w-20 md:h-20 bg-white border-2 md:border-4 border-slate-900 rounded-xl md:rounded-[1.5rem] flex items-center justify-center shadow-[2px_2px_0px_#0f172a] md:shadow-[4px_4px_0px_#0f172a] shrink-0 overflow-hidden transform -rotate-6 hover:rotate-6 transition-transform">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <Hand className="w-6 h-6 md:w-10 md:h-10 text-yellow-500 fill-yellow-200" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl md:text-5xl font-black text-slate-900 tracking-tight truncate leading-tight uppercase">
              {greeting}, <span className="text-violet-700">{firstName}!</span>
            </h1>
            <p className="text-slate-800 font-bold mt-1 md:mt-2 text-xs md:text-lg bg-white/60 inline-block px-2 md:px-3 py-0.5 md:py-1 border-2 border-slate-900 rounded-lg md:rounded-xl shadow-sm">
              Siap menyelesaikan misi hari ini?
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 bg-orange-400 text-slate-900 px-4 md:px-6 py-2 md:py-4 rounded-xl md:rounded-[2rem] border-2 md:border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] md:shadow-[6px_6px_0px_#0f172a] rotate-2 hover:-rotate-2 transition-transform relative z-10 shrink-0 self-start md:self-auto justify-center mt-2 md:mt-0">
          <Flame className="h-5 w-5 md:h-8 md:w-8 fill-yellow-300 text-slate-900 animate-pulse" />
          <div className="flex flex-col">
            <span className="font-black text-lg md:text-2xl leading-none">{profile?.streak || 0} Hari</span>
            <span className="font-bold text-[9px] md:text-xs tracking-wider uppercase hidden sm:block md:mt-0.5">Runtutan Aktif</span>
          </div>
        </div>
      </div>

      {/* ====== GAMIFICATION STATS (Level & XP) ====== */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8">
        {/* Level Card (Full width di mobile) */}
        <Card className="col-span-2 md:col-span-1 group border-2 md:border-4 border-slate-900 bg-violet-300 shadow-[4px_4px_0px_#0f172a] md:shadow-[6px_6px_0px_#0f172a] rounded-[1.2rem] md:rounded-[2rem] overflow-hidden hover:-translate-y-2 hover:shadow-[6px_6px_0px_#0f172a] md:hover:shadow-[10px_10px_0px_#0f172a] transition-all cursor-default">
          <CardHeader className="p-3 md:p-6 pb-2 md:pb-4 bg-violet-400 border-b-2 md:border-b-4 border-slate-900 flex flex-row items-center gap-2 md:gap-3">
            <div className="bg-white p-1.5 md:p-2 rounded-lg md:rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] group-hover:scale-110 transition-transform">
                <Star className="h-4 w-4 md:h-5 md:w-5 fill-yellow-400 text-slate-900" /> 
            </div>
            <CardTitle className="text-xs md:text-base font-black text-slate-900 uppercase tracking-widest mt-0.5 md:mt-1">Pangkat Saat Ini</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-3 md:pt-6">
            <div className="text-4xl md:text-7xl font-black text-slate-900 mb-3 md:mb-6 drop-shadow-sm group-hover:text-white transition-colors">{level}</div>
            <div className="space-y-2 md:space-y-3">
              <div className="flex justify-between text-xs md:text-base font-black text-slate-800 bg-white/50 px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg border-2 border-slate-900">
                <span>Ke Level {level + 1}</span>
                <span>{xpProgress} / 100 XP</span>
              </div>
              <div className="h-4 md:h-6 w-full bg-white border-2 md:border-4 border-slate-900 rounded-full overflow-hidden shadow-inner relative">
                  <div 
                    className="h-full bg-emerald-400 border-r-2 md:border-r-4 border-slate-900 transition-all duration-1000 ease-out relative overflow-hidden" 
                    style={{ width: `${xpProgress}%` }}
                  >
                     <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_20px)]"></div>
                  </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total XP Card */}
        <Card className="group border-2 md:border-4 border-slate-900 bg-emerald-300 shadow-[4px_4px_0px_#0f172a] md:shadow-[6px_6px_0px_#0f172a] rounded-[1.2rem] md:rounded-[2rem] overflow-hidden hover:-translate-y-2 hover:shadow-[6px_6px_0px_#0f172a] md:hover:shadow-[10px_10px_0px_#0f172a] transition-all delay-75 cursor-default">
          <CardHeader className="p-3 md:p-6 pb-2 md:pb-4 bg-emerald-400 border-b-2 md:border-b-4 border-slate-900 flex flex-row items-center gap-2 md:gap-3">
            <div className="bg-white p-1.5 md:p-2 rounded-lg md:rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] group-hover:scale-110 transition-transform">
                <Trophy className="h-4 w-4 md:h-5 md:w-5 text-slate-900" />
            </div>
            <CardTitle className="text-xs md:text-base font-black text-slate-900 uppercase tracking-widest mt-0.5 md:mt-1">Total XP</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-3 md:pt-6 flex flex-col h-[calc(100%-60px)] md:h-[calc(100%-80px)]">
            <div className="text-4xl md:text-7xl font-black text-slate-900 drop-shadow-sm group-hover:text-white transition-colors">{currentPoints}</div>
            <p className="text-[10px] md:text-base font-bold text-slate-800 mt-auto leading-snug md:leading-relaxed bg-white/50 p-2 md:p-3 rounded-lg md:rounded-xl border-2 border-slate-900">Kumpulkan dari materi & absen!</p>
          </CardContent>
        </Card>

        {/* Real Stats Card */}
        <Card className="group border-2 md:border-4 border-slate-900 bg-blue-300 shadow-[4px_4px_0px_#0f172a] md:shadow-[6px_6px_0px_#0f172a] rounded-[1.2rem] md:rounded-[2rem] overflow-hidden hover:-translate-y-2 hover:shadow-[6px_6px_0px_#0f172a] md:hover:shadow-[10px_10px_0px_#0f172a] transition-all delay-150 cursor-default">
          <CardHeader className="p-3 md:p-6 pb-2 md:pb-4 bg-blue-400 border-b-2 md:border-b-4 border-slate-900 flex flex-row items-center gap-2 md:gap-3">
             <div className="bg-white p-1.5 md:p-2 rounded-lg md:rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] group-hover:scale-110 transition-transform">
                <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-slate-900" />
            </div>
            <CardTitle className="text-xs md:text-base font-black text-slate-900 uppercase tracking-widest mt-0.5 md:mt-1">Track Record</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-3 md:pt-6 space-y-2 md:space-y-4">
            <div className="flex items-center justify-between bg-white border-2 md:border-4 border-slate-900 p-2.5 md:p-5 rounded-xl md:rounded-[1.5rem] shadow-[2px_2px_0px_#0f172a] md:shadow-[4px_4px_0px_#0f172a] group-hover:-translate-y-1 transition-transform">
              <span className="text-[10px] md:text-base font-black text-slate-700 uppercase">Kelas Diikuti</span>
              <span className="font-black text-slate-900 text-xl md:text-3xl">{totalClasses}</span>
            </div>
            <div className="flex items-center justify-between bg-white border-2 md:border-4 border-slate-900 p-2.5 md:p-5 rounded-xl md:rounded-[1.5rem] shadow-[2px_2px_0px_#0f172a] md:shadow-[4px_4px_0px_#0f172a] group-hover:-translate-y-1 transition-transform">
              <span className="text-[10px] md:text-base font-black text-slate-700 uppercase">Total Hadir</span>
              <span className="font-black text-slate-900 text-xl md:text-3xl flex items-center gap-1">{totalAttendances} <span className="text-xs md:text-lg text-slate-400">Hari</span></span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ====== MAIN CONTENT WIDGETS ====== */}
      <div className="grid md:grid-cols-2 gap-6 md:gap-8">

        {/* Widget 1: CTA Lanjutkan Belajar */}
        <div className="p-6 md:p-10 rounded-[1.5rem] md:rounded-[2.5rem] bg-slate-900 text-white relative overflow-hidden shadow-[6px_6px_0px_#cbd5e1] md:shadow-[12px_12px_0px_#cbd5e1] border-2 md:border-4 border-slate-900 group flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-40 h-40 md:w-64 md:h-64 bg-violet-600 rounded-full blur-[50px] md:blur-[80px] opacity-40 group-hover:opacity-70 group-hover:scale-110 transition-all duration-700"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 md:w-32 md:h-32 bg-orange-500 rounded-full blur-[40px] md:blur-[60px] opacity-30"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="bg-slate-800 p-2 md:p-3 rounded-xl md:rounded-2xl border-2 border-slate-700 transform group-hover:rotate-12 transition-transform">
                 <Rocket className="w-6 h-6 md:w-10 md:h-10 text-orange-400" />
              </div>
              <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight">Ruang Misi</h2>
            </div>
            <p className="text-slate-300 mb-6 md:mb-10 max-w-sm text-sm md:text-xl font-bold leading-relaxed">
              {totalClasses > 0
                ? `Kamu terdaftar di ${totalClasses} kelas. Lanjutkan penelusuranmu dan capai pangkat tertinggi!`
                : 'Kamu belum bergabung di misi manapun. Pilih kelas barumu sekarang!'}
            </p>
          </div>
          
          <Link href="/dashboard/courses" className="relative z-10 w-full sm:w-auto self-start">
            <Button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-400 text-slate-900 font-black text-sm md:text-lg h-12 md:h-16 px-6 md:px-10 rounded-full border-2 md:border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] md:shadow-[6px_6px_0px_#0f172a] hover:translate-y-1 hover:shadow-none md:hover:shadow-[2px_2px_0px_#0f172a] transition-all uppercase tracking-wider">
              {totalClasses > 0 ? 'Lanjut Belajar' : 'Cari Kelas'} <ArrowRight className="ml-2 md:ml-3 h-5 w-5 md:h-6 md:w-6" />
            </Button>
          </Link>
        </div>

        {/* Widget 2: Kelas Aktif Preview */}
        <Card className="border-2 md:border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] md:shadow-[12px_12px_0px_#0f172a] rounded-[1.5rem] md:rounded-[2.5rem] bg-slate-50 overflow-hidden flex flex-col">
          <CardHeader className="p-4 md:p-8 pb-3 md:pb-4 border-b-2 md:border-b-4 border-slate-900 bg-white flex flex-row items-center justify-between gap-2 md:gap-4">
            <CardTitle className="text-lg md:text-2xl font-black text-slate-900 flex items-center gap-2 md:gap-3 uppercase">
              <div className="bg-violet-200 p-1.5 md:p-2 rounded-lg md:rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]">
                 <Library className="w-4 h-4 md:w-6 md:h-6 text-violet-700" /> 
              </div>
              Misi Berjalan
            </CardTitle>
            <Link href="/dashboard/courses">
              <Button variant="outline" size="sm" className="font-black text-violet-700 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] hover:bg-violet-100 rounded-lg md:rounded-xl h-8 md:h-10 px-3 md:px-4 uppercase text-[10px] md:text-sm">
                Semua <ArrowRight className="ml-1 h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-4 md:p-8 space-y-3 md:space-y-4 bg-slate-50 flex-1">
            {recentClasses.length > 0 ? (
              recentClasses.map((kelas: any) => {
                const materialCount = Array.isArray(kelas.materials) ? kelas.materials[0]?.count : kelas.materials?.count || 0
                return (
                  <Link key={kelas.id} href={`/dashboard/classes/${kelas.id}`} className="block">
                    <div className="flex items-center justify-between p-3 md:p-5 rounded-xl md:rounded-2xl bg-white border-2 md:border-4 border-slate-900 hover:bg-violet-100 transition-colors group shadow-[2px_2px_0px_#cbd5e1] md:shadow-[4px_4px_0px_#cbd5e1] hover:shadow-[2px_2px_0px_#0f172a] md:hover:shadow-[4px_4px_0px_#0f172a] hover:-translate-y-1 cursor-pointer">
                      <div className="min-w-0 pr-3 md:pr-4">
                        <p className="font-black text-slate-900 group-hover:text-violet-800 transition-colors text-base md:text-xl truncate">{kelas.title}</p>
                        <p className="font-bold text-slate-500 text-xs md:text-sm mt-0.5 md:mt-1 uppercase tracking-wider">{materialCount} Fase Modul</p>
                      </div>
                      <div className="shrink-0 w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl border-2 md:border-4 border-slate-900 bg-emerald-400 flex items-center justify-center text-slate-900 group-hover:rotate-45 group-hover:scale-110 transition-transform shadow-[2px_2px_0px_#0f172a]">
                        <ArrowRight className="h-4 w-4 md:h-6 md:w-6" />
                      </div>
                    </div>
                  </Link>
                )
              })
            ) : (
              <div className="text-center py-6 md:py-10 h-full flex flex-col items-center justify-center">
                <div className="w-14 h-14 md:w-20 md:h-20 bg-white border-2 md:border-4 border-slate-300 border-dashed rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 transform -rotate-12">
                  <BookOpen className="h-6 w-6 md:h-10 md:w-10 text-slate-400" />
                </div>
                <p className="font-black text-base md:text-xl text-slate-400 uppercase tracking-widest mt-1 md:mt-2">Masih Kosong</p>
                <p className="font-bold text-slate-500 text-xs md:text-base mt-1">Kamu belum mendaftar kelas.</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* ====== QUICK ACCESS (Menu Pintas) ====== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 pt-2 md:pt-4">
        {[
          { href: '/dashboard/absensi', icon: CalendarCheck, label: 'Absensi', bg: 'bg-emerald-300' },
          { href: '/dashboard/leaderboard', icon: Trophy, label: 'Papan Skor', bg: 'bg-yellow-300' },
          { href: '/dashboard/courses', icon: BookOpen, label: 'Katalog Misi', bg: 'bg-violet-300' },
          { href: '/dashboard/profile', icon: UserCircle, label: 'Profilku', bg: 'bg-orange-300' },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}>
              <div className={`group flex flex-col items-center justify-center gap-2 md:gap-4 p-4 md:p-8 rounded-[1.2rem] md:rounded-[2rem] border-2 md:border-4 border-slate-900 text-slate-900 shadow-[4px_4px_0px_#0f172a] md:shadow-[6px_6px_0px_#0f172a] hover:-translate-y-1 md:hover:-translate-y-2 hover:shadow-[6px_6px_0px_#0f172a] md:hover:shadow-[10px_10px_0px_#0f172a] transition-all cursor-pointer ${item.bg}`}>
                <div className="w-10 h-10 md:w-16 md:h-16 bg-white rounded-xl md:rounded-2xl border-2 md:border-4 border-slate-900 flex items-center justify-center shadow-[2px_2px_0px_#0f172a] md:shadow-[4px_4px_0px_#0f172a] group-hover:scale-110 group-hover:rotate-6 transition-transform">
                  <Icon className="h-5 w-5 md:h-8 md:w-8" />
                </div>
                <span className="text-sm md:text-xl font-black uppercase tracking-wider text-center leading-tight">{item.label}</span>
              </div>
            </Link>
          )
        })}
      </div>

    </div>
  )
}