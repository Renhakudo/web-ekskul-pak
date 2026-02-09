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

  // --- FETCH DATA ---
  useEffect(() => {
    const initData = async () => {
      setLoading(true)
      console.log("🔄 Fetching data materi & logs...")

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Ambil Materi Aktif
      const materialPromise = supabase.from('materials').select('*').eq('id', materialId).single()
      // 2. Ambil Playlist
      const playlistPromise = supabase.from('materials').select('id, title, type, xp_reward').eq('class_id', classId).order('created_at', { ascending: true })
      // 3. Ambil Log Penyelesaian
      const logsPromise = supabase.from('points_logs').select('source').eq('user_id', user.id).ilike('source', 'material_%')

      const [matRes, listRes, logsRes] = await Promise.all([materialPromise, playlistPromise, logsPromise])

      if (matRes.data) setMaterial(matRes.data)
      if (listRes.data) setPlaylist(listRes.data)
      
      if (logsRes.data) {
        const ids = new Set(logsRes.data.map((log: any) => log.source.replace('material_', '')))
        console.log("✅ Materi yang sudah selesai (IDs):", Array.from(ids))
        setCompletedIds(ids)
      }
      
      setLoading(false)
    }

    initData()
  }, [classId, materialId])

  // --- LOGIC NAVIGASI ---
  const currentIndex = playlist.findIndex(m => m.id === materialId)
  const prevMaterial = currentIndex > 0 ? playlist[currentIndex - 1] : null
  const nextMaterial = currentIndex < playlist.length - 1 ? playlist[currentIndex + 1] : null

  // --- LOGIC SELESAI ---
  const handleComplete = async () => {
    // 1. Cek Cepat di Client Side
    if (completedIds.has(materialId)) {
      // Jika sudah selesai, tombol ini berfungsi sebagai "Lanjut" (jika ada next)
      if (nextMaterial) {
         router.push(`/dashboard/classes/${classId}/materials/${nextMaterial.id}`)
      } else {
         alert("Selamat! Kamu sudah menyelesaikan semua materi di kelas ini! 🎉")
         router.push(`/dashboard/classes/${classId}`)
      }
      return
    }

    setIsCompleting(true)
    console.log("🚀 Menandai selesai:", materialId)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 2. Cek Double di Database (Biar aman)
    const { data: existing } = await supabase.from('points_logs').select('*')
      .eq('user_id', user.id).eq('source', `material_${materialId}`).single()

    if (existing) {
        console.log("⚠️ Ternyata sudah ada di database.")
        setCompletedIds(prev => new Set(prev).add(materialId))
        setIsCompleting(false)
        // Auto next jika ternyata sudah selesai
        if (nextMaterial) router.push(`/dashboard/classes/${classId}/materials/${nextMaterial.id}`)
        return
    }

    // 3. Insert Log Baru
    const { error } = await supabase.from('points_logs').insert({
      user_id: user.id,
      source: `material_${materialId}`,
      points: material.xp_reward || 50
    })

    if (error) {
      console.error("❌ Gagal simpan log:", error.message)
      alert("Gagal menyimpan progress. Coba lagi.")
    } else {
      console.log("🎉 Sukses simpan log!")
      
      // Update Poin Profil
      const { data: profile } = await supabase.from('profiles').select('points').eq('id', user.id).single()
      await supabase.from('profiles').update({
        points: (profile?.points || 0) + (material.xp_reward || 50)
      }).eq('id', user.id)

      // Efek Visual Confetti
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } })
      
      // Update State Lokal
      setCompletedIds(prev => new Set(prev).add(materialId))

      // --- AUTO NEXT DELAY ---
      setTimeout(() => {
        if (nextMaterial) {
            router.push(`/dashboard/classes/${classId}/materials/${nextMaterial.id}`)
        } else {
            alert("Selamat! Kamu telah menyelesaikan semua materi di kelas ini! 🎓")
            // Optional: Redirect ke halaman kelas utama
            router.push(`/dashboard/classes/${classId}`)
        }
      }, 1500) // Tunggu 1.5 detik
    }

    setIsCompleting(false)
  }

  // --- RENDER ---
  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
      <Loader2 className="animate-spin h-10 w-10 text-violet-600"/>
      <p className="text-slate-500 font-medium">Memuat materi...</p>
    </div>
  )
  
  if (!material) return <div className="p-8 text-center">Materi tidak ditemukan.</div>

  const isCompleted = completedIds.has(materialId)

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* 1. NAVBAR PLAYER */}
      <header className="h-14 bg-slate-900 text-white flex items-center justify-between px-4 lg:px-6 flex-shrink-0 z-20 shadow-lg border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/classes/${classId}`}>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/10 -ml-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="h-6 w-[1px] bg-slate-700 hidden sm:block"></div>
          <div className="flex flex-col justify-center">
            <h1 className="font-semibold text-sm lg:text-base line-clamp-1 max-w-[200px] lg:max-w-md" title={material.title}>
              {material.title}
            </h1>
          </div>
        </div>
        
        {/* Progress Indikator */}
        <div className="flex items-center gap-4">
           <div className="hidden md:flex flex-col items-end">
             <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Progress Kelas</div>
             <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
               <span>{completedIds.size}/{playlist.length} Selesai</span>
             </div>
           </div>
        </div>
      </header>

      {/* 2. MAIN LAYOUT */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* A. KONTEN UTAMA */}
        <main className="flex-1 overflow-y-auto scroll-smooth bg-slate-100">
          <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
            
            {/* Player Area */}
            <Card className="overflow-hidden shadow-sm border border-slate-200 bg-white rounded-xl">
               {material.type === 'video' && material.youtube_url ? (
                  <div className="aspect-video w-full bg-black relative group">
                    <iframe
                      width="100%" height="100%"
                      src={`https://www.youtube.com/embed/${getYouTubeId(material.youtube_url)}`}
                      title={material.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
               ) : (
                  <div className="h-40 md:h-56 bg-gradient-to-r from-violet-600 to-indigo-600 flex flex-col items-center justify-center text-white p-6 text-center">
                     <FileText className="h-12 w-12 mb-3 opacity-80" />
                     <h2 className="text-xl md:text-3xl font-bold">{material.title}</h2>
                     <p className="text-violet-200 text-sm mt-2">Bahan Bacaan</p>
                  </div>
               )}

               <div className="p-6 md:p-10">
                 <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-2 hidden md:block">{material.title}</h2>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-slate-900 hover:bg-slate-800 text-white border-0">
                          {material.type === 'video' ? 'Video Pembelajaran' : 'Artikel / Teks'}
                        </Badge>
                        <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                          <Trophy className="h-3 w-3 mr-1" /> +{material.xp_reward} XP Reward
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    {isCompleted && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 animate-in fade-in zoom-in duration-300">
                        <CheckCircle className="h-5 w-5 fill-emerald-600 text-white" />
                        <span className="font-bold text-sm">Selesai Dikerjakan</span>
                      </div>
                    )}
                 </div>
                 
                 <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-base md:text-lg">
                   <p className="whitespace-pre-wrap">{material.content || "Pelajari materi di atas dengan seksama sebelum melanjutkan."}</p>
                 </div>
               </div>
            </Card>

            {/* Navigation Bar */}
            <div className="sticky bottom-4 z-10 bg-white/80 backdrop-blur-md p-4 rounded-xl border border-white/20 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
               
               <Button 
                 variant="ghost" 
                 disabled={!prevMaterial}
                 onClick={() => prevMaterial && router.push(`/dashboard/classes/${classId}/materials/${prevMaterial.id}`)}
                 className="w-full md:w-auto text-slate-600"
               >
                 <ChevronLeft className="mr-2 h-4 w-4" /> Sebelumnya
               </Button>

               {/* MAIN ACTION BUTTON */}
               <Button 
                 size="lg"
                 disabled={isCompleting} // Disabled cuma kalau lagi loading
                 onClick={handleComplete}
                 className={cn(
                   "w-full md:w-auto min-w-[240px] h-12 text-base font-semibold shadow-lg transition-all transform active:scale-95",
                   isCompleted 
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 shadow-emerald-500/30" // Kalau selesai jadi hijau & tetap clickable
                    : "bg-violet-600 hover:bg-violet-700 text-white shadow-violet-500/30 hover:shadow-violet-500/50"
                 )}
               >
                 {isCompleting ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : 
                  isCompleted ? <CheckCircle className="mr-2 h-5 w-5" /> : 
                  <Trophy className="mr-2 h-5 w-5" />}
                 {isCompleted ? "Lanjut Materi Berikutnya" : "Tandai Selesai & Lanjut"}
               </Button>

               <Button 
                 variant="ghost"
                 disabled={!nextMaterial}
                 onClick={() => nextMaterial && router.push(`/dashboard/classes/${classId}/materials/${nextMaterial.id}`)}
                 className="w-full md:w-auto text-slate-600"
               >
                 Selanjutnya <ChevronRight className="ml-2 h-4 w-4" />
               </Button>
            </div>
            
            <div className="h-8"></div>
          </div>
        </main>

        {/* B. SIDEBAR PLAYLIST */}
        <aside className="hidden xl:flex w-80 flex-col border-l border-slate-200 bg-white flex-shrink-0 z-10">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Daftar Materi</h3>
            <p className="text-xs text-slate-500 mt-1">Total {playlist.length} modul pembelajaran</p>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="flex flex-col py-2">
              {playlist.map((item, idx) => {
                const isActive = item.id === materialId
                const isItemCompleted = completedIds.has(item.id)

                return (
                  <Link 
                    key={item.id} 
                    href={`/dashboard/classes/${classId}/materials/${item.id}`}
                    className={cn(
                      "flex items-start gap-3 px-5 py-4 border-l-4 transition-all hover:bg-slate-50",
                      isActive 
                        ? "border-l-violet-600 bg-violet-50/50" 
                        : "border-l-transparent"
                    )}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                       {isItemCompleted ? (
                         <CheckCircle className="h-5 w-5 text-emerald-500 fill-emerald-50" />
                       ) : (
                         isActive ? (
                           <div className="relative flex items-center justify-center h-5 w-5">
                             <span className="absolute h-full w-full rounded-full bg-violet-200 animate-ping opacity-75"></span>
                             <Circle className="h-5 w-5 text-violet-600 fill-violet-600" />
                           </div>
                         ) : (
                           <div className="h-5 w-5 rounded-full border border-slate-300 flex items-center justify-center text-[10px] text-slate-500 font-medium bg-white">
                             {idx + 1}
                           </div>
                         )
                       )}
                    </div>
                    <div className="flex-1 min-w-0">
                       <h4 className={cn("text-sm font-medium leading-snug line-clamp-2", isActive ? "text-violet-900" : "text-slate-600")}>
                         {item.title}
                       </h4>
                       <div className="flex items-center gap-2 mt-1.5">
                         <span className="text-[10px] uppercase text-slate-400 font-bold flex items-center gap-1">
                           {item.type === 'video' ? <PlayCircle className="h-3 w-3"/> : <FileText className="h-3 w-3"/>}
                           {item.type}
                         </span>
                       </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </ScrollArea>
        </aside>

      </div>
    </div>
  )
}