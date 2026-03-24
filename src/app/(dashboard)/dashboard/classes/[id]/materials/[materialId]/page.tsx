'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  CheckCircle,
  PlayCircle,
  FileText,
  Loader2,
  Trophy,
  ChevronRight,
  ChevronLeft,
  Circle
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { updateLearningStreak } from '@/lib/streak-utils'
import { awardEligibleBadges } from '@/lib/badge-utils'

const getYouTubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return (match && match[2].length === 11) ? match[2] : null
}

export default function MaterialPlayerPage({
  params
}: {
  params: Promise<{ id: string, materialId: string }>
}) {
  const { id: classId, materialId } = use(params)
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [material, setMaterial] = useState<any>(null)
  const [playlist, setPlaylist] = useState<any[]>([])
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [isCompleting, setIsCompleting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  // --- FETCH DATA ---
  useEffect(() => {
    const initData = async () => {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const materialPromise = supabase.from('materials').select('*').eq('id', materialId).single()
      const playlistPromise = supabase.from('materials').select('id, title, module_name, type, file_url, xp_reward').eq('class_id', classId).order('created_at', { ascending: true })
      const logsPromise = supabase.from('points_logs').select('source').eq('user_id', user.id).ilike('source', 'material_%')

      const [matRes, listRes, logsRes] = await Promise.all([materialPromise, playlistPromise, logsPromise])

      if (matRes.data) setMaterial(matRes.data)
      if (listRes.data) setPlaylist(listRes.data)

      if (logsRes.data) {
        const ids = new Set(logsRes.data.map((log: any) => log.source.replace('material_', '')))
        setCompletedIds(ids)
      }

      setLoading(false)
    }

    initData()
  }, [classId, materialId])

  const currentIndex = playlist.findIndex(m => m.id === materialId)
  const prevMaterial = currentIndex > 0 ? playlist[currentIndex - 1] : null
  const nextMaterial = currentIndex < playlist.length - 1 ? playlist[currentIndex + 1] : null

  const handleComplete = async () => {
    if (completedIds.has(materialId)) {
      if (nextMaterial) {
        router.push(`/dashboard/classes/${classId}/materials/${nextMaterial.id}`)
      } else {
        showToast('Info dikuasai! Semua data telah diakses.', 'success')
        setTimeout(() => router.push(`/dashboard/classes/${classId}`), 1800)
      }
      return
    }

    setIsCompleting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: existing } = await supabase.from('points_logs').select('*')
      .eq('user_id', user.id).eq('source', `material_${materialId}`).single()

    if (existing) {
      setCompletedIds(prev => new Set(prev).add(materialId))
      setIsCompleting(false)
      if (nextMaterial) router.push(`/dashboard/classes/${classId}/materials/${nextMaterial.id}`)
      return
    }

    const { error } = await supabase.from('points_logs').insert({
      user_id: user.id,
      source: `material_${materialId}`,
      points: material.xp_reward || 50
    })

    if (error) {
      showToast('Gagal menyimpan data. Coba lagi.', 'error')
    } else {
      const { data: profile } = await supabase.from('profiles').select('points').eq('id', user.id).single()
      await supabase.from('profiles').update({
        points: (profile?.points || 0) + (material.xp_reward || 50)
      }).eq('id', user.id)

      // Update learning streak setelah berhasil menyelesaikan materi
      updateLearningStreak(user.id, supabase).catch(() => { })
      
      // Hitung dan berikan badge otomatis
      awardEligibleBadges(user.id, supabase).catch(() => { })

      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } })
      setCompletedIds(prev => new Set(prev).add(materialId))

      setTimeout(() => {
        if (nextMaterial) {
          router.push(`/dashboard/classes/${classId}/materials/${nextMaterial.id}`)
        } else {
          showToast('Semua materi telah diselesaikan! Lanjut bertugas.', 'success')
          setTimeout(() => router.push(`/dashboard/classes/${classId}`), 1800)
        }
      }, 1500)
    }

    setIsCompleting(false)
  }

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <Loader2 className="animate-spin h-14 w-14 text-slate-900" />
      <p className="text-slate-900 font-black text-2xl uppercase tracking-widest animate-pulse">Menghubungkan ke server rahasia...</p>
    </div>
  )

  if (!material) return <div className="h-screen flex items-center justify-center font-black text-3xl text-slate-900 bg-red-200 border-8 border-slate-900 m-8 rounded-[32px] shadow-[12px_12px_0px_#0f172a] transform -rotate-1">Berkas Intelihen Hilang!</div>

  const isCompleted = completedIds.has(materialId)

  return (
    <div className="flex flex-col xl:flex-row h-screen bg-slate-100 overflow-hidden font-sans">

      {/* 2. MAIN LAYOUT (Konten di Kiri) */}
      <div className="flex-1 flex flex-col min-h-0 order-2 xl:order-1 relative">
        {/* A. NAVBAR PLAYER MOBILE / DESKTOP INLINE */}
        <header className="h-20 bg-emerald-300 flex items-center justify-between px-6 border-b-4 border-slate-900 shrink-0 z-20">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/classes/${classId}`}>
              <Button size="icon" className="bg-white hover:bg-slate-200 text-slate-900 border-4 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-xl">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <p className="text-xs font-black text-slate-700 uppercase tracking-widest leading-none mb-1">{material.module_name || 'Materi Ekstra'}</p>
              <h1 className="font-black text-xl lg:text-2xl text-slate-900 line-clamp-1 uppercase leading-tight" title={material.title}>
                {material.title}
              </h1>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 bg-white px-4 py-2 border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_#0f172a] transform rotate-1">
            <span className="text-xs font-black uppercase text-slate-500">Berkas Terbaca</span>
            <span className="text-lg font-black text-slate-900">{completedIds.size}/{playlist.length}</span>
          </div>
        </header>

        {toast && (
          <div className={`absolute top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-[6px_6px_0px_#0f172a] text-lg font-black uppercase flex items-center gap-3 transition-all border-4 border-slate-900 animate-in slide-in-from-top-4 duration-300 ${toast.type === 'success'
            ? 'bg-emerald-400 text-slate-900'
            : 'bg-red-400 text-slate-900'
            }`}>
            {toast.type === 'success' ? <CheckCircle className="h-6 w-6" /> : <Trophy className="h-6 w-6" />}
            {toast.msg}
          </div>
        )}

        <main className="flex-1 overflow-y-auto scroll-smooth bg-slate-50 p-6 md:p-8">
          <div className="max-w-5xl mx-auto space-y-8 pb-32">

            <Card className="overflow-hidden border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] bg-white rounded-[32px]">
              {material.type === 'video' && material.youtube_url ? (
                <div className="aspect-video w-full bg-slate-900 relative border-b-4 border-slate-900">
                  <iframe
                    width="100%" height="100%"
                    src={`https://www.youtube.com/embed/${getYouTubeId(material.youtube_url)}`}
                    title={material.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              ) : material.type === 'file' && material.file_url ? (
                <div className="h-64 md:h-80 bg-emerald-300 flex flex-col items-center justify-center p-8 text-center border-b-4 border-slate-900 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_25%,rgba(255,255,255,0.2)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.2)_75%,rgba(255,255,255,0.2)_100%)] bg-[length:20px_20px]">
                  <div className="bg-white p-5 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] transform -rotate-3 mb-6">
                    <FileText className="h-14 w-14 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase bg-white/90 px-6 py-2 border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_#0f172a] transform rotate-1 mb-6">{material.title}</h2>
                  <a href={material.file_url} target="_blank" rel="noopener noreferrer">
                    <Button className="h-14 px-8 bg-slate-900 hover:bg-slate-800 text-emerald-300 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#34d399] rounded-xl text-lg hover:-translate-y-1 transition-all">
                      Buka Dokumen Rahasia <ChevronRight className="ml-2 h-6 w-6" />
                    </Button>
                  </a>
                </div>
              ) : (
                <div className="h-48 md:h-64 bg-violet-300 flex flex-col items-center justify-center p-8 text-center border-b-4 border-slate-900 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_25%,rgba(255,255,255,0.2)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.2)_75%,rgba(255,255,255,0.2)_100%)] bg-[length:20px_20px]">
                  <div className="bg-white p-4 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] transform -rotate-3 mb-4">
                    <FileText className="h-12 w-12 text-violet-600" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase bg-white/80 px-4 py-1 border-2 border-slate-900 rounded-lg transform rotate-1">{material.title}</h2>
                </div>
              )}

              <div className="p-6 md:p-10">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-blue-300 text-slate-900 hover:bg-blue-400 font-black border-2 border-slate-900 shadow-sm px-3 py-1 uppercase text-xs md:text-sm">
                      {material.type === 'video' ? 'Rekaman CCTV' : material.type === 'file' ? 'File Berkas' : 'Dokumen Teks'}
                    </Badge>
                    <Badge className="bg-yellow-300 text-slate-900 hover:bg-yellow-400 font-black border-2 border-slate-900 shadow-sm px-3 py-1 uppercase text-xs md:text-sm">
                      +{material.xp_reward} Kekuatan
                    </Badge>
                  </div>

                  {isCompleted && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-300 text-slate-900 rounded-xl border-2 border-slate-900 shadow-sm animate-in fade-in zoom-in duration-300 transform -rotate-2">
                      <CheckCircle className="h-5 w-5 fill-white" />
                      <span className="font-black text-sm uppercase">Berkas Tertutup</span>
                    </div>
                  )}
                </div>

                {material.content ? (
                  <div
                    className="prose prose-slate prose-lg max-w-none text-slate-800 font-medium leading-relaxed
                               prose-headings:font-black prose-headings:text-slate-900 prose-a:text-violet-600 prose-a:font-black
                               prose-blockquote:border-l-4 prose-blockquote:border-slate-900 prose-blockquote:bg-slate-50 prose-blockquote:not-italic prose-blockquote:font-bold prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-xl
                               prose-code:text-pink-600 prose-code:bg-pink-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:border-2 prose-code:border-pink-200
                               prose-pre:bg-slate-900 prose-pre:text-slate-50 prose-pre:border-4 prose-pre:border-slate-900 prose-pre:shadow-[4px_4px_0px_#0f172a] prose-pre:rounded-xl"
                    dangerouslySetInnerHTML={{ __html: material.content }}
                  />
                ) : (
                  <div className="text-slate-500 font-bold text-lg text-center py-8">
                    {material.type === 'video' ? 'Tonton sinyal rekaman dengan hikmat.' : material.type === 'file' ? 'Gunakan tombol di atas untuk membuka dokumen.' : 'Naskah ini kosong.'}
                  </div>
                )}
              </div>
            </Card>

            {/* Navigation Bar Sticky Bottom */}
            <div className="fixed bottom-6 left-6 right-6 xl:left-6 xl:right-[22rem] z-30 bg-white border-4 border-slate-900 p-4 rounded-2xl shadow-[8px_8px_0px_#0f172a] flex flex-col md:flex-row items-center justify-between gap-4 max-w-5xl mx-auto xl:mx-0">
              <Button
                disabled={!prevMaterial}
                onClick={() => prevMaterial && router.push(`/dashboard/classes/${classId}/materials/${prevMaterial.id}`)}
                className="w-full md:w-auto h-14 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black border-4 border-slate-900 rounded-xl uppercase tracking-widest disabled:opacity-50 disabled:shadow-none hover:-translate-y-1 shadow-[4px_4px_0px_#0f172a] transition-all"
              >
                <ChevronLeft className="mr-2 h-5 w-5" /> Mundur
              </Button>

              <Button
                disabled={isCompleting}
                onClick={handleComplete}
                className={cn(
                  "w-full md:w-auto min-w-[300px] h-14 text-lg md:text-xl font-black rounded-xl uppercase tracking-widest border-4 border-slate-900 transition-all hover:-translate-y-1 hover:shadow-[2px_2px_0px_#0f172a]",
                  isCompleted
                    ? "bg-slate-900 hover:bg-slate-800 text-emerald-400 shadow-[4px_4px_0px_#34d399]"
                    : "bg-emerald-400 hover:bg-emerald-300 text-slate-900 shadow-[4px_4px_0px_#0f172a]"
                )}
              >
                {isCompleting ? <Loader2 className="animate-spin mr-3 h-6 w-6" /> :
                  isCompleted ? <CheckCircle className="mr-3 h-6 w-6" /> :
                    <Trophy className="mr-3 h-6 w-6" />}
                {isCompleted ? "Pindah Ke Target Lain" : "Eksekusi & Lanjut"}
              </Button>

              <Button
                disabled={!nextMaterial}
                onClick={() => nextMaterial && router.push(`/dashboard/classes/${classId}/materials/${nextMaterial.id}`)}
                className="w-full md:w-auto h-14 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black border-4 border-slate-900 rounded-xl uppercase tracking-widest disabled:opacity-50 disabled:shadow-none hover:-translate-y-1 shadow-[4px_4px_0px_#0f172a] transition-all"
              >
                Serbu <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

          </div>
        </main>
      </div>

      {/* B. SIDEBAR PLAYLIST (Konten di Kanan) */}
      <aside className="w-full xl:w-80 flex flex-col border-t-4 xl:border-t-0 xl:border-l-4 border-slate-900 bg-white order-1 xl:order-2 shrink-0 z-30">
        <div className="p-6 border-b-4 border-slate-900 bg-amber-200">
          <h3 className="font-black text-slate-900 text-xl uppercase tracking-wider flex items-center gap-2">
            <FileText className="h-6 w-6" /> Lemari Arsip
          </h3>
          <p className="font-bold text-slate-700 bg-white/60 inline-block px-2 py-0.5 rounded border-2 border-slate-900 mt-2 text-xs">Isi map: {playlist.length} Berkas</p>
        </div>

        <ScrollArea className="flex-1 max-h-[30vh] xl:max-h-none border-b-4 xl:border-b-0 border-slate-900">
          <div className="flex flex-col p-4 gap-3 bg-slate-100 min-h-full">
            {playlist.map((item, idx) => {
              const isActive = item.id === materialId
              const isItemCompleted = completedIds.has(item.id)

              return (
                <Link
                  key={item.id}
                  href={`/dashboard/classes/${classId}/materials/${item.id}`}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border-4 transition-all hover:-translate-y-1 group bg-white",
                    isActive
                      ? "border-violet-500 shadow-[4px_4px_0px_#8b5cf6] bg-violet-50 transform scale-[1.02]"
                      : "border-slate-900 shadow-[4px_4px_0px_#0f172a]"
                  )}
                >
                  <div className="shrink-0">
                    {isItemCompleted ? (
                      <div className="h-10 w-10 rounded-lg bg-emerald-400 border-2 border-slate-900 flex items-center justify-center transform -rotate-3">
                        <CheckCircle className="h-6 w-6 text-slate-900" />
                      </div>
                    ) : (
                      isActive ? (
                        <div className="h-10 w-10 rounded-lg bg-violet-400 border-2 border-slate-900 flex items-center justify-center animate-pulse shadow-inner">
                          <PlayCircle className="h-6 w-6 text-slate-900" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-slate-200 border-2 border-slate-900 flex items-center justify-center font-black text-slate-900 group-hover:bg-slate-300">
                          {idx + 1}
                        </div>
                      )
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={cn("text-base font-black leading-tight line-clamp-2 uppercase", isActive ? "text-violet-700" : "text-slate-900")}>
                      {item.title}
                    </h4>
                    <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border-2 rounded bg-slate-100 text-slate-600 border-slate-300">
                      {item.type === 'video' ? 'Kaset' : item.type === 'file' ? 'Arsip' : 'Naskah'}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </ScrollArea>
      </aside>

    </div>
  )
}