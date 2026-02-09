'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, CheckCircle, Clock, Send, Link as LinkIcon, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function StudentAssignmentPage({ 
  params 
}: { 
  params: Promise<{ id: string, assignmentId: string }> 
}) {
  const { id: classId, assignmentId } = use(params)
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [assignment, setAssignment] = useState<any>(null)
  const [submission, setSubmission] = useState<any>(null)
  
  // Form State
  const [answer, setAnswer] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Ambil Detail Tugas
      const { data: assignData } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', assignmentId)
        .single()
      setAssignment(assignData)

      // 2. Cek apakah sudah mengumpulkan?
      const { data: subData } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('user_id', user.id)
        .single()
      
      if (subData) {
        setSubmission(subData)
        setAnswer(subData.answer || '')
        setLinkUrl(subData.file_url || '')
      }

      setLoading(false)
    }
    fetchData()
  }, [assignmentId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      assignment_id: assignmentId,
      user_id: user.id,
      answer: answer,
      file_url: linkUrl, // Kita anggap ini link file (Gdrive/Github)
    }

    let error
    
    if (submission) {
      // UPDATE jika sudah pernah submit
      const res = await supabase.from('submissions').update(payload).eq('id', submission.id)
      error = res.error
    } else {
      // INSERT jika belum
      const res = await supabase.from('submissions').insert(payload)
      error = res.error
    }

    if (error) {
      alert("Gagal mengirim tugas: " + error.message)
    } else {
      alert("Tugas berhasil dikirim! Guru akan segera menilainya.")
      router.refresh() // Refresh biar status berubah
      // Fetch ulang biar state update
      const { data } = await supabase.from('submissions').select('*').eq('assignment_id', assignmentId).eq('user_id', user.id).single()
      setSubmission(data)
    }
    setIsSubmitting(false)
  }

  if (loading) return <div className="p-12 text-center">Memuat tugas...</div>
  if (!assignment) return <div className="p-12 text-center">Tugas tidak ditemukan.</div>

  const isLate = assignment.due_date && new Date() > new Date(assignment.due_date)
  const isGraded = submission?.score !== null && submission?.score !== undefined

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Navigasi */}
        <Link href={`/dashboard/classes/${classId}`} className="inline-flex items-center text-slate-500 hover:text-violet-600 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Kelas
        </Link>

        {/* Kartu Soal Tugas */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-white border-b pb-6">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{assignment.title}</h1>
                <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> 
                    Deadline: {assignment.due_date ? new Date(assignment.due_date).toLocaleString() : 'Tidak ada batas waktu'}
                  </div>
                  {isLate && !submission && (
                     <Badge variant="destructive">Terlambat</Badge>
                  )}
                </div>
              </div>
              {submission ? (
                 <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200 px-3 py-1">
                   <CheckCircle className="mr-1 h-3 w-3" /> Sudah Dikumpulkan
                 </Badge>
              ) : (
                 <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">
                   <Clock className="mr-1 h-3 w-3" /> Belum Dikumpulkan
                 </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
             <h3 className="font-semibold mb-2 text-slate-700">Instruksi:</h3>
             <div className="prose prose-slate max-w-none bg-slate-50 p-4 rounded-lg border border-slate-100">
               <p className="whitespace-pre-wrap">{assignment.description}</p>
             </div>
          </CardContent>
        </Card>

        {/* Form Pengumpulan */}
        <Card className="border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle>Lembar Jawab Siswa</CardTitle>
            <CardDescription>Kirim jawabanmu di sini. Bisa berupa teks atau link file.</CardDescription>
          </CardHeader>
          <CardContent>
            {isGraded ? (
              <Alert className="bg-violet-50 border-violet-200">
                <CheckCircle className="h-4 w-4 text-violet-600" />
                <AlertTitle className="text-violet-800 font-bold">Tugas Sudah Dinilai!</AlertTitle>
                <AlertDescription className="text-violet-700 mt-2">
                  <p>Guru telah memberikan nilai untuk tugas ini.</p>
                  <div className="text-4xl font-extrabold mt-2">{submission.score} <span className="text-lg font-normal text-violet-500">/ 100</span></div>
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label>Jawaban Teks</Label>
                  <Textarea 
                    placeholder="Tulis jawabanmu di sini..." 
                    className="min-h-[150px]"
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Link File Tambahan (Opsional)</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="https://drive.google.com/..." 
                      className="pl-9"
                      value={linkUrl}
                      onChange={e => setLinkUrl(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Jika tugas berupa file (Word/PDF/Video), upload ke Google Drive lalu tempel link-nya di sini.
                  </p>
                </div>

                <div className="flex items-center justify-end pt-4">
                  {submission && (
                    <span className="text-sm text-slate-500 mr-4 italic">
                      Terakhir dikirim: {new Date(submission.submitted_at).toLocaleString()}
                    </span>
                  )}
                  <Button type="submit" className="bg-violet-600 hover:bg-violet-700 min-w-[150px]" disabled={isSubmitting}>
                    {isSubmitting ? 'Mengirim...' : (submission ? 'Update Jawaban' : 'Kirim Tugas')} <Send className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}