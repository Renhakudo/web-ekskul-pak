'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { BookOpen, ArrowRight, Search, Loader2, GraduationCap, Map } from "lucide-react"
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

      const myClasses = (myClassesRes.data || [])
        .map((m: any) => m.classes)
        .filter(Boolean)

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

  if (loading) return <div className="p-12 flex justify-center mt-20"><Loader2 className="animate-spin h-10 w-10 text-violet-600" /></div>

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto min-h-screen font-sans">

      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6 bg-emerald-200 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] p-8 mt-2">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white border-2 border-slate-900 rounded-full flex items-center justify-center shadow-[4px_4px_0px_#0f172a] rotate-3">
            <Map className="h-8 w-8 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900">Daftar Kelas</h1>
            <p className="text-sm md:text-base font-bold text-emerald-900 mt-2">
              {activeTab === 'my'
                ? `Kamu mengikuti ${classes.length} kelas aktif.`
                : 'Telusuri semua kelas yang tersedia.'}
            </p>
          </div>
        </div>

        {/* Search + Tab Toggle */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {/* Tab Toggle */}
          <div className="flex items-center bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-2xl p-1 shrink-0">
            <button
              onClick={() => setActiveTab('my')}
              className={`px-4 py-2 text-sm font-black rounded-xl transition-all ${activeTab === 'my' ? 'bg-emerald-400 text-slate-900 border-2 border-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800 border-2 border-transparent'
                }`}
            >
              Kelas Saya
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-sm font-black rounded-xl transition-all ${activeTab === 'all' ? 'bg-emerald-400 text-slate-900 border-2 border-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800 border-2 border-transparent'
                }`}
            >
              Semua Kelas
            </button>
          </div>
          {/* Search */}
          <div className="relative w-full md:w-60">
            <Search className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Cari kelas..."
              className="pl-12 h-12 bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-2xl font-bold text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 focus:shadow-[2px_2px_0px_#0f172a] transition-shadow placeholder:text-slate-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {filteredClasses.length === 0 ? (
        <div className="text-center py-24 border-4 border-dashed border-slate-300 rounded-[32px] bg-slate-50">
          <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-slate-300 rotate-12">
            <BookOpen className="h-10 w-10 text-slate-400" />
          </div>
          <p className="text-xl text-slate-600 font-bold mb-4">
            {activeTab === 'my' ? 'Daftar kelasmu masih kosong!' : 'Sistem tidak dapat menemukan kelas tersebut.'}
          </p>
          {activeTab === 'my' && (
            <button
              onClick={() => setActiveTab('all')}
              className="mt-2 text-lg text-emerald-600 font-black hover:text-emerald-500 hover:underline transition-colors"
            >
              Cari kelas baru yang seru di sini <ArrowRight className="inline h-5 w-5 ml-1" />
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredClasses.map((kelas, idx) => {
            if (!kelas) return null
            const matCount = Array.isArray(kelas.materials) ? (kelas.materials[0]?.count ?? 0) : 0
            const isJoined = activeTab === 'all' && classes.some(c => c?.id === kelas.id)

            // Rotasi selang seling untuk efek seru
            const rotClass = idx % 2 === 0 ? 'hover:rotate-1' : 'hover:-rotate-1'

            return (
              <Card key={kelas.id} className={`group ${rotClass} border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] cursor-pointer bg-white overflow-hidden flex flex-col hover:-translate-y-2 hover:shadow-[4px_4px_0px_#0f172a] transition-all`}>
                <div className="h-6 w-full bg-emerald-400 border-b-4 border-slate-900" />
                <CardHeader className="p-6 pb-2">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <CardTitle className="text-2xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors leading-tight">
                      {kelas.title}
                    </CardTitle>
                    {isJoined ? (
                      <Badge className="shrink-0 bg-yellow-300 text-slate-900 border-2 border-slate-900 font-bold rounded-xl shadow-[2px_2px_0px_#0f172a]">
                        Diikuti
                      </Badge>
                    ) : (
                      <Badge className="shrink-0 bg-slate-100 text-slate-500 border-2 border-slate-300 font-bold rounded-xl">
                        Tersedia
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2 text-slate-600 font-medium text-base">
                    {kelas.description || 'Kelas ini belum memiliki deskripsi.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto p-6 pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold px-3 py-1.5 bg-slate-100 border-2 border-slate-200 rounded-xl text-slate-600 flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" /> {matCount} Fase
                    </span>
                    <Link href={`/dashboard/classes/${kelas.id}`}>
                      <Button className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-black border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:shadow-none hover:translate-y-1 transition-all rounded-xl h-10 px-4">
                        Buka Kelas <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}