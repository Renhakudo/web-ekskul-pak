'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  ArrowRight, 
  PlayCircle, 
  FileText, 
  Trophy,
  Briefcase,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { Skeleton } from "@/components/ui/skeleton"

// Tipe Data
interface Material {
  id: string
  title: string
  type: 'video' | 'text' | 'quiz' | 'file'
  xp_reward: number
  created_at: string
}

interface Assignment {
  id: string
  title: string
  description: string
  due_date: string
}

interface ClassDetail {
  id: string
  title: string
  description: string
  created_by: string
  materials: Material[]
  assignments: Assignment[] // Tambah ini
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
      
      // 1. Ambil Detail Kelas
      const { data: classResult } = await supabase.from('classes').select('*').eq('id', id).single()

      // 2. Ambil Materi
      const { data: materialsResult } = await supabase
        .from('materials')
        .select('id, title, type, xp_reward, created_at')
        .eq('class_id', id)
        .order('created_at', { ascending: true })

      // 3. Ambil Tugas (BARU)
      const { data: assignmentsResult } = await supabase
        .from('assignments')
        .select('*')
        .eq('class_id', id)
        .order('created_at', { ascending: false })

      if (classResult) {
        setClassData({
          ...classResult,
          materials: materialsResult || [],
          assignments: assignmentsResult || []
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
      
      {/* HERO SECTION */}
      <div className="bg-slate-900 text-white py-12 px-6 md:px-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          <Link href="/dashboard/courses" className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar Kelas
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
              <Briefcase className="h-4 w-4 text-pink-400" />
              <span className="text-sm font-medium">{classData.assignments.length} Tugas</span>
            </div>
          </div>
        </div>
      </div>

      {/* TABS CONTROLLER (Materi vs Tugas) */}
      <div className="max-w-5xl mx-auto px-6 md:px-12 -mt-8 relative z-20">
        <Tabs defaultValue="materials" className="w-full">
          
          <TabsList className="grid w-full md:w-[400px] grid-cols-2 mb-4 bg-white/90 backdrop-blur shadow-sm p-1 border border-slate-200">
            <TabsTrigger value="materials">Materi Belajar</TabsTrigger>
            <TabsTrigger value="assignments">Tugas & PR</TabsTrigger>
          </TabsList>

          {/* === TAB 1: MATERI === */}
          <TabsContent value="materials">
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
                    <p>Belum ada materi yang diupload guru.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {classData.materials.map((material, index) => (
                      <div 
                        key={material.id} 
                        className="group flex items-center gap-4 p-5 hover:bg-slate-50 transition-all duration-200 cursor-pointer"
                        onClick={() => router.push(`/dashboard/classes/${id}/materials/${material.id}`)}
                      >
                        <div className="flex-shrink-0">
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${
                            material.type === 'video' ? 'bg-red-100 text-red-600 group-hover:bg-red-200' :
                            'bg-blue-100 text-blue-600 group-hover:bg-blue-200'
                          }`}>
                            {material.type === 'video' ? <PlayCircle className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                              Modul {index + 1}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900 group-hover:text-violet-700 transition-colors truncate">
                            {material.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary" className="bg-violet-100 text-violet-700">+{material.xp_reward} XP</Badge>
                          <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-violet-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* === TAB 2: TUGAS (BARU!) === */}
          <TabsContent value="assignments">
            <Card className="shadow-xl border-slate-200/60">
              <CardHeader className="border-b bg-white rounded-t-xl">
                <CardTitle className="flex items-center gap-2 text-xl">
                  📝 Daftar Tugas
                </CardTitle>
                <CardDescription>
                  Kerjakan dan kumpulkan tugas sebelum tenggat waktu berakhir.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 bg-white rounded-b-xl">
                {classData.assignments.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">
                    <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Briefcase className="h-8 w-8 text-slate-400" />
                    </div>
                    <p>Hore! Tidak ada tugas saat ini.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {classData.assignments.map((assignment) => (
                      <div 
                        key={assignment.id} 
                        className="group flex items-center gap-4 p-5 hover:bg-slate-50 transition-all duration-200 cursor-pointer"
                        onClick={() => router.push(`/dashboard/classes/${id}/assignments/${assignment.id}`)}
                      >
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-xl bg-pink-100 text-pink-600 group-hover:bg-pink-200 flex items-center justify-center">
                            <Briefcase className="h-6 w-6" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                           <h3 className="text-lg font-semibold text-slate-900 group-hover:text-pink-700 transition-colors truncate">
                            {assignment.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> 
                              {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'Tanpa Deadline'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                           {/* Indikator Status (Bisa dikembangkan nanti cek submissions) */}
                           <Button size="sm" variant="outline" className="border-pink-200 text-pink-700 hover:bg-pink-50">
                             Buka Tugas
                           </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  )
}