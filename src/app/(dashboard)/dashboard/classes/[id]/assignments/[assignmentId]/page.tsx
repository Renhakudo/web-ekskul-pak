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
import RichTextEditor from '@/components/RichTextEditor'
import { updateLearningStreak } from '@/lib/streak-utils'
import { awardEligibleBadges } from '@/lib/badge-utils'

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
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const [answer, setAnswer] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: assignData } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', assignmentId)
        .single()
      setAssignment(assignData)

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
    setErrorMsg('')
    setSuccessMsg('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      assignment_id: assignmentId,
      user_id: user.id,
      answer: answer,
      file_url: linkUrl,
    }

    let error

    if (submission) {
      const res = await supabase.from('submissions').update(payload).eq('id', submission.id)
      error = res.error
    } else {
      const res = await supabase.from('submissions').insert(payload)
      error = res.error
    }

    if (error) {
      setErrorMsg('Gagal mengirim tugas: ' + error.message)
    } else {
      setSuccessMsg('Tugas berhasil dikirim! Guru akan segera menilainya.')
      // Update learning streak setelah berhasil mengumpulkan tugas
      updateLearningStreak(user.id, supabase).catch(() => { })
      
      // Hitung dan berikan badge otomatis
      awardEligibleBadges(user.id, supabase).catch(() => { })
      
      router.refresh()
      const { data } = await supabase.from('submissions').select('*').eq('assignment_id', assignmentId).eq('user_id', user.id).single()
      setSubmission(data)
    }
    setIsSubmitting(false)
  }

  if (loading) return <div className="p-12 text-center text-slate-900 font-bold text-xl mt-20 animate-pulse">Menyiapkan operasi intelijen...</div>
  if (!assignment) return <div className="p-12 text-center text-slate-900 font-black text-2xl border-4 border-slate-900 bg-red-100 rounded-3xl mx-auto mt-20 max-w-lg shadow-[8px_8px_0px_#0f172a]">Misi tidak ditemukan!</div>

  const isLate = assignment.due_date && new Date() > new Date(assignment.due_date)
  const isGraded = submission?.score !== null && submission?.score !== undefined

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header Navigasi */}
        <Link href={`/dashboard/classes/${classId}`} className="inline-flex items-center text-slate-900 font-black bg-white hover:bg-slate-200 px-4 py-2 rounded-xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:translate-y-1 hover:shadow-none transition-all w-fit">
          <ArrowLeft className="mr-2 h-5 w-5" /> Kabur ke Markas
        </Link>

        {/* Inline Messages */}
        {successMsg && (
          <Alert className="bg-emerald-300 border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-2xl transform rotate-1">
            <CheckCircle className="h-6 w-6 text-slate-900 flex-shrink-0" />
            <AlertDescription className="text-slate-900 font-black text-lg ml-3 pt-0.5">{successMsg}</AlertDescription>
          </Alert>
        )}
        {errorMsg && (
          <Alert variant="destructive" className="bg-red-300 border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-2xl transform -rotate-1 text-slate-900">
            <AlertCircle className="h-6 w-6 flex-shrink-0 text-slate-900" />
            <AlertDescription className="text-slate-900 font-black text-lg ml-3 pt-0.5">{errorMsg}</AlertDescription>
          </Alert>
        )}

        {/* Kartu Soal Tugas */}
        <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] overflow-hidden bg-white">
          <CardHeader className="bg-pink-300 border-b-4 border-slate-900 pb-6 p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight bg-white inline-block px-3 py-1 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-xl transform -rotate-1">{assignment.title}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-4 text-sm font-bold text-slate-800">
                  <Badge className="bg-slate-100 text-slate-900 border-2 border-slate-900 shadow-sm px-3 py-1 text-xs md:text-sm uppercase tracking-widest">
                    <Calendar className="mr-2 h-4 w-4" />
                    Kiamat: {assignment.due_date ? new Date(assignment.due_date).toLocaleString() : 'Damai Selamanya'}
                  </Badge>
                  {isLate && !submission && (
                    <Badge className="bg-red-400 text-slate-900 border-2 border-slate-900 shadow-sm font-black text-xs md:text-sm uppercase tracking-widest animate-pulse">
                      Nyawa Sekarat (Telat)
                    </Badge>
                  )}
                </div>
              </div>

              <div className="self-start md:self-auto shrink-0 mt-2 md:mt-0">
                {submission ? (
                  <Badge className="bg-emerald-400 text-slate-900 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] px-4 py-2 font-black text-sm uppercase transform rotate-2">
                    <CheckCircle className="mr-2 h-5 w-5" /> Misi Selesai
                  </Badge>
                ) : (
                  <Badge className="bg-amber-300 text-slate-900 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] px-4 py-2 font-black text-sm uppercase transform -rotate-2">
                    <Clock className="mr-2 h-5 w-5" /> Sedang Dipantau
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8 bg-pink-50/50">
            <h3 className="font-black text-xl mb-3 text-slate-900 uppercase underline decoration-4 decoration-pink-400 underline-offset-4">Dokumen Target Tugas:</h3>
            <div 
              className="prose prose-slate prose-lg max-w-none text-slate-800 font-medium leading-relaxed bg-white p-6 rounded-2xl border-4 border-slate-900 shadow-inner
                         prose-headings:font-black prose-headings:text-slate-900 prose-a:text-violet-600 prose-a:font-black
                         prose-blockquote:border-l-4 prose-blockquote:border-slate-900 prose-blockquote:bg-slate-50 prose-blockquote:not-italic prose-blockquote:font-bold prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-xl
                         prose-code:text-pink-600 prose-code:bg-pink-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:border-2 prose-code:border-pink-200
                         prose-pre:bg-slate-900 prose-pre:text-slate-50 prose-pre:border-4 prose-pre:border-slate-900 prose-pre:shadow-[4px_4px_0px_#0f172a] prose-pre:rounded-xl"
              dangerouslySetInnerHTML={{ __html: assignment.description }}
            />
          </CardContent>
        </Card>

        {/* Form Pengumpulan */}
        <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] overflow-hidden bg-white mt-8">
          <CardHeader className="bg-amber-300 border-b-4 border-slate-900 p-6 md:p-8">
            <CardTitle className="text-3xl font-black text-slate-900 uppercase">Ruang Interogasi Jawaban</CardTitle>
            <CardDescription className="text-slate-800 font-bold text-base mt-2 bg-white/60 inline-block px-3 py-1 border-2 border-slate-900 rounded-lg">Masukkan bukti keberhasilan operasi di sini.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            {isGraded ? (
              <Alert className="bg-emerald-100 border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] p-6 rounded-2xl text-slate-900 flex flex-col md:flex-row items-center justify-between">
                <div className="flex items-center gap-4 mb-4 md:mb-0">
                  <div className="h-16 w-16 bg-emerald-400 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-2xl flex items-center justify-center transform -rotate-6">
                    <CheckCircle className="h-8 w-8 text-slate-900" />
                  </div>
                  <div>
                    <AlertTitle className="text-2xl font-black text-slate-900 uppercase">Vonis Sang Guru</AlertTitle>
                    <AlertDescription className="text-slate-700 font-bold mt-1 text-lg">
                      Karyamu telah dievaluasi dengan ketat.
                    </AlertDescription>
                  </div>
                </div>
                <div className="text-center bg-white px-8 py-4 border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-2xl transform rotate-2">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500 block mb-1">Skor Akhir</span>
                  <div className="text-6xl font-black text-emerald-500">{submission.score}</div>
                </div>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-3">
                  <Label className="text-xl font-black text-slate-900 uppercase">Kesaksian Tertulis</Label>
                  <RichTextEditor 
                    value={answer} 
                    onChange={setAnswer} 
                    placeholder="Jabarkan rentetan kronologi aksi heroikmu..." 
                  />
                  <p className="text-sm font-bold text-slate-500 mt-2 bg-slate-100 inline-block px-3 py-1 rounded-md border-2 border-slate-200">Bebas berekspresi dengan cetak tebal, link referensi referensi valid, hingga blockquote.</p>
                </div>

                <div className="space-y-3">
                  <Label className="text-xl font-black text-slate-900 uppercase">Barang Bukti Tambahan (Tautan File)</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-4 h-6 w-6 text-slate-900 pointer-events-none" />
                    <Input
                      placeholder="https://drive.google.com/..."
                      className="pl-14 h-14 text-lg font-bold border-4 border-slate-900 rounded-xl shadow-sm focus:shadow-[4px_4px_0px_#0f172a] transition-all bg-slate-50 focus:bg-white"
                      value={linkUrl}
                      onChange={e => setLinkUrl(e.target.value)}
                    />
                  </div>
                  <p className="text-sm font-bold text-slate-500 bg-slate-100 inline-block px-3 py-1 rounded-md border-2 border-slate-200">
                    Sembunyikan dokumen aslimu di GDrive lalu setor tautannya kemari.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t-4 border-slate-900 gap-4 mt-8">
                  {submission && (
                    <Badge className="bg-slate-200 text-slate-600 font-bold border-2 border-slate-300 px-3 py-1 text-xs md:text-sm shadow-sm order-2 sm:order-1 w-full sm:w-auto text-center justify-center">
                      <Clock className="w-4 h-4 mr-2 inline" /> Data masuk pada: {new Date(submission.submitted_at).toLocaleString()}
                    </Badge>
                  )}
                  <Button type="submit" className="w-full sm:w-auto h-16 px-10 bg-violet-500 hover:bg-violet-400 text-slate-900 font-black text-xl border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] hover:translate-y-1 hover:shadow-[2px_2px_0px_#0f172a] transition-all rounded-2xl order-1 sm:order-2 uppercase" disabled={isSubmitting}>
                    {isSubmitting ? 'Mentransmisikan Data...' : (submission ? 'Revisi Laporan Misi' : 'Setor Hasil Misi')} <Send className="ml-3 h-6 w-6" />
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