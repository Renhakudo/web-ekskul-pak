import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, BookOpen, ClipboardCheck, Star, Activity, GraduationCap } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function GuruDashboardPage() {
  const supabase = await createClient()

  // Get current user to filter stats
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get my classes
  const { data: myClasses } = await supabase.from('classes').select('id').eq('created_by', user.id)
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

  const statCards = [
    {
      title: 'Kelas Saya',
      value: totalClasses,
      icon: BookOpen,
      color: 'text-slate-900',
      bg: 'bg-emerald-300',
      rotation: '-rotate-1',
    },
    {
      title: 'Materi Dibuat',
      value: totalMaterials,
      icon: Star,
      color: 'text-slate-900',
      bg: 'bg-yellow-300',
      rotation: 'rotate-1',
    },
    {
      title: 'Tugas Masuk',
      value: totalSubmissions,
      icon: ClipboardCheck,
      color: 'text-slate-900',
      bg: 'bg-pink-300',
      rotation: '-rotate-2',
    },
  ]

  return (
    <div className="p-6 md:p-8 space-y-10 max-w-7xl mx-auto min-h-screen font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-100 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] p-8 md:p-10 relative overflow-hidden mt-2">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <div className="bg-yellow-400 p-3 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] transform -rotate-6">
              <GraduationCap className="h-10 w-10 text-slate-900" />
            </div>
            Markas Guru
          </h1>
          <p className="text-slate-700 font-bold text-lg mt-3 bg-white inline-block px-4 py-1 border-2 border-slate-900 rounded-xl shadow-sm rotate-1">
            Pantau kelas, materi, dan progres siswa Anda di sini.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
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

      {/* Placeholder for Quick Actions or Recent Activities */}
      <div className="mt-12 bg-white border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] p-8 text-center border-dashed">
         <h2 className="text-2xl font-black text-slate-400">Pilih menu "Kelola Kelas" untuk mulai mengedit materi dan tugas.</h2>
      </div>
    </div>
  )
}
