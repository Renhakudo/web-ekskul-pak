'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { BookOpen, ArrowRight, Search, Loader2, GraduationCap, Map, Sparkles, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function MyCoursesPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState<any[]>([])
  const [allPublicClasses, setAllPublicClasses] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'my' | 'all'>('my')

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const [myClassesRes, allClassesRes] = await Promise.all([
        supabase
          .from('class_members')
          .select('classes(id, title, description, created_at, materials(count))')
          .eq('user_id', user.id),
        supabase
          .from('classes')
          .select('id, title, description, created_at, materials(count)')
          .order('created_at', { ascending: false }),
      ])

      // PERBAIKAN LOGIKA MAPPING: Mengamankan struktur data Object vs Array dari Supabase
      const myClasses = (myClassesRes.data || [])
        .map((m: any) => {
          const classObj = Array.isArray(m.classes) ? m.classes[0] : m.classes;
          return classObj;
        })
        .filter((c: any) => c && c.id) // Pastikan objeknya benar-benar ada dan punya ID

      setClasses(myClasses)
      setAllPublicClasses(allClassesRes.data || [])
      setLoading(false)
    }
    fetchClasses()
  }, [])

  const sourceClasses = activeTab === 'my' ? classes : allPublicClasses
  const filteredClasses = sourceClasses.filter(c =>
    c?.title?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7]">
      <Loader2 className="animate-spin h-14 w-14 text-violet-600 mb-4" />
      <p className="font-black text-slate-500 uppercase tracking-widest">Menggelar Peta...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 selection:bg-emerald-300 selection:text-emerald-950 font-sans relative z-0 overflow-x-hidden pb-24">
      
      {/* Background Dot Pattern */}
      <div className="absolute inset-0 z-[-1] bg-[radial-gradient(#cbd5e1_2px,transparent_2px)] [background-size:32px_32px] opacity-40 fixed"></div>

      <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto mt-4 md:mt-8">

        {/* ====== HEADER & KONTROL ====== */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-8 bg-emerald-300 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] md:shadow-[12px_12px_0px_#0f172a] rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 relative overflow-hidden">
          
          {/* Dekorasi Background */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-400 rounded-full blur-[40px] opacity-50 pointer-events-none"></div>

          <div className="flex items-center gap-5 md:gap-6 relative z-10">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white border-4 border-slate-900 rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_#0f172a] transform -rotate-3 hover:rotate-6 transition-transform shrink-0">
              <Map className="h-8 w-8 md:h-10 md:w-10 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight uppercase drop-shadow-sm">Peta Kelas</h1>
              <p className="text-sm md:text-lg font-bold text-emerald-950 mt-1 md:mt-2 bg-white/40 px-3 py-1 rounded-xl border-2 border-slate-900 border-dashed inline-block">
                {activeTab === 'my'
                  ? `Kamu mengoleksi ${classes.length} kelas aktif.`
                  : 'Eksplorasi semua wilayah yang tersedia.'}
              </p>
            </div>
          </div>

          {/* Search + Tab Toggle (Neobrutalism Controls) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto relative z-10">
            
            {/* Tab Toggle (Chunky Split Buttons) */}
            <div className="flex w-full sm:w-auto bg-slate-100 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-2xl overflow-hidden shrink-0 h-14">
              <button
                onClick={() => setActiveTab('my')}
                className={`flex-1 sm:px-6 h-full text-sm sm:text-base font-black uppercase transition-all outline-none border-r-4 border-slate-900 ${
                  activeTab === 'my' 
                  ? 'bg-yellow-400 text-slate-900 shadow-inner' 
                  : 'bg-transparent text-slate-500 hover:bg-slate-200'
                }`}
              >
                Kelas Saya
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 sm:px-6 h-full text-sm sm:text-base font-black uppercase transition-all outline-none ${
                  activeTab === 'all' 
                  ? 'bg-violet-400 text-slate-900 shadow-inner' 
                  : 'bg-transparent text-slate-500 hover:bg-slate-200'
                }`}
              >
                Semua Kelas
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64 md:w-72 shrink-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" />
              <Input
                placeholder="Cari kelas..."
                className="pl-12 h-14 bg-white border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-2xl font-bold text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 focus:shadow-none focus:translate-y-[4px] focus:translate-x-[4px] transition-all placeholder:text-slate-400 text-base"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ====== DAFTAR KELAS ====== */}
        {filteredClasses.length === 0 ? (
          <div className="text-center py-24 md:py-32 border-4 border-dashed border-slate-400 rounded-[2rem] md:rounded-[3rem] bg-white/50 relative overflow-hidden">
            <div className="w-24 h-24 bg-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6 border-4 border-slate-400 transform -rotate-6">
              <BookOpen className="h-12 w-12 text-slate-400" />
            </div>
            <p className="text-2xl md:text-3xl text-slate-600 font-black mb-4 uppercase tracking-tight px-4">
              {activeTab === 'my' ? 'Tas Ranselmu Masih Kosong!' : 'Peta Tidak Ditemukan.'}
            </p>
            {activeTab === 'my' && (
              <Button
                onClick={() => setActiveTab('all')}
                className="mt-4 h-14 px-8 bg-violet-400 hover:bg-violet-300 text-slate-900 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none rounded-xl text-base md:text-lg uppercase transition-all"
              >
                Cari Misi Baru <ArrowRight className="inline h-5 w-5 ml-2" />
              </Button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredClasses.map((kelas, idx) => {
              if (!kelas) return null
              
              // Perbaikan Ekstraksi Count Materi (Sangat Aman)
              const matCount = kelas.materials?.[0]?.count ?? kelas.materials?.count ?? 0
              const isJoined = activeTab === 'all' && classes.some(c => c?.id === kelas.id)

              // Rotasi selang seling untuk efek neobrutalism yang organik
              const rotClass = idx % 2 === 0 ? 'hover:-rotate-2' : 'hover:rotate-2'
              const barColors = ['bg-yellow-400', 'bg-pink-400', 'bg-blue-400', 'bg-emerald-400', 'bg-violet-400']
              const randomBarColor = barColors[idx % barColors.length]

              return (
                <Card key={kelas.id} className={`group ${rotClass} border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[2rem] cursor-pointer bg-white overflow-hidden flex flex-col hover:-translate-y-3 hover:shadow-[12px_12px_0px_#0f172a] transition-all duration-300`}>
                  
                  {/* Top Color Bar */}
                  <div className={`h-8 w-full ${randomBarColor} border-b-4 border-slate-900 flex items-center px-4`}>
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-white/50 border-2 border-slate-900"></div>
                      <div className="w-3 h-3 rounded-full bg-white/50 border-2 border-slate-900"></div>
                    </div>
                  </div>
                  
                  <CardHeader className="p-6 md:p-8 pb-2">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <CardTitle className="text-2xl md:text-3xl font-black text-slate-900 group-hover:text-violet-700 transition-colors leading-tight line-clamp-2">
                        {kelas.title}
                      </CardTitle>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {isJoined ? (
                        <Badge className="shrink-0 bg-yellow-300 text-slate-900 border-2 border-slate-900 font-black rounded-lg shadow-[2px_2px_0px_#0f172a] px-3 py-1 uppercase text-xs tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Diikuti
                        </Badge>
                      ) : (
                        <Badge className="shrink-0 bg-slate-100 text-slate-500 border-2 border-slate-300 font-bold rounded-lg px-3 py-1 uppercase text-xs tracking-wider">
                          Tersedia
                        </Badge>
                      )}
                      <span className="text-xs font-black px-3 py-1 bg-slate-100 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-lg text-slate-700 flex items-center gap-1.5 uppercase">
                        <GraduationCap className="h-3.5 w-3.5" /> {matCount} Fase
                      </span>
                    </div>

                    <CardDescription className="line-clamp-3 text-slate-600 font-semibold text-base leading-relaxed">
                      {kelas.description || 'Kelas ini belum memiliki deskripsi yang dicatat oleh komandan.'}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="mt-auto p-6 md:p-8 pt-6">
                    <Link href={`/dashboard/classes/${kelas.id}`} className="block">
                      <Button className={`w-full bg-slate-900 hover:bg-slate-800 text-white font-black border-4 border-transparent shadow-[4px_4px_0px_#cbd5e1] group-hover:shadow-none group-hover:translate-y-[4px] group-hover:translate-x-[4px] transition-all rounded-xl h-14 text-base md:text-lg uppercase tracking-wider flex items-center justify-between px-6`}>
                        {isJoined ? 'Lanjut Belajar' : 'Intip Kelas'}
                        <ArrowRight className="h-6 w-6 transform group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}