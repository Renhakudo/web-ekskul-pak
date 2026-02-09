'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  ArrowRight, 
  PlayCircle, 
  FileText, 
  CheckCircle, 
  Lock, 
  Clock, 
  Trophy,
  MoreVertical
} from 'lucide-react'
import { Skeleton } from "@/components/ui/skeleton"

interface Material {
  id: string
  title: string
  type: 'video' | 'text' | 'quiz' | 'file'
  xp_reward: number
  created_at: string
}

interface ClassDetail {
  id: string
  title: string
  description: string
  created_by: string
  materials: Material[]
}

export default function StudentClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  
  const supabase = createClient()
  const router = useRouter()
  
  const [classData, setClassData] = useState<ClassDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      
      const { data: classResult, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('id', id)
        .single()

      if (classError) {
        console.error("Error fetch class:", classError)
        setLoading(false)
        return
      }

      const { data: materialsResult } = await supabase
        .from('materials')
        .select('id, title, type, xp_reward, created_at')
        .eq('class_id', id)
        .order('created_at', { ascending: true })

      if (classResult) {
        setClassData({
          ...classResult,
          materials: materialsResult || []
        })
      }
      setLoading(false)
    }

    fetchData()
  }, [id])

  if (loading) {
    return <div className="p-8 max-w-5xl mx-auto space-y-4">
      <Skeleton className="h-12 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <div className="space-y-2 mt-8">
         <Skeleton className="h-20 w-full" />
         <Skeleton className="h-20 w-full" />
      </div>
    </div>
  }

  if (!classData) {
    return <div className="p-12 text-center">Kelas tidak ditemukan.</div>
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      
      {/* HEADER HERO SECTION */}
      <div className="bg-slate-900 text-white py-12 px-6 md:px-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          <Link href="/dashboard" className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Dashboard
          </Link>
          
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            {classData.title}
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl leading-relaxed">
            {classData.description || "Tidak ada deskripsi untuk kelas ini."}
          </p>

          <div className="flex flex-wrap gap-4 mt-8">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/5">
              <FileText className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium">{classData.materials.length} Materi</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/5">
              <Trophy className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-medium">
                Total Reward: {classData.materials.reduce((acc, curr) => acc + (curr.xp_reward || 0), 0)} XP
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* LIST MATERI */}
      <div className="max-w-5xl mx-auto px-6 md:px-12 -mt-8 relative z-20">
        <Card className="shadow-xl border-slate-200/60">
          <CardHeader className="border-b bg-white rounded-t-xl">
            <CardTitle className="flex items-center gap-2 text-xl">
              📚 Kurikulum Pembelajaran
            </CardTitle>
            <CardDescription>
              Selesaikan materi secara berurutan untuk mendapatkan XP maksimal.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 bg-white rounded-b-xl">
            {classData.materials.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-slate-400" />
                </div>
                <p>Belum ada materi yang diupload guru.</p>
                <p className="text-sm mt-1">Cek lagi nanti ya!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {classData.materials.map((material, index) => (
                  <div 
                    key={material.id} 
                    className="group flex items-center gap-4 p-5 hover:bg-slate-50 transition-all duration-200 cursor-pointer"
                    // --- INI BAGIAN PENTING YANG SUDAH DIAKTIFKAN ---
                    onClick={() => router.push(`/dashboard/classes/${id}/materials/${material.id}`)}
                  >
                    <div className="flex-shrink-0">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${
                        material.type === 'video' ? 'bg-red-100 text-red-600 group-hover:bg-red-200' :
                        material.type === 'quiz' ? 'bg-yellow-100 text-yellow-600 group-hover:bg-yellow-200' :
                        'bg-blue-100 text-blue-600 group-hover:bg-blue-200'
                      }`}>
                        {material.type === 'video' ? <PlayCircle className="h-6 w-6" /> :
                         material.type === 'quiz' ? <Trophy className="h-6 w-6" /> :
                         <FileText className="h-6 w-6" />}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Modul {index + 1} • {material.type}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 group-hover:text-violet-700 transition-colors truncate">
                        {material.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge variant="secondary" className="bg-violet-100 text-violet-700 hover:bg-violet-200">
                        +{material.xp_reward} XP
                      </Badge>
                      
                      <Button size="sm" variant="ghost" className="text-slate-400 group-hover:text-violet-600">
                         Mulai <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}