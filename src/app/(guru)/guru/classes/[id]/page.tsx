'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Plus, FileText, Video, Trash2, Loader2, Briefcase, Calendar, Pencil, HelpCircle, Clock, Save, X, Trophy, Fingerprint } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import RichTextEditor from '@/components/RichTextEditor'
import { toast } from 'sonner'

interface Material { id: string; title: string; module_name?: string; type: 'video' | 'text' | 'quiz' | 'file'; content?: string; youtube_url?: string; file_url?: string; xp_reward: number; }
interface Assignment { id: string; title: string; description: string; due_date: string; }

export default function ClassAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()

  const [classData, setClassData] = useState<any>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [classSessions, setClassSessions] = useState<any[]>([])
  const [classTeachers, setClassTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [isMatOpen, setIsMatOpen] = useState(false)
  const [isAssOpen, setIsAssOpen] = useState(false)
  const [isQuizOpen, setIsQuizOpen] = useState(false)
  const [isSessionOpen, setIsSessionOpen] = useState(false)
  const [isTeacherOpen, setIsTeacherOpen] = useState(false)

  const [teacherUsername, setTeacherUsername] = useState('')
  const [teacherRole, setTeacherRole] = useState('co_teacher')

  const [qzTitle, setQzTitle] = useState('')
  const [qzTimeLimit, setQzTimeLimit] = useState(600)
  const [qzXP, setQzXP] = useState(100)

  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [aTitle, setATitle] = useState('')
  const [aDesc, setADesc] = useState('')
  const [aDueDate, setADueDate] = useState('')

  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10))
  const [sessionExpiry, setSessionExpiry] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<{table: string, id: string} | null>(null)

  const fetchData = async () => {
    setLoading(true)
    const { data: cData } = await supabase.from('classes').select('*').eq('id', id).single()
    setClassData(cData)

    const { data: mData } = await supabase.from('materials').select('*').eq('class_id', id).order('created_at')
    if (mData) setMaterials(mData)

    const { data: aData } = await supabase.from('assignments').select('*').eq('class_id', id).order('created_at')
    if (aData) setAssignments(aData)

    const { data: qzData } = await supabase
      .from('quizzes')
      .select('*, quiz_questions(count)')
      .eq('class_id', id)
      .order('created_at')
    if (qzData) setQuizzes(qzData)

    const { data: sData } = await supabase.from('class_sessions').select('*').eq('class_id', id).order('session_date', { ascending: false })
    if (sData) setClassSessions(sData)

    const { data: ctData } = await supabase.from('class_teachers').select('*, profiles:user_id(*)').eq('class_id', id)
    if (ctData) setClassTeachers(ctData)

    setLoading(false)
  }

  useEffect(() => { fetchData() }, [id])

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true)
    const payload: any = { class_id: id, title: mTitle, module_name: mModuleName || null, type: mType, xp_reward: 50 }
    if (mType === 'video') payload.youtube_url = mContent; 
    else if (mType === 'file') payload.file_url = mContent;
    else payload.content = mContent;

    const { error } = await supabase.from('materials').insert(payload)
    if (!error) { 
        toast.success('Materi berhasil ditambahkan!')
        setIsMatOpen(false); resetForms(); fetchData() 
    } else {
        toast.error('Gagal tambah materi: ' + error.message)
    }
    setIsSubmitting(false)
  }

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true)
    const { error } = await supabase.from('assignments').insert({
      class_id: id, title: aTitle, description: aDesc, due_date: aDueDate ? new Date(aDueDate).toISOString() : null
    })
    if (!error) { 
        toast.success('Tugas berhasil ditambahkan!')
        setIsAssOpen(false); resetForms(); fetchData() 
    } else {
        toast.error('Gagal tambah tugas: ' + error.message)
    }
    setIsSubmitting(false)
  }

  const openEditMaterial = (m: Material) => {
    setEditingMaterial(m)
    setMTitle(m.title)
    setMModuleName(m.module_name || '')
    setMType(m.type)
    setMContent(m.type === 'video' ? m.youtube_url || '' : m.type === 'file' ? m.file_url || '' : m.content || '')
  }

  const handleUpdateMaterial = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true)
    const payload: any = { title: mTitle, module_name: mModuleName || null, type: mType }
    if (mType === 'video') { payload.youtube_url = mContent; payload.content = null; payload.file_url = null }
    else if (mType === 'file') { payload.file_url = mContent; payload.content = null; payload.youtube_url = null }
    else { payload.content = mContent; payload.youtube_url = null; payload.file_url = null }

    const { error } = await supabase.from('materials').update(payload).eq('id', editingMaterial?.id)
    if (!error) { 
        toast.success('Materi berhasil diperbarui!')
        setEditingMaterial(null); resetForms(); fetchData() 
    } else {
        toast.error('Gagal perbarui materi: ' + error.message)
    }
    setIsSubmitting(false)
  }

  const openEditAssignment = (a: Assignment) => {
    setEditingAssignment(a)
    setATitle(a.title); setADesc(a.description);
    const dateStr = a.due_date ? new Date(a.due_date).toISOString().slice(0, 16) : ''
    setADueDate(dateStr)
  }

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true)
    const { error } = await supabase.from('assignments').update({
      title: aTitle, description: aDesc, due_date: aDueDate ? new Date(aDueDate).toISOString() : null
    }).eq('id', editingAssignment?.id)
    if (!error) { 
        toast.success('Tugas berhasil diperbarui!')
        setEditingAssignment(null); resetForms(); fetchData() 
    } else {
        toast.error('Gagal perbarui tugas: ' + error.message)
    }
    setIsSubmitting(false)
  }

  const handleDelete = (table: 'materials' | 'assignments' | 'quizzes' | 'class_sessions', itemId: string) => {
    setDeleteTarget({ table, id: itemId })
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    const { error } = await supabase.from(deleteTarget.table).delete().eq('id', deleteTarget.id)
    if (error) {
        toast.error('Gagal menghapus: ' + error.message)
    } else {
        toast.success('Data berhasil dihapus.')
        fetchData()
    }
    setDeleteTarget(null)
  }

  const handleAddQuiz = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true)
    
    const { error } = await supabase.from('quizzes').insert({
      class_id: id, title: qzTitle, time_limit_seconds: qzTimeLimit, xp_reward: qzXP,
    })
    
    if (!error) { 
        toast.success('Quiz berhasil dibuat!')
        setIsQuizOpen(false); setQzTitle(''); setQzTimeLimit(600); setQzXP(100); fetchData() 
    } else {
        console.error("Quiz Insert Error:", error)
        toast.error('Sistem gagal memproses: ' + error.message)
    }
    setIsSubmitting(false)
  }

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true)
    const uniqueCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const expiresAt = sessionExpiry ? new Date(sessionExpiry).toISOString() : new Date(sessionDate + 'T23:59:59Z').toISOString()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase.from('class_sessions').insert({
      class_id: id, 
      session_date: sessionDate, 
      unique_code: uniqueCode, 
      expires_at: expiresAt,
      created_by: user?.id
    })
    
    if (!error) { 
        toast.success(`Sesi berhasil dibuat! Kode: ${uniqueCode}`)
        setIsSessionOpen(false); setSessionExpiry(''); fetchData() 
    } else {
        toast.error('Gagal membuat sesi: ' + error.message)
    }
    setIsSubmitting(false)
  }

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true)
    const { data: targetUser } = await supabase.from('profiles').select('id, role').eq('username', teacherUsername).single()
    if (!targetUser) {
        toast.error('Pengajar dengan username tersebut tidak ditemukan!')
        setIsSubmitting(false)
        return
    }
    if (targetUser.role !== 'guru' && targetUser.role !== 'admin') {
        toast.error('Pengguna tersebut bukan seorang guru!')
        setIsSubmitting(false)
        return
    }

    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('class_teachers').insert({
        class_id: id,
        user_id: targetUser.id,
        role: teacherRole,
        granted_by: user?.id
    })
    
    if (!error) {
        toast.success('Pengajar berhasil ditambahkan!')
        setIsTeacherOpen(false); setTeacherUsername(''); fetchData()
    } else {
        toast.error('Gagal menambahkan pengajar: ' + error.message)
    }
    setIsSubmitting(false)
  }

  const resetForms = () => {
    setMTitle(''); setMModuleName(''); setMType('text'); setMContent('');
    setATitle(''); setADesc(''); setADueDate('');
  }

  if (loading) return <div className="p-8 flex justify-center mt-20"><Loader2 className="animate-spin text-slate-900 h-10 w-10" /></div>

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto min-h-screen font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-100 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] p-6 md:p-8 rounded-[32px] relative mt-2">
        <div className="flex items-center gap-5 relative z-10 w-full">
          <Link href="/guru/classes">
            <Button size="icon" className="h-12 w-12 bg-white text-slate-900 border-4 border-slate-900 shadow-[2px_2px_0px_#0f172a] hover:bg-slate-200 shrink-0 rounded-2xl">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight truncate">{classData?.title}</h1>
            <p className="text-slate-600 font-bold mt-1 tracking-wide">Panel Desain Operasi Kelas</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="materials" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2 bg-slate-200/60 p-2 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] mb-8 min-h-16">
          <TabsTrigger value="materials" className="font-black text-xs sm:text-sm data-[state=active]:bg-violet-400 data-[state=active]:text-slate-900 data-[state=active]:border-2 data-[state=active]:border-slate-900 data-[state=active]:shadow-[2px_2px_0px_#0f172a] rounded-xl transition-all h-full min-h-12 border-2 border-transparent uppercase whitespace-nowrap">Materi</TabsTrigger>
          <TabsTrigger value="assignments" className="font-black text-xs sm:text-sm data-[state=active]:bg-pink-400 data-[state=active]:text-slate-900 data-[state=active]:border-2 data-[state=active]:border-slate-900 data-[state=active]:shadow-[2px_2px_0px_#0f172a] rounded-xl transition-all h-full min-h-12 border-2 border-transparent uppercase">Tugas</TabsTrigger>
          <TabsTrigger value="quizzes" className="font-black text-xs sm:text-sm data-[state=active]:bg-emerald-400 data-[state=active]:text-slate-900 data-[state=active]:border-2 data-[state=active]:border-slate-900 data-[state=active]:shadow-[2px_2px_0px_#0f172a] rounded-xl transition-all h-full min-h-12 border-2 border-transparent uppercase">Ujian</TabsTrigger>
          <TabsTrigger value="sessions" className="font-black text-xs sm:text-sm data-[state=active]:bg-cyan-400 data-[state=active]:text-slate-900 data-[state=active]:border-2 data-[state=active]:border-slate-900 data-[state=active]:shadow-[2px_2px_0px_#0f172a] rounded-xl transition-all h-full min-h-12 border-2 border-transparent uppercase whitespace-nowrap">Absensi</TabsTrigger>
          <TabsTrigger value="teachers" className="font-black text-xs sm:text-sm data-[state=active]:bg-amber-400 data-[state=active]:text-slate-900 data-[state=active]:border-2 data-[state=active]:border-slate-900 data-[state=active]:shadow-[2px_2px_0px_#0f172a] rounded-xl transition-all h-full min-h-12 border-2 border-transparent uppercase whitespace-nowrap">Pengajar</TabsTrigger>
        </TabsList>

        {/* TAB 1: MATERI */}
        <TabsContent value="materials" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b-4 border-slate-900 pb-4">
            <h3 className="text-3xl font-black text-slate-900 uppercase">Perbendaharaan Materi</h3>

            <Link href={`/guru/classes/${id}/materials/create`}>
              <Button className="bg-violet-500 hover:bg-violet-400 text-slate-900 h-12 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:translate-y-1 hover:shadow-[2px_2px_0px_#0f172a] transition-all rounded-xl">
                <Plus className="mr-2 h-5 w-5" /> Materi Ekstra
              </Button>
            </Link>
          </div>

          <div className="grid gap-4">
            {materials.map((m, idx) => (
              <Card key={m.id} className="group border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-[24px] bg-white hover:-translate-y-1 hover:shadow-[4px_4px_0px_#0f172a] transition-all overflow-hidden flex items-stretch">
                <div className={`w-16 sm:w-20 shrink-0 border-r-4 border-slate-900 flex items-center justify-center font-black text-2xl md:text-3xl text-slate-900 ${m.type === 'video' ? 'bg-orange-300' : 'bg-blue-300'}`}>
                  {idx + 1}
                </div>
                <CardContent className="p-4 sm:p-6 w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white">
                  <div>
                    <h4 className="font-black text-xl text-slate-900 flex flex-wrap items-center gap-2 mt-1">
                      {m.title} 
                      {m.type === 'video' ? <Badge className="bg-orange-100 text-orange-700 border-2 border-slate-900 shadow-sm text-[10px] tracking-wider uppercase font-black px-2"><Video className="h-3 w-3 mr-1" /> Video</Badge> 
                       : m.type === 'file' ? <Badge className="bg-emerald-100 text-emerald-700 border-2 border-slate-900 shadow-sm text-[10px] tracking-wider uppercase font-black px-2"><FileText className="h-3 w-3 mr-1" /> File</Badge>
                       : <Badge className="bg-blue-100 text-blue-700 border-2 border-slate-900 shadow-sm text-[10px] tracking-wider uppercase font-black px-2"><FileText className="h-3 w-3 mr-1" /> Teks</Badge>}
                    </h4>
                    <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">REWARD: {m.xp_reward} XP</p>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto ml-auto">
                    <Link href={`/guru/classes/${id}/materials/${m.id}/edit`}>
                      <Button variant="ghost" className="h-10 w-10 p-0 text-slate-600 bg-yellow-100 hover:bg-yellow-300 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-xl hover:-translate-y-1"><Pencil className="h-4 w-4" /></Button>
                    </Link>
                    <Button variant="ghost" className="h-10 w-10 p-0 text-slate-600 bg-red-100 hover:bg-red-400 hover:text-white border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-xl hover:-translate-y-1" onClick={() => handleDelete('materials', m.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>


        </TabsContent>

        {/* TAB 2: TUGAS */}
        <TabsContent value="assignments" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b-4 border-slate-900 pb-4">
            <h3 className="text-3xl font-black text-slate-900 uppercase">Perintah Khusus</h3>
            <Dialog open={isAssOpen} onOpenChange={setIsAssOpen}>
              <DialogTrigger asChild><Button className="bg-pink-500 hover:bg-pink-400 text-slate-900 h-12 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:translate-y-1 transition-all rounded-xl"><Plus className="mr-2 h-5 w-5" /> Turunkan Titah</Button></DialogTrigger>
              <DialogContent className="border-4 border-slate-900 shadow-[12px_12px_0px_#0f172a] rounded-[32px]">
                <DialogHeader><DialogTitle className="font-black text-2xl">Titah Baru</DialogTitle></DialogHeader>
                <form onSubmit={handleAddAssignment} className="space-y-5 mt-4">
                  <div className="space-y-2"><Label className="font-black">Objektif Utama</Label><Input className="h-12 border-4 border-slate-900 font-bold" value={aTitle} onChange={e => setATitle(e.target.value)} required /></div>
                  <div className="space-y-2">
                    <Label className="font-black">Penjabaran Misi</Label>
                    <RichTextEditor value={aDesc} onChange={setADesc} placeholder="Suruh mereka melakukan sesuatu yang heroik..." />
                  </div>
                  <div className="space-y-2"><Label className="font-black">Deadline Kiamat</Label><Input type="datetime-local" className="h-12 border-4 border-slate-900 font-bold" value={aDueDate} onChange={e => setADueDate(e.target.value)} /></div>
                  <Button type="submit" className="w-full h-12 bg-pink-500 text-slate-900 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a]" disabled={isSubmitting}>Ekseskusi Titah</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {assignments.length === 0 ? (
            <div className="text-center py-20 border-4 border-dashed border-slate-300 rounded-[32px] bg-white">
              <Briefcase className="h-16 w-16 text-slate-200 mx-auto" />
              <h3 className="font-black text-2xl mt-4">Siswa Sedang Hore</h3>
              <p className="font-bold text-slate-400">Belum ada perintah untuk mengganggu mereka.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {assignments.map((a) => (
                <Card key={a.id} className="group border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-[24px] bg-white hover:-translate-y-1 transition-all overflow-hidden flex flex-col md:flex-row">
                  <div className="w-full md:w-20 shrink-0 border-b-4 md:border-b-0 md:border-r-4 border-slate-900 bg-pink-300 flex items-center justify-center py-4 md:py-0">
                    <Briefcase className="h-8 w-8 text-slate-900" />
                  </div>
                  <CardContent className="p-4 sm:p-6 flex flex-col items-start justify-between gap-4 w-full md:flex-row md:items-center">
                    <div className="flex-1">
                      <h4 className="font-black text-xl text-slate-900">{a.title}</h4>
                      <p className="text-sm font-bold mt-2 inline-flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-lg border-2 border-slate-200">
                        <Calendar className="h-4 w-4 text-slate-500" /> <span className="text-slate-600 uppercase tracking-widest">{a.due_date ? new Date(a.due_date).toLocaleDateString() : 'Tanpa Akhir'}</span>
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                      <Link href={`/guru/classes/${id}/assignments/${a.id}`} className="w-full md:w-auto">
                        <Button className="w-full bg-slate-900 hover:bg-slate-800 text-pink-300 font-black h-12 border-2 border-transparent shadow-[3px_3px_0px_#f472b6] rounded-xl">
                          Sidak Tugas
                        </Button>
                      </Link>
                      <div className="flex gap-2 w-full justify-end sm:justify-start">
                        <Button variant="ghost" className="h-12 w-12 p-0 text-slate-600 bg-yellow-100 hover:bg-yellow-300 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-xl hover:-translate-y-1" onClick={() => openEditAssignment(a)}><Pencil className="h-5 w-5" /></Button>
                        <Button variant="ghost" className="h-12 w-12 p-0 text-slate-600 bg-red-100 hover:bg-red-400 hover:text-white border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-xl hover:-translate-y-1" onClick={() => handleDelete('assignments', a.id)}><Trash2 className="h-5 w-5" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Dialog open={!!editingAssignment} onOpenChange={(open) => !open && setEditingAssignment(null)}>
            <DialogContent className="border-4 border-slate-900 shadow-[12px_12px_0px_#0f172a] rounded-[32px]">
              <DialogHeader><DialogTitle className="font-black text-2xl">Revisi Titah</DialogTitle></DialogHeader>
              <form onSubmit={handleUpdateAssignment} className="space-y-5 mt-4">
                <div className="space-y-2"><Label className="font-black">Ubah Objektif</Label><Input className="h-12 border-4 border-slate-900 font-bold" value={aTitle} onChange={e => setATitle(e.target.value)} required /></div>
                <div className="space-y-2">
                    <Label className="font-black">Ubah Penjabaran</Label>
                    <RichTextEditor value={aDesc} onChange={setADesc} placeholder="Tuliskan detail instruksi tugas di sini..." />
                </div>
                <div className="space-y-2"><Label className="font-black">Ubah Kiamat</Label><Input type="datetime-local" className="h-12 border-4 border-slate-900 font-bold" value={aDueDate} onChange={e => setADueDate(e.target.value)} /></div>
                <Button type="submit" className="w-full h-12 bg-yellow-400 text-slate-900 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a]" disabled={isSubmitting}>Kirim Revisi</Button>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* TAB 3: QUIZ */}
        <TabsContent value="quizzes" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b-4 border-slate-900 pb-4">
            <h3 className="text-3xl font-black text-slate-900 uppercase">Uji Kompetensi</h3>
            <Dialog open={isQuizOpen} onOpenChange={setIsQuizOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 h-12 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:translate-y-1 transition-all rounded-xl">
                  <Plus className="mr-2 h-5 w-5" /> Rakit Jebakan Quiz
                </Button>
              </DialogTrigger>
              <DialogContent className="border-4 border-slate-900 shadow-[12px_12px_0px_#0f172a] rounded-[32px]">
                <DialogHeader><DialogTitle className="font-black text-2xl">Bikin Quiz Jahat</DialogTitle></DialogHeader>
                <form onSubmit={handleAddQuiz} className="space-y-5 mt-4">
                  <div className="space-y-2">
                    <Label className="font-black">Kode Ujian</Label>
                    <Input className="h-12 border-4 border-slate-900 font-bold" value={qzTitle} onChange={e => setQzTitle(e.target.value)} required placeholder="Misal: Tembak Kepala 101" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-black">Limit Nafas (Detik)</Label>
                      <Input type="number" className="h-12 border-4 border-slate-900 font-bold" value={qzTimeLimit} onChange={e => setQzTimeLimit(Number(e.target.value))} min={60} step={60} />
                      <p className="text-xs font-black text-slate-400 uppercase">{Math.floor(qzTimeLimit / 60)} Menit Menuju Kehancuran</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black">Reward Taruhan XP</Label>
                      <Input type="number" className="h-12 border-4 border-slate-900 font-bold" value={qzXP} onChange={e => setQzXP(Number(e.target.value))} min={10} step={10} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 bg-emerald-400 text-slate-900 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a]" disabled={isSubmitting}>Pasang Perangkap</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {quizzes.length === 0 ? (
            <div className="text-center py-20 border-4 border-dashed border-slate-300 rounded-[32px] bg-white">
              <HelpCircle className="h-16 w-16 text-slate-200 mx-auto transform rotate-12" />
              <h3 className="font-black text-2xl mt-4">Kurang Tantangan</h3>
              <p className="font-bold text-slate-400">Silakan siksa mental bersenang-senang dengan quiz.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {quizzes.map((qz) => {
                const questionCount = qz.quiz_questions?.[0]?.count ?? 0
                return (
                  <Card key={qz.id} className="group border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-[24px] bg-white hover:-translate-y-1 transition-all overflow-hidden flex flex-col md:flex-row">
                    <div className="w-full md:w-20 shrink-0 border-b-4 md:border-b-0 md:border-r-4 border-slate-900 bg-emerald-200 flex items-center justify-center py-4 md:py-0">
                      <HelpCircle className="h-8 w-8 text-slate-900 transform -rotate-12" />
                    </div>
                    <CardContent className="p-4 sm:p-6 w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-black text-xl text-slate-900">{qz.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge className="bg-slate-100 text-slate-700 font-bold border-2 border-slate-300 hover:bg-slate-100 px-2 uppercase shadow-sm">
                            <Clock className="h-3 w-3 mr-1" /> {Math.floor(qz.time_limit_seconds / 60)}mnt
                          </Badge>
                          <Badge className="bg-yellow-300 text-slate-900 font-black border-2 border-slate-900 px-2 uppercase shadow-[2px_2px_0px_#0f172a] transform rotate-2">
                            +{qz.xp_reward} XP
                          </Badge>
                          <Badge className="bg-white text-emerald-700 font-black border-2 border-emerald-300 px-2 uppercase shadow-sm transform -rotate-1">
                            {questionCount} SOAL
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 w-full md:w-auto mt-4 md:mt-0 justify-end md:justify-start">
                        <Link href={`/guru/classes/${id}/quiz/${qz.id}/results`}>
                           <Button className="w-full md:w-auto bg-amber-400 text-slate-900 hover:bg-amber-300 font-black border-2 border-slate-900 shadow-[2px_2px_0px_#f59e0b] rounded-xl h-12 uppercase tracking-widest text-xs sm:text-sm">
                             <Trophy className="h-4 w-4 mr-2" /> Klasemen
                           </Button>
                        </Link>
                        <Link href={`/guru/classes/${id}/quiz/${qz.id}/questions`}>
                          <Button className="w-full md:w-auto bg-slate-900 text-emerald-400 hover:bg-slate-800 font-black border-2 border-slate-900 shadow-[2px_2px_0px_#34d399] rounded-xl h-12 uppercase tracking-widest text-xs sm:text-sm">
                            Racik Soal
                          </Button>
                        </Link>
                        <Button variant="ghost" className="h-12 w-12 p-0 text-slate-600 shrink-0 bg-red-100 hover:bg-red-400 hover:text-white border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-xl hover:-translate-y-1 transition-all" onClick={() => handleDelete('quizzes', qz.id)}>
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB 4: SESSIONS (ABSENSI) */}
        <TabsContent value="sessions" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b-4 border-slate-900 pb-4">
            <h3 className="text-3xl font-black text-slate-900 uppercase">Gelar Pasukan (Absen)</h3>
            <Dialog open={isSessionOpen} onOpenChange={setIsSessionOpen}>
              <DialogTrigger asChild>
                <Button className="bg-cyan-400 hover:bg-cyan-300 text-slate-900 h-12 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:translate-y-1 transition-all rounded-xl">
                  <Fingerprint className="mr-2 h-5 w-5" /> Buka Sesi Hari Ini
                </Button>
              </DialogTrigger>
              <DialogContent className="border-4 border-slate-900 shadow-[12px_12px_0px_#0f172a] rounded-[32px]">
                <DialogHeader><DialogTitle className="font-black text-2xl">Buka Titik Presensi</DialogTitle></DialogHeader>
                <form onSubmit={handleAddSession} className="space-y-5 mt-4">
                  <div className="space-y-2">
                    <Label className="font-black">Tanggal Operasi</Label>
                    <Input type="date" className="h-12 border-4 border-slate-900 font-bold" value={sessionDate} onChange={e => setSessionDate(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black">Tenggat Waktu Kiamat (Opsional)</Label>
                    <Input type="datetime-local" className="h-12 border-4 border-slate-900 font-bold" value={sessionExpiry} onChange={e => setSessionExpiry(e.target.value)} />
                    <p className="text-xs font-bold text-slate-500 uppercase">Kosongkan untuk otomatis hangus tengah malam.</p>
                  </div>
                  <Button type="submit" className="w-full h-12 bg-cyan-400 text-slate-900 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a]" disabled={isSubmitting}>Keluarkan Sandi</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {classSessions.length === 0 ? (
            <div className="text-center py-20 border-4 border-dashed border-slate-300 rounded-[32px] bg-white">
              <Fingerprint className="h-16 w-16 text-slate-200 mx-auto transform -rotate-12" />
              <h3 className="font-black text-2xl mt-4">Anggota Liar</h3>
              <p className="font-bold text-slate-400">Belum pernah ada absen. Buka sesi sekarang!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {classSessions.map((session) => (
                <Card key={session.id} className="group border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-[24px] bg-white hover:-translate-y-1 transition-all flex flex-col md:flex-row overflow-hidden">
                  <div className="w-full md:w-24 shrink-0 border-b-4 md:border-b-0 md:border-r-4 border-slate-900 bg-cyan-200 flex flex-col items-center justify-center py-4 md:py-0 text-slate-900">
                    <span className="text-xs font-black uppercase mb-1">TGL</span>
                    <span className="text-2xl font-black">{new Date(session.session_date).getDate()}</span>
                    <span className="text-xs font-black uppercase text-center mt-1 outline-dashed outline-2 outline-slate-900 px-1">{new Date(session.session_date).toLocaleString('id-ID', { month: 'short' })}</span>
                  </div>
                  <CardContent className="p-4 sm:p-6 w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">KODE RAHASIA:</div>
                      <h4 className="font-black text-4xl text-slate-900 font-mono tracking-widest">{session.unique_code}</h4>
                      <p className="text-sm font-bold text-red-500 mt-2 uppercase flex items-center gap-1"><Clock className="h-4 w-4" /> Hangus: {new Date(session.expires_at).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button variant="ghost" className="w-full h-12 sm:w-12 p-0 text-slate-600 shrink-0 bg-red-100 hover:bg-red-400 hover:text-white border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-xl hover:-translate-y-1 transition-all" onClick={() => handleDelete('class_sessions', session.id)}>
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 5: PENGUASA KELAS (TEACHERS) */}
        <TabsContent value="teachers" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b-4 border-slate-900 pb-4">
            <h3 className="text-3xl font-black text-slate-900 uppercase">Tim Pengajar</h3>
            <Dialog open={isTeacherOpen} onOpenChange={setIsTeacherOpen}>
              <DialogTrigger asChild>
                <Button className="bg-amber-400 hover:bg-amber-300 text-slate-900 h-12 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:translate-y-1 transition-all rounded-xl">
                  <Plus className="mr-2 h-5 w-5" /> Rekrut Pengajar
                </Button>
              </DialogTrigger>
              <DialogContent className="border-4 border-slate-900 shadow-[12px_12px_0px_#0f172a] rounded-[32px]">
                <DialogHeader><DialogTitle className="font-black text-2xl">Rekrut Rekan Guru</DialogTitle></DialogHeader>
                <form onSubmit={handleAddTeacher} className="space-y-5 mt-4">
                  <div className="space-y-2">
                    <Label className="font-black">Username Guru</Label>
                    <Input className="h-12 border-4 border-slate-900 font-bold" value={teacherUsername} onChange={e => setTeacherUsername(e.target.value)} required placeholder="Misal: guru_hebat" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black">Peran (Role)</Label>
                    <Select value={teacherRole} onValueChange={setTeacherRole}>
                      <SelectTrigger className="h-12 border-4 border-slate-900 font-bold">
                        <SelectValue placeholder="Pilih peran..." />
                      </SelectTrigger>
                      <SelectContent className="border-4 border-slate-900">
                        <SelectItem value="co_teacher" className="font-bold">Co-Teacher (Bisa Edit Materi & Kuis)</SelectItem>
                        <SelectItem value="grader" className="font-bold">Grader (Hanya Menilai Tugas)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full h-12 bg-amber-400 text-slate-900 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a]" disabled={isSubmitting}>Rekrut Sekarang</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {classTeachers.length === 0 ? (
            <div className="text-center py-20 border-4 border-dashed border-slate-300 rounded-[32px] bg-white">
              <Briefcase className="h-16 w-16 text-slate-200 mx-auto" />
              <h3 className="font-black text-2xl mt-4">Gelar Single Fighter</h3>
              <p className="font-bold text-slate-400">Anda mengajar kelas ini sendirian. Tambahkan rekan untuk membantu.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {classTeachers.map((ct) => (
                <Card key={ct.id} className="group border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-[24px] bg-white hover:-translate-y-1 transition-all flex flex-col md:flex-row overflow-hidden">
                  <div className="w-full md:w-20 shrink-0 border-b-4 md:border-b-0 md:border-r-4 border-slate-900 bg-amber-200 flex items-center justify-center py-4 md:py-0">
                    <Briefcase className="h-8 w-8 text-slate-900" />
                  </div>
                  <CardContent className="p-4 sm:p-6 w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-black text-xl text-slate-900">{ct.profiles?.full_name || ct.profiles?.username}</h4>
                      <p className="text-sm font-bold text-slate-500 mt-1 uppercase">@{ct.profiles?.username}</p>
                      <Badge className="bg-slate-100 text-slate-700 font-black border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] mt-2 uppercase">{ct.role === 'co_teacher' ? 'Co-Teacher' : 'Grader'}</Badge>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                      <Button variant="ghost" className="w-full h-12 sm:w-12 p-0 text-slate-600 shrink-0 bg-red-100 hover:bg-red-400 hover:text-white border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-xl hover:-translate-y-1 transition-all" onClick={() => handleDelete('class_teachers', ct.id)}>
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="font-black text-2xl text-red-600 flex items-center gap-2">
              <Trash2 className="h-6 w-6"/> Konfirmasi Pemusnahan
            </DialogTitle>
          </DialogHeader>
          <p className="font-bold text-slate-600 my-4">Tindakan ini tidak bisa dibatalkan. Apakah Anda yakin ingin membuang elemen data ini ke jurang ketiadaan?</p>
          <div className="flex gap-4 justify-end">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="font-bold border-2 border-slate-900">Batal</Button>
            <Button onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 text-white font-black border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]">Ya, Musnahkan!</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}