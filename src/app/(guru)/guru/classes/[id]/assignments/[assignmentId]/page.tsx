'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  CheckCircle,
  Save,
  Loader2,
  Briefcase
} from 'lucide-react'
import { toast } from 'sonner'
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
      const initialGrades: Record<string, number> = {}
      subsData.forEach((sub: any) => {
        if (sub.score !== null) initialGrades[sub.id] = sub.score
      })
      setGrades(initialGrades)
    }

    setLoading(false)
  }

  const handleGradeChange = (submissionId: string, value: string) => {
    const numValue = parseInt(value)
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setGrades(prev => ({ ...prev, [submissionId]: numValue }))
    } else if (value === '') {
      // @ts-ignore
      setGrades(prev => ({ ...prev, [submissionId]: '' }))
    }
  }

  const saveGrade = async (submissionId: string) => {
    const score = grades[submissionId]
    if (score === undefined || score === null) return

    setSavingId(submissionId)

    const { error } = await supabase
      .from('submissions')
      .update({ score: score })
      .eq('id', submissionId)

    if (error) {
      toast.error("Gagal memberikan nilai: " + error.message)
    } else {
      toast.success("Nilai berhasil disimpan!")
    }
    setSavingId(null)
  }

  if (loading) return <div className="p-12 flex justify-center mt-20"><Loader2 className="animate-spin text-slate-900 h-12 w-12" /></div>
  if (!assignment) return <div className="p-12 text-center text-slate-900 font-black text-2xl border-4 border-slate-900 rounded-[32px] mx-auto max-w-xl mt-20 shadow-[8px_8px_0px_#0f172a] bg-red-100">Arsip Tugas Lenyap!</div>

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto font-sans min-h-screen">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-pink-300 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] p-6 md:p-8 relative overflow-hidden">
        <div className="flex items-center gap-5 relative z-10 w-full md:w-auto">
          <Link href={`/guru/classes/${classId}`} className="shrink-0">
            <Button size="icon" className="h-12 w-12 bg-white text-slate-900 border-4 border-slate-900 shadow-[2px_2px_0px_#0f172a] hover:bg-slate-200 rounded-2xl transform -rotate-3 transition-transform hover:rotate-0">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3 truncate">
              {assignment.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <Badge className="bg-slate-100 text-slate-700 font-bold border-2 border-slate-900 px-3 py-1 uppercase shadow-sm">
                <Calendar className="h-4 w-4 mr-2" /> Deadline: {assignment.due_date ? new Date(assignment.due_date).toLocaleString() : 'Kapan Saja'}
              </Badge>
            </div>
          </div>
        </div>

        <Card className="bg-white border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-2xl shrink-0 transform rotate-1">
          <CardContent className="p-3 sm:p-4 flex items-center justify-center gap-4 sm:gap-6">
            <div className="text-center">
              <div className="text-3xl font-black text-violet-600 drop-shadow-sm">{submissions.length}</div>
              <div className="text-xs text-slate-600 uppercase font-black tracking-widest leading-tight">Masuk</div>
            </div>
            <div className="w-1 h-10 bg-slate-900 rounded-full"></div>
            <div className="text-center">
              <div className="text-3xl font-black text-emerald-500 drop-shadow-sm">
                {submissions.filter(s => s.score !== null).length}
              </div>
              <div className="text-xs text-slate-600 uppercase font-black tracking-widest leading-tight">Dinilai</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabel Penilaian */}
      <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] overflow-hidden bg-white">
        <CardHeader className="bg-blue-200 border-b-4 border-slate-900 p-6 flex flex-row items-center gap-4">
          <Briefcase className="h-8 w-8 text-slate-900" />
          <div>
            <CardTitle className="text-2xl font-black text-slate-900 uppercase">Lembar Jawaban Pasukan</CardTitle>
            <CardDescription className="text-slate-800 font-bold">Koreksi ketat, jangan sampai ada yang menyontek.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow className="bg-slate-100 border-b-4 border-slate-900">
                <TableHead className="font-black text-slate-900 text-base py-4 px-6 uppercase tracking-wider">Identitas Target</TableHead>
                <TableHead className="font-black text-slate-900 text-base py-4 px-6 uppercase tracking-wider">Tanda Tangan Waktu</TableHead>
                <TableHead className="font-black text-slate-900 text-base py-4 px-6 uppercase tracking-wider">Barang Bukti (Jawaban)</TableHead>
                <TableHead className="font-black text-slate-900 text-base py-4 px-6 uppercase tracking-wider w-[180px]">Vonis Nilai</TableHead>
                <TableHead className="w-[80px] p-4"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y-2 divide-slate-100">
              {submissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16">
                    <div className="inline-block p-6 rounded-2xl border-4 border-dashed border-slate-300">
                      <p className="font-black text-slate-400 text-xl">Sangat Sepi.</p>
                      <p className="text-slate-500 font-bold">Belum ada satupun agen yang melapor.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                submissions.map((sub) => {
                  const isLate = assignment.due_date && new Date(sub.submitted_at) > new Date(assignment.due_date)
                  const isGraded = sub.score !== null

                  return (
                    <TableRow key={sub.id} className={`hover:bg-slate-50 transition-colors ${isGraded ? 'bg-emerald-50/30' : ''}`}>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] transform rotate-2">
                            <AvatarImage src={sub.profiles?.avatar_url} />
                            <AvatarFallback className="bg-yellow-200 text-slate-900 font-black">{sub.profiles?.full_name?.[0] || 'X'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-black text-slate-900 text-lg leading-tight">{sub.profiles?.full_name || 'N/A'}</div>
                            <div className="text-sm font-bold text-slate-500">@{sub.profiles?.username}</div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <Badge className="bg-slate-100 text-slate-700 border-2 border-slate-300 font-bold px-2 py-0.5 rounded-md shadow-sm">
                            {new Date(sub.submitted_at).toLocaleDateString()}
                          </Badge>
                          <span className="text-xs text-slate-500 font-bold px-1 mt-0.5">
                            {new Date(sub.submitted_at).toLocaleTimeString()}
                          </span>
                          {isLate && (
                            <Badge className="bg-red-400 text-slate-900 border-2 border-slate-900 font-black px-2 mt-1 shadow-sm uppercase text-[10px]">
                              Terlambat
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="px-6 py-4 max-w-sm">
                        <div className="space-y-3">
                          {/* Jawaban Teks */}
                          {sub.answer && (
                            <div className="bg-white p-3 rounded-xl border-2 border-slate-300 shadow-inner text-sm font-medium text-slate-800 max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                              {sub.answer}
                            </div>
                          )}

                          {/* Jawaban File */}
                          {sub.file_url && (
                            <a
                              href={sub.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 bg-cyan-200 hover:bg-cyan-300 px-4 py-2 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] transition-all hover:-translate-y-0.5"
                            >
                              <ExternalLink className="h-4 w-4" /> Intip Dokumen
                            </a>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl border-2 border-slate-200 w-fit focus-within:border-slate-400 focus-within:bg-white transition-all">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            className="w-16 h-10 font-black text-center text-lg bg-transparent border-0 shadow-none focus-visible:ring-0 p-0"
                            value={grades[sub.id] ?? ''}
                            onChange={(e) => handleGradeChange(sub.id, e.target.value)}
                            placeholder="?"
                          />
                          <span className="text-slate-400 font-black text-sm pr-2">/100</span>
                        </div>
                      </TableCell>

                      <TableCell className="px-6 py-4 text-right">
                        <Button
                          size="icon"
                          onClick={() => saveGrade(sub.id)}
                          disabled={savingId === sub.id || sub.score === grades[sub.id]}
                          className={`h-12 w-12 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] hover:-translate-y-1 transition-all
                               ${sub.score === grades[sub.id] && isGraded ? "bg-emerald-400 text-slate-900 hover:bg-emerald-400 opacity-50 shadow-none -translate-y-0 cursor-default" : "bg-violet-500 text-slate-900 hover:bg-violet-400"}
                           `}
                        >
                          {savingId === sub.id ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : sub.score === grades[sub.id] && isGraded ? (
                            <CheckCircle className="h-6 w-6" />
                          ) : (
                            <Save className="h-5 w-5" />
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