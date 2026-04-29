'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { BookOpen, ArrowRight, Search, Loader2, GraduationCap, Map, CheckCircle2, UserPlus, UserMinus, Tag } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface ClassItem {
  id: string;
  title: string;
  description: string;
  created_at: string;
  category?: string;
  materials: any;
}

export default function MyCoursesPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  const [allPublicClasses, setAllPublicClasses] = useState<ClassItem[]>([])
  const [myClassIds, setMyClassIds] = useState<string[]>([])
  const [categories, setCategories] = useState<any[]>([])

  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'my' | 'all'>('my')
  const [filterCategory, setFilterCategory] = useState('Semua')

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setCurrentUserId(user.id)

      const [allClassesRes, myMembershipsRes, catRes] = await Promise.all([
        supabase.from('classes').select('id, title, description, created_at, category, materials(count)').order('created_at', { ascending: false }),
        supabase.from('class_members').select('class_id').eq('user_id', user.id),
        supabase.from('class_categories').select('*').order('name')
      ])

      setAllPublicClasses(allClassesRes.data || [])
      setCategories(catRes.data || [])
      const joinedIds = (myMembershipsRes.data || []).map((m: any) => m.class_id)
      setMyClassIds(joinedIds)
      if (joinedIds.length === 0) setActiveTab('all')
      setLoading(false)
    }
    
    fetchClasses()

    const channel = supabase
      .channel('public:dashboard_courses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, () => fetchClasses())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'class_categories' }, () => fetchClasses())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleJoin = async (classId: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (!currentUserId) return
    setJoiningId(classId)
    const { error } = await supabase.from('class_members').insert({ class_id: classId, user_id: currentUserId })
    if (error) {
      toast.error('Gagal mendaftar: ' + error.message)
    } else {
      setMyClassIds(prev => [...prev, classId])
      toast.success('Berhasil bergabung ke kelas! 🎉')
    }
    setJoiningId(null)
  }

  const handleLeave = async (classId: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (!currentUserId) return
    setJoiningId(classId)
    const { error } = await supabase.from('class_members').delete().eq('class_id', classId).eq('user_id', currentUserId)
    if (error) {
      toast.error('Gagal keluar kelas: ' + error.message)
    } else {
      setMyClassIds(prev => prev.filter(id => id !== classId))
      toast.success('Kamu keluar dari kelas.')
    }
    setJoiningId(null)
  }

  const sourceClasses = activeTab === 'my' 
    ? allPublicClasses.filter(c => myClassIds.includes(c.id))
    : allPublicClasses

  const filteredClasses = sourceClasses.filter(c => {
    const matchSearch = (c?.title || '').toLowerCase().includes(search.toLowerCase()) || (c?.description || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCategory === 'Semua' || c?.category === filterCategory
    return matchSearch && matchCat
  })

  if (loading) return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 mt-4">
      <Skeleton className="h-36 w-full rounded-[2rem] border-4 border-slate-200" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 rounded-[2rem] border-4 border-slate-200" />)}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 selection:bg-emerald-300 selection:text-emerald-950 font-sans relative z-0 overflow-x-hidden pb-24">
      
      {/* Background Dot Pattern */}
      <div className="absolute inset-0 z-[-1] bg-[radial-gradient(#cbd5e1_2px,transparent_2px)] [background-size:32px_32px] opacity-40 fixed"></div>

      <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto mt-2 md:mt-4">

        {/* ====== HEADER & KONTROL ====== */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6 md:gap-8 bg-emerald-300 border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] md:shadow-[12px_12px_0px_#0f172a] rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 relative overflow-hidden">
          
          {/* Dekorasi Background */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-400 rounded-full blur-[40px] opacity-50 pointer-events-none"></div>

          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 relative z-10">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white border-4 border-slate-900 rounded-[1.2rem] md:rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_#0f172a] transform -rotate-3 hover:rotate-6 transition-transform shrink-0">
              <Map className="h-8 w-8 md:h-10 md:w-10 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight uppercase drop-shadow-sm leading-none mb-2 md:mb-0">Peta Kelas</h1>
              <p className="text-xs md:text-lg font-bold text-emerald-950 mt-1 md:mt-3 bg-white/40 px-3 py-1.5 rounded-xl border-2 border-slate-900 border-dashed inline-block shadow-sm">
                {activeTab === 'my'
                  ? `Kamu mengoleksi ${myClassIds.length} kelas di ranselmu.`
                  : 'Eksplorasi semua wilayah yang tersedia.'}
              </p>
            </div>
          </div>

          {/* Search + Tab Toggle (Neobrutalism Controls) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto relative z-10">
            
            {/* Tab Toggle (Chunky Split Buttons) */}
            <div className="flex w-full sm:w-auto bg-slate-100 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-2xl overflow-hidden shrink-0 h-14 md:h-16">
              <button
                onClick={() => setActiveTab('my')}
                className={`flex-1 sm:px-8 h-full text-xs sm:text-sm md:text-base font-black uppercase transition-all outline-none border-r-4 border-slate-900 ${
                  activeTab === 'my' 
                  ? 'bg-yellow-400 text-slate-900 shadow-inner' 
                  : 'bg-transparent text-slate-500 hover:bg-slate-200'
                }`}
              >
                Kelas Saya
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 sm:px-8 h-full text-xs sm:text-sm md:text-base font-black uppercase transition-all outline-none ${
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
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 md:h-6 md:w-6 text-slate-400" />
              <Input
                placeholder="Cari kelas..."
                className="pl-12 md:pl-14 h-14 md:h-16 bg-white border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-2xl font-bold text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 focus:shadow-none focus:translate-y-[4px] focus:translate-x-[4px] transition-all placeholder:text-slate-400 text-sm md:text-base"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ====== FILTER KATEGORI ====== */}
        <div className="flex gap-2 flex-nowrap overflow-x-auto pb-3 pt-1 hide-scrollbar scroll-smooth">
          <button
            onClick={() => setFilterCategory('Semua')}
            className={`px-4 py-2 rounded-xl font-black text-xs border-2 border-slate-900 uppercase tracking-wider transition-all whitespace-nowrap ${
              filterCategory === 'Semua'
                ? 'bg-slate-900 text-white shadow-none'
                : 'bg-white text-slate-600 shadow-[3px_3px_0px_#0f172a] hover:-translate-y-0.5'
            }`}
          >Semua</button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.name)}
              className={`px-4 py-2 rounded-xl font-black text-xs border-2 border-slate-900 uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${
                filterCategory === cat.name
                  ? `${cat.color} text-slate-900 shadow-none`
                  : 'bg-white text-slate-600 shadow-[3px_3px_0px_#0f172a] hover:-translate-y-0.5'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full border border-slate-900 ${cat.color}`}></div>
              {cat.name}
            </button>
          ))}
        </div>

        {filteredClasses.length === 0 ? (
          <div className="text-center py-20 md:py-32 border-4 border-dashed border-slate-400 rounded-[2rem] md:rounded-[3rem] bg-white/50 relative overflow-hidden px-4">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6 border-4 border-slate-400 transform -rotate-6 shadow-inner">
              <BookOpen className="h-10 w-10 md:h-12 md:w-12 text-slate-400" />
            </div>
            <p className="text-xl md:text-3xl text-slate-600 font-black mb-3 md:mb-4 uppercase tracking-tight">
              {search 
                ? 'Tidak ada kelas dengan nama tersebut.' 
                : activeTab === 'my' ? 'Tas Ranselmu Masih Kosong!' : 'Peta Tidak Ditemukan.'}
            </p>
            {activeTab === 'my' && !search && (
              <Button
                onClick={() => setActiveTab('all')}
                className="mt-4 h-14 md:h-16 px-6 md:px-8 bg-violet-400 hover:bg-violet-300 text-slate-900 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none rounded-xl md:rounded-2xl text-sm md:text-lg uppercase transition-all"
              >
                Cari Misi Baru <ArrowRight className="inline h-5 w-5 ml-2" />
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pt-2">
            {filteredClasses.map((kelas, idx) => {
              if (!kelas) return null
              
              // Perbaikan Ekstraksi Count Materi (Sangat Aman)
              const matCount = Array.isArray(kelas.materials) ? kelas.materials[0]?.count : kelas.materials?.count || 0
              
              // Cek status kepemilikan
              const isJoined = myClassIds.includes(kelas.id)

              // Rotasi selang seling untuk efek neobrutalism yang organik
              const rotClass = idx % 2 === 0 ? 'hover:-rotate-2' : 'hover:rotate-2'
              const catColor = categories.find(c => c.name === kelas.category)?.color || 'bg-slate-400'

              return (
                <div key={kelas.id} className="block group">
                  <Card className={`h-full flex flex-col border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] md:shadow-[8px_8px_0px_#0f172a] rounded-[1.5rem] md:rounded-[2rem] bg-white overflow-hidden hover:-translate-y-2 md:hover:-translate-y-3 hover:shadow-[10px_10px_0px_#0f172a] md:hover:shadow-[12px_12px_0px_#0f172a] transition-all duration-300 ${rotClass}`}>
                    
                    {/* Top Color Bar */}
                    <div className={`h-6 md:h-8 w-full ${catColor} border-b-4 border-slate-900 flex items-center px-4 justify-between transition-colors`}>
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-white/60 border-2 border-slate-900"></div>
                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-white/60 border-2 border-slate-900"></div>
                      </div>
                      {kelas.category && (
                        <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border-2 border-slate-900 shadow-sm ${catColor} text-slate-900`}>
                          {kelas.category}
                        </span>
                      )}
                    </div>
                    
                    <CardHeader className="p-6 md:p-8 pb-2 md:pb-4">
                      <div className="flex items-start justify-between gap-3 mb-3 md:mb-4">
                        <CardTitle className="text-xl md:text-3xl font-black text-slate-900 group-hover:text-violet-700 transition-colors leading-tight line-clamp-2">
                          {kelas.title}
                        </CardTitle>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {isJoined ? (
                          <Badge className="shrink-0 bg-yellow-300 text-slate-900 border-2 border-slate-900 font-black rounded-lg shadow-[2px_2px_0px_#0f172a] px-2.5 md:px-3 py-1 uppercase text-[10px] md:text-xs tracking-wider flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 md:w-3.5 h-3 md:h-3.5" /> Diikuti
                          </Badge>
                        ) : (
                          <Badge className="shrink-0 bg-slate-100 text-slate-500 border-2 border-slate-300 font-bold rounded-lg px-2.5 md:px-3 py-1 uppercase text-[10px] md:text-xs tracking-wider shadow-sm">
                            Tersedia
                          </Badge>
                        )}
                        <span className="text-[10px] md:text-xs font-black px-2.5 md:px-3 py-1 bg-white border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-lg text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                          <GraduationCap className="h-3 md:h-3.5 w-3 md:w-3.5" /> {matCount} Fase
                        </span>
                      </div>

                      <CardDescription className="line-clamp-3 text-slate-600 font-medium md:font-semibold text-sm md:text-base leading-relaxed">
                        {kelas.description || 'Kelas ini belum memiliki deskripsi rahasia yang dicatat komandan.'}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="mt-auto p-6 md:p-8 pt-4 md:pt-6 border-t-2 border-slate-100">
                      {isJoined ? (
                        <div className="flex gap-3">
                          <Link href={`/dashboard/classes/${kelas.id}`} className="flex-1">
                            <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black border-4 border-transparent shadow-[4px_4px_0px_#cbd5e1] group-hover:shadow-none group-hover:translate-y-[4px] group-hover:translate-x-[4px] transition-all rounded-xl md:rounded-2xl h-12 md:h-14 text-sm uppercase tracking-wider flex items-center justify-center gap-2">
                              Belajar <ArrowRight className="h-5 w-5" />
                            </Button>
                          </Link>
                          <Button
                            onClick={(e) => handleLeave(kelas.id, e)}
                            disabled={joiningId === kelas.id}
                            className="h-12 md:h-14 px-3 bg-red-100 hover:bg-red-400 text-red-700 hover:text-white font-black border-2 border-slate-900 rounded-xl md:rounded-2xl transition-all shrink-0"
                            title="Keluar kelas"
                          >
                            {joiningId === kelas.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={(e) => handleJoin(kelas.id, e)}
                          disabled={joiningId === kelas.id}
                          className="w-full bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] group-hover:shadow-none group-hover:translate-y-[4px] group-hover:translate-x-[4px] transition-all rounded-xl md:rounded-2xl h-12 md:h-14 text-sm uppercase tracking-wider flex items-center justify-center gap-2"
                        >
                          {joiningId === kelas.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-5 w-5" /> Daftar Kelas</>}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}