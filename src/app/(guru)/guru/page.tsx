import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, ClipboardCheck, Star, GraduationCap, PlusCircle, PenTool, ArrowRight, FolderOpen, Users } from 'lucide-react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function GuruDashboardPage() {
  const supabase = await createClient()

  // Ambil sesi user saat ini
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Ambil data profil guru untuk sapaan
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()

  // PERBAIKAN: Kembalikan select ke versi awal yang 100% aman
  const { data: myClasses } = await supabase
    .from('classes')
    .select('id, title, description, created_at')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })

  const myClassIds = myClasses?.map(c => c.id) || []
  const totalClasses = myClassIds.length

  let totalMaterials = 0
  let totalSubmissions = 0
  
  if (totalClasses > 0) {
    const [{ count: mCount }, { count: sCount }] = await Promise.all([
      supabase.from('materials').select('*', { count: 'exact', head: true }).in('class_id', myClassIds),
      supabase.from('submissions').select('*', { count: 'exact', head: true }).in('class_id', myClassIds),
    ])
    totalMaterials = mCount || 0
    totalSubmissions = sCount || 0
  }

  // Ambil 3 kelas terbaru untuk ditampilkan di preview
  const recentClasses = myClasses?.slice(0, 3) || []
  const recentClassIds = recentClasses.map(c => c.id)

  // PERBAIKAN: Hitung jumlah murid secara terpisah agar aman dari error relasi
  const memberCounts: Record<string, number> = {}
  if (recentClassIds.length > 0) {
    const { data: members } = await supabase
      .from('class_members')
      .select('class_id')
      .in('class_id', recentClassIds)
      
    if (members) {
      members.forEach(m => {
        memberCounts[m.class_id] = (memberCounts[m.class_id] || 0) + 1
      })
    }
  }

  // Logic Sapaan berdasarkan Jam Server
  const currentHour = new Date().getHours()
  let greeting = 'Selamat Malam'
  if (currentHour >= 5 && currentHour < 12) greeting = 'Selamat Pagi'
  else if (currentHour >= 12 && currentHour < 15) greeting = 'Selamat Siang'
  else if (currentHour >= 15 && currentHour < 18) greeting = 'Selamat Sore'

  const statCards = [
    {
      title: 'Kelas Aktif',
      value: totalClasses,
      icon: BookOpen,
      color: 'text-slate-900',
      bg: 'bg-emerald-300',
      hoverRotation: 'hover:-rotate-2',
    },
    {
      title: 'Materi Dibuat',
      value: totalMaterials,
      icon: Star,
      color: 'text-slate-900',
      bg: 'bg-yellow-300',
      hoverRotation: 'hover:rotate-2',
    },
    {
      title: 'Tugas Masuk',
      value: totalSubmissions,
      icon: ClipboardCheck,
      color: 'text-slate-900',
      bg: 'bg-pink-300',
      hoverRotation: 'hover:-rotate-2',
    },
  ]

  return (
    <div className="p-4 md:p-8 space-y-10 max-w-7xl mx-auto min-h-screen font-sans relative z-0 overflow-x-hidden pb-24">
      
      {/* ====== BACKGROUND DOT PATTERN ====== */}
      <div className="absolute inset-0 z-[-1] bg-[radial-gradient(#cbd5e1_2px,transparent_2px)] [background-size:32px_32px] opacity-40 fixed"></div>

      {/* ====== HEADER ====== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-100 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] md:shadow-[12px_12px_0px_#0f172a] rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 relative overflow-hidden mt-4">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        <div className="relative z-10 flex-1">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight flex flex-wrap items-center gap-4 uppercase">
            <div className="bg-yellow-400 p-3 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] transform -rotate-6 hover:rotate-3 transition-transform shrink-0">
              <GraduationCap className="h-8 w-8 md:h-10 md:w-10 text-slate-900" />
            </div>
            Markas Guru
          </h1>
          <p className="text-slate-700 font-bold text-base md:text-lg mt-4 bg-white inline-block px-4 py-2 border-2 border-slate-900 rounded-xl shadow-sm rotate-1 hover:-rotate-1 transition-transform">
            {greeting}, Master <span className="text-violet-600 underline decoration-wavy underline-offset-4">{profile?.full_name?.split(' ')[0] || 'Guru'}</span>! Pantau kelas dan progres pasukanmu di sini.
          </p>
        </div>
      </div>

      {/* ====== QUICK ACTIONS ====== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 pt-2">
        <Link href="/guru/classes">
          <Button className="w-full h-16 bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] active:shadow-none active:translate-y-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0f172a] transition-all rounded-[1.5rem] text-base md:text-lg uppercase flex items-center justify-center gap-3">
            <PlusCircle className="h-6 w-6" /> Rilis Kelas Baru
          </Button>
        </Link>
        <Link href="/guru/classes">
          <Button className="w-full h-16 bg-pink-400 hover:bg-pink-300 text-slate-900 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] active:shadow-none active:translate-y-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0f172a] transition-all rounded-[1.5rem] text-base md:text-lg uppercase flex items-center justify-center gap-3">
            <ClipboardCheck className="h-6 w-6" /> Periksa Tugas
          </Button>
        </Link>
        <Link href="/guru/blog">
          <Button className="w-full h-16 bg-blue-400 hover:bg-blue-300 text-slate-900 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] active:shadow-none active:translate-y-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0f172a] transition-all rounded-[1.5rem] text-base md:text-lg uppercase flex items-center justify-center gap-3">
            <PenTool className="h-6 w-6" /> Tulis Pengumuman
          </Button>
        </Link>
      </div>

      {/* ====== STATS GRID ====== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 pt-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className={`group border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-[1.5rem] md:rounded-[24px] bg-white transform transition-all duration-300 overflow-hidden flex flex-col ${stat.hoverRotation} hover:-translate-y-2 hover:shadow-[8px_8px_0px_#0f172a] cursor-default`}>
              <div className={`h-4 md:h-5 w-full border-b-4 border-slate-900 ${stat.bg}`}></div>
              <CardHeader className="pb-2 pt-5 md:pt-6">
                <CardTitle className={`text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-slate-500 flex flex-row items-center gap-3`}>
                  <div className={`p-2 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] ${stat.bg} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-5 w-5 md:h-6 md:w-6 ${stat.color}`} />
                  </div>
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="mt-auto pb-5 md:pb-6">
                <div className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight group-hover:text-violet-600 transition-colors duration-300">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ====== RECENT CLASSES ====== */}
      <div className="pt-8">
         <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 md:mb-8">
            <div>
              <h3 className="text-3xl md:text-4xl font-black text-slate-900 flex items-center gap-3 pl-2 uppercase tracking-tight">
                <FolderOpen className="w-8 h-8 md:w-10 md:h-10 text-violet-500" /> Kelas Olahanmu
              </h3>
              <p className="text-slate-500 font-bold pl-2 mt-2">Menampilkan modulumu yang baru saja diaktifkan.</p>
            </div>
            {totalClasses > 3 && (
              <Link href="/guru/classes">
                <Button variant="outline" className="font-black border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all uppercase">
                  Lihat Semua <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            )}
         </div>

         {recentClasses.length === 0 ? (
           <div className="bg-white border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[2rem] p-10 md:p-16 text-center transform rotate-1 hover:rotate-0 transition-transform">
             <div className="w-24 h-24 bg-slate-100 rounded-full border-4 border-slate-900 border-dashed flex items-center justify-center mx-auto mb-6 shadow-inner">
               <BookOpen className="h-10 w-10 text-slate-400" />
             </div>
             <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase">Gudang Senjata Masih Kosong</h2>
             <p className="text-slate-500 font-bold mt-3 text-lg">Kamu belum membuat materi atau kelas apapun.</p>
             <Link href="/guru/classes">
                <Button className="mt-8 h-14 px-8 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black text-lg border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] active:shadow-none active:translate-y-1 hover:-translate-y-1 transition-all rounded-2xl uppercase">
                  Mulai Rakit Modul <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
             </Link>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {recentClasses.map((kelas, idx) => {
                const rotClass = idx % 2 === 0 ? 'hover:-rotate-2' : 'hover:rotate-2'
                const barColors = ['bg-emerald-400', 'bg-violet-400', 'bg-pink-400']
                
                // Ambil jumlah peserta dari perhitungan terpisah yang super aman
                const studentCount = memberCounts[kelas.id] || 0

                return (
                  <Link key={kelas.id} href={`/guru/classes/${kelas.id}`} className="block group">
                    <Card className={`border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-[2rem] bg-white h-full flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-[10px_10px_0px_#0f172a] ${rotClass}`}>
                      <div className={`h-6 w-full ${barColors[idx % 3]} border-b-4 border-slate-900 flex justify-end px-3 items-center`} >
                         <div className="w-2 h-2 rounded-full bg-white border-2 border-slate-900 mr-1"></div>
                         <div className="w-2 h-2 rounded-full bg-white border-2 border-slate-900"></div>
                      </div>
                      <CardHeader className="p-6 pb-2">
                        <CardTitle className="text-2xl font-black text-slate-900 leading-tight line-clamp-2 group-hover:text-violet-700 transition-colors">
                          {kelas.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 pt-2 mt-auto">
                        <p className="text-sm font-bold text-slate-500 line-clamp-2 mb-4">
                          {kelas.description || 'Tanpa deskripsi intel.'}
                        </p>

                        <div className="mb-6 flex items-center gap-2">
                            <Badge className="bg-slate-100 text-slate-700 border-2 border-slate-300 px-3 py-1 font-bold text-xs uppercase shadow-sm">
                                <Users className="w-3.5 h-3.5 mr-1.5" /> {studentCount} Pasukan Bergabung
                            </Badge>
                        </div>

                        <div className="flex items-center justify-between border-t-4 border-slate-100 pt-4">
                            <span className="text-slate-900 font-black uppercase text-sm group-hover:underline decoration-2 underline-offset-4">
                            Kelola Ruang 
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center transform group-hover:translate-x-2 transition-transform">
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
             })}
           </div>
         )}
      </div>

    </div>
  )
}