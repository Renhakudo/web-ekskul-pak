'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  FileText, 
  ExternalLink, 
  CheckCircle, 
  Save,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"

export default function AdminAssignmentGradingPage({ 
  params 
}: { 
  params: Promise<{ id: string, assignmentId: string }> 
}) {
  const { id: classId, assignmentId } = use(params)
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [assignment, setAssignment] = useState<any>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  
  // State untuk nilai yang sedang diedit { submissionId: score }
  const [grades, setGrades] = useState<Record<string, number>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [assignmentId])

  const fetchData = async () => {
    setLoading(true)
    
    // 1. Ambil Detail Tugas
    const { data: assignData } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .single()
    setAssignment(assignData)

    // 2. Ambil Submissions + Data Siswa (Join Profiles)
    // Note: Pastikan relasi foreign key di database sudah benar
    const { data: subsData, error } = await supabase
      .from('submissions')
      .select(`
        *,
        profiles:user_id ( full_name, avatar_url, username )
      `)
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false })

    if (subsData) {
      setSubmissions(subsData)
      // Initialize grades state
      const initialGrades: Record<string, number> = {}
      subsData.forEach((sub: any) => {
        if (sub.score !== null) initialGrades[sub.id] = sub.score
      })
      setGrades(initialGrades)
    }
    
    setLoading(false)
  }

  // Handle Input Nilai
  const handleGradeChange = (submissionId: string, value: string) => {
    const numValue = parseInt(value)
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setGrades(prev => ({ ...prev, [submissionId]: numValue }))
    } else if (value === '') {
       // Allow clearing input temporarily
       // @ts-ignore
       setGrades(prev => ({ ...prev, [submissionId]: '' }))
    }
  }

  // Simpan Nilai ke Database
  const saveGrade = async (submissionId: string) => {
    const score = grades[submissionId]
    if (score === undefined || score === null) return

    setSavingId(submissionId)
    
    const { error } = await supabase
      .from('submissions')
      .update({ score: score })
      .eq('id', submissionId)

    if (error) {
      alert("Gagal menyimpan nilai: " + error.message)
    } else {
      // Opsional: Kasih notif sukses kecil atau update UI
    }
    setSavingId(null)
  }

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin"/></div>
  if (!assignment) return <div className="p-12 text-center">Tugas tidak ditemukan.</div>

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto bg-slate-50 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link href={`/admin/classes/${classId}`} className="inline-flex items-center text-slate-500 hover:text-slate-900 transition-colors w-fit">
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Manajemen Kelas
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{assignment.title}</h1>
            <div className="flex items-center gap-3 mt-2 text-slate-500">
              <Calendar className="h-4 w-4" />
              <span>Deadline: {assignment.due_date ? new Date(assignment.due_date).toLocaleString() : 'Tanpa Batas'}</span>
            </div>
          </div>
          <Card className="bg-white border-slate-200">
            <CardContent className="p-4 flex items-center gap-6">
              <div className="text-center">
                 <div className="text-2xl font-bold text-violet-600">{submissions.length}</div>
                 <div className="text-xs text-slate-500 uppercase font-bold">Dikumpulkan</div>
              </div>
              <div className="w-[1px] h-8 bg-slate-200"></div>
              <div className="text-center">
                 <div className="text-2xl font-bold text-emerald-600">
                   {submissions.filter(s => s.score !== null).length}
                 </div>
                 <div className="text-xs text-slate-500 uppercase font-bold">Dinilai</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabel Penilaian */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-white border-b">
          <CardTitle>Hasil Pengerjaan Siswa</CardTitle>
          <CardDescription>Periksa jawaban dan berikan nilai (0-100).</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead>Nama Siswa</TableHead>
                <TableHead>Waktu Pengumpulan</TableHead>
                <TableHead>Jawaban</TableHead>
                <TableHead className="w-[200px]">Nilai (Score)</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                    Belum ada siswa yang mengumpulkan tugas ini.
                  </TableCell>
                </TableRow>
              ) : (
                submissions.map((sub) => {
                  const isLate = assignment.due_date && new Date(sub.submitted_at) > new Date(assignment.due_date)
                  
                  return (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={sub.profiles?.avatar_url} />
                            <AvatarFallback>{sub.profiles?.full_name?.[0] || 'S'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-slate-900">{sub.profiles?.full_name || 'Tanpa Nama'}</div>
                            <div className="text-xs text-slate-500">@{sub.profiles?.username}</div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-700">
                            {new Date(sub.submitted_at).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(sub.submitted_at).toLocaleTimeString()}
                          </span>
                          {isLate && (
                            <Badge variant="destructive" className="w-fit mt-1 text-[10px] px-1 py-0 h-5">
                              Terlambat
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-2 max-w-md">
                          {/* Jawaban Teks */}
                          {sub.answer && (
                            <div className="bg-slate-50 p-3 rounded-md border text-sm text-slate-700 max-h-32 overflow-y-auto whitespace-pre-wrap">
                              {sub.answer}
                            </div>
                          )}
                          
                          {/* Jawaban File */}
                          {sub.file_url && (
                            <a 
                              href={sub.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline bg-blue-50 px-3 py-2 rounded-md border border-blue-100 transition-colors hover:bg-blue-100"
                            >
                              <ExternalLink className="h-4 w-4" /> Buka Lampiran File
                            </a>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input 
                            type="number" 
                            min="0" 
                            max="100"
                            className="w-20 font-bold text-center"
                            value={grades[sub.id] ?? ''}
                            onChange={(e) => handleGradeChange(sub.id, e.target.value)}
                            placeholder="0"
                          />
                          <span className="text-slate-400 text-sm">/100</span>
                        </div>
                      </TableCell>

                      <TableCell>
                         <Button 
                           size="sm" 
                           variant={sub.score === grades[sub.id] ? "ghost" : "default"}
                           disabled={savingId === sub.id || sub.score === grades[sub.id]} 
                           onClick={() => saveGrade(sub.id)}
                           className={sub.score === grades[sub.id] ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "bg-violet-600"}
                         >
                           {savingId === sub.id ? (
                             <Loader2 className="h-4 w-4 animate-spin" />
                           ) : sub.score === grades[sub.id] && sub.score !== null ? (
                             <CheckCircle className="h-4 w-4" />
                           ) : (
                             <Save className="h-4 w-4" />
                           )}
                         </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  )
}