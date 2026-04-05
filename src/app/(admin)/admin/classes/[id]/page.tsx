'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic' // <-- IMPORT INI UNTUK MEMPERBAIKI ERROR

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Plus, FileText, Video, Trash2, Loader2, Briefcase, Calendar, Pencil, HelpCircle, Clock, Save, X, Trophy, AlertTriangle, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

// 🪄 SOLUSI ERROR: Matikan SSR untuk RichTextEditor agar tidak crash di Server Next.js
const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { 
  ssr: false,
  loading: () => <div className="min-h-[150px] w-full bg-slate-100 border-4 border-slate-900 border-dashed rounded-xl animate-pulse flex items-center justify-center font-black text-slate-400">Memuat Editor...</div>
})

interface Material { id: string; title: string; type: 'video' | 'text' | 'quiz' | 'file'; content?: string; youtube_url?: string; xp_reward: number; }
interface Assignment { id: string; title: string; description: string; due_date: string; }

export default function ClassAdminPage({ params }: { params: Promise<{ id: string }> }) {
  // Cara aman unwrap params di React 19 / Next 15+
  const resolvedParams = use(params)
  const id = resolvedParams.id
  
  const supabase = createClient()

  const [classData, setClassData] = useState<any>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [isMatOpen, setIsMatOpen] = useState(false)
  const [isAssOpen, setIsAssOpen] = useState(false)
  const [isQuizOpen, setIsQuizOpen] = useState(false)

  const [qzTitle, setQzTitle] = useState('')
  const [qzTimeLimit, setQzTimeLimit] = useState(600)
  const [qzXP, setQzXP] = useState(100)

  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [mTitle, setMTitle] = useState('')
  const [mType, setMType] = useState('text')
  const [mContent, setMContent] = useState('')

  const [aTitle, setATitle] = useState('')
  const [aDesc, setADesc] = useState('')
  const [aDueDate, setADueDate] = useState('')

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

    setLoading(false)
  }

  useEffect(() => { fetchData() }, [id])

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true)
    const payload: any = { class_id: id, title: mTitle, type: mType, xp_reward: 50 }
    if (mType === 'video') payload.youtube_url = mContent; else payload.content = mContent;

    const { error } = await supabase.from('materials').insert(payload)
    if (!error) { 
        toast.success('Materi berhasil ditambahkan! 📚')
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
        toast.success('Tugas berhasil diberikan! ⚔️')
        setIsAssOpen(false); resetForms(); fetchData() 
    } else {
        toast.error('Gagal tambah tugas: ' + error.message)
    }
    setIsSubmitting(false)
  }

  const openEditMaterial = (m: Material) => {
    setEditingMaterial(m)
    setMTitle(m.title)
    setMType(m.type)
    setMContent(m.type === 'video' ? m.youtube_url || '' : m.content || '')
  }

  const handleUpdateMaterial = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true)
    const payload: any = { title: mTitle, type: mType }
    if (mType === 'video') { payload.youtube_url = mContent; payload.content = null }
    else { payload.content = mContent; payload.youtube_url = null }

    const { error } = await supabase.from('materials').update(payload).eq('id', editingMaterial?.id)
    if (!error) { 
        toast.success('Materi berhasil diperbarui! ✨')
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
        toast.success('Tugas berhasil direvisi! 🛠️')
        setEditingAssignment(null); resetForms(); fetchData() 
    } else {
        toast.error('Gagal perbarui tugas: ' + error.message)
    }
    setIsSubmitting(false)
  }

  const handleDelete = (table: 'materials' | 'assignments' | 'quizzes', itemId: string) => {
    setDeleteTarget({ table, id: itemId })
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    const { error } = await supabase.from(deleteTarget.table).delete().eq('id', deleteTarget.id)
    if (error) {
        toast.error('Gagal memusnahkan: ' + error.message)
    } else {
        toast.success('Data berhasil dimusnahkan. 💥')
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
        toast.success('Jebakan Quiz berhasil dipasang! 🕸️')
        setIsQuizOpen(false); setQzTitle(''); setQzTimeLimit(600); setQzXP(100); fetchData() 
    } else {
        toast.error('Sistem gagal memproses: ' + error.message)
    }
    setIsSubmitting(false)
  }

  const resetForms = () => {
    setMTitle(''); setMType('text'); setMContent('');
    setATitle(''); setADesc(''); setADueDate('');
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7]">
      <Loader2 className="animate-spin h-14 w-14 text-emerald-500 mb-4" />
      <p className="font-black text-slate-500 uppercase tracking-widest">Membongkar Brankas Kelas...</p>
    </div>
  )

  return (
    <div className="p-4 md:p-8 space-y-10 max-w-6xl mx-auto min-h-screen font-sans relative z-0 overflow-x-hidden pb-24">
      {/* ====== BACKGROUND DOT PATTERN ====== */}
      <div className="absolute inset-0 z-[-1] bg-[radial-gradient(#cbd5e1_2px,transparent_2px)] [background-size:32px_32px] opacity-40 fixed"></div>

      {/* ====== HEADER KELAS ====== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-amber-300 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] relative mt-4 overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 10px)' }}></div>
        <div className="flex items-start sm:items-center gap-5 relative z-10 w-full">
          <Link href="/admin/classes" className="shrink-0">
            <Button size="icon" className="h-14 w-14 bg-white text-slate-900 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:bg-slate-200 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all rounded-2xl transform -rotate-3 hover:rotate-0">
              <ArrowLeft className="h-7 w-7" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight truncate drop-shadow-sm uppercase">
              {classData?.title}
            </h1>
            <p className="text-slate-900 font-bold mt-2 tracking-widest uppercase bg-white/60 inline-block px-3 py-1 rounded-lg border-2 border-slate-900 shadow-sm text-xs md:text-sm">
              Pusat Kendali Operasi
            </p>
          </div>
        </div>
      </div>

      {/* ====== TABS ====== */}
      <Tabs defaultValue="materials" className="w-full">
        <TabsList className="flex flex-col md:flex-row w-full mb-10 bg-transparent p-0 gap-3 md:gap-4 h-auto overflow-visible">
          <TabsTrigger 
            value="materials" 
            className="flex-1 w-full py-4 font-black text-base md:text-lg uppercase rounded-[1.5rem] transition-all border-4 border-slate-900 bg-white text-slate-500 shadow-[4px_4px_0px_#0f172a] data-[state=inactive]:hover:-translate-y-1 data-[state=inactive]:hover:shadow-[6px_6px_0px_#0f172a] data-[state=active]:translate-y-[4px] data-[state=active]:translate-x-[4px] data-[state=active]:shadow-none data-[state=active]:bg-violet-400 data-[state=active]:text-slate-900 flex items-center justify-center gap-2 outline-none"
          >
            <FileText className="w-6 h-6" /> Materi Pokok
          </TabsTrigger>
          
          <TabsTrigger 
            value="assignments" 
            className="flex-1 w-full py-4 font-black text-base md:text-lg uppercase rounded-[1.5rem] transition-all border-4 border-slate-900 bg-white text-slate-500 shadow-[4px_4px_0px_#0f172a] data-[state=inactive]:hover:-translate-y-1 data-[state=inactive]:hover:shadow-[6px_6px_0px_#0f172a] data-[state=active]:translate-y-[4px] data-[state=active]:translate-x-[4px] data-[state=active]:shadow-none data-[state=active]:bg-pink-400 data-[state=active]:text-slate-900 flex items-center justify-center gap-2 outline-none"
          >
            <Briefcase className="w-6 h-6" /> Tugas
          </TabsTrigger>

          <TabsTrigger 
            value="quizzes" 
            className="flex-1 w-full py-4 font-black text-base md:text-lg uppercase rounded-[1.5rem] transition-all border-4 border-slate-900 bg-white text-slate-500 shadow-[4px_4px_0px_#0f172a] data-[state=inactive]:hover:-translate-y-1 data-[state=inactive]:hover:shadow-[6px_6px_0px_#0f172a] data-[state=active]:translate-y-[4px] data-[state=active]:translate-x-[4px] data-[state=active]:shadow-none data-[state=active]:bg-emerald-400 data-[state=active]:text-slate-900 flex items-center justify-center gap-2 outline-none"
          >
            <HelpCircle className="w-6 h-6" /> Ujian
          </TabsTrigger>
        </TabsList>

        {/* ==================== TAB 1: MATERI ==================== */}
        <TabsContent value="materials" className="space-y-6 focus:outline-none">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-violet-100 p-6 md:p-8 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a]">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase">Perbendaharaan Materi</h3>

            <Dialog open={isMatOpen} onOpenChange={setIsMatOpen}>
              <DialogTrigger asChild>
                <Button className="bg-violet-500 hover:bg-violet-400 text-slate-900 h-14 px-6 text-base font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] active:shadow-none active:translate-y-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0f172a] transition-all rounded-[1.5rem] uppercase tracking-wider">
                  <Plus className="mr-2 h-6 w-6" /> Suntik Materi
                </Button>
              </DialogTrigger>
              <DialogContent className="border-4 border-slate-900 shadow-[12px_12px_0px_#0f172a] rounded-[2rem] bg-[#FDFBF7] p-6 sm:p-8 max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle className="font-black text-3xl uppercase text-slate-900">Arsip Baru</DialogTitle></DialogHeader>
                <form onSubmit={handleAddMaterial} className="space-y-6 mt-4">
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-xs text-slate-800">Subjek Modul</Label>
                    <Input className="h-14 border-4 border-slate-900 font-bold text-lg rounded-xl focus-visible:ring-0 focus:shadow-[4px_4px_0px_#0f172a] transition-shadow bg-white" value={mTitle} onChange={e => setMTitle(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-xs text-slate-800">Tipe Informasi</Label>
                    <Select value={mType} onValueChange={setMType}>
                      <SelectTrigger className="h-14 border-4 border-slate-900 font-bold text-lg rounded-xl focus:ring-0 focus:shadow-[4px_4px_0px_#0f172a] bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_#0f172a]">
                        <SelectItem value="text" className="font-bold text-base py-3 cursor-pointer">Teks Laporan</SelectItem>
                        <SelectItem value="video" className="font-bold text-base py-3 cursor-pointer">Sinyal Video</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-xs text-slate-800">{mType === 'video' ? 'Tautan YouTube' : 'Isi Data'}</Label>
                    {mType === 'video' ? (
                        <Input className="h-14 border-4 border-slate-900 font-bold text-base rounded-xl focus-visible:ring-0 focus:shadow-[4px_4px_0px_#0f172a] bg-white" value={mContent} onChange={e => setMContent(e.target.value)} placeholder="https://youtube.com/..." required />
                    ) : (
                        <div className="border-4 border-slate-900 rounded-2xl overflow-hidden bg-white focus-within:shadow-[4px_4px_0px_#0f172a] transition-shadow">
                          <RichTextEditor value={mContent} onChange={setMContent} placeholder="Tuliskan pengetahuan rahasia di sini..." />
                        </div>
                    )}
                  </div>
                  <Button type="submit" className="w-full h-16 bg-violet-500 hover:bg-violet-400 font-black text-xl text-slate-900 border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] active:shadow-none active:translate-y-1 rounded-2xl uppercase tracking-wider transition-all" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin w-6 h-6" /> : 'Suntik Data'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6">
            {materials.map((m, idx) => (
              <Card key={m.id} className="group border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-[24px] bg-white hover:-translate-y-2 hover:shadow-[10px_10px_0px_#0f172a] transition-all duration-300 overflow-hidden flex flex-col sm:flex-row items-stretch cursor-default">
                <div className={`w-full sm:w-24 shrink-0 border-b-4 sm:border-b-0 sm:border-r-4 border-slate-900 flex items-center justify-center font-black text-3xl md:text-4xl text-slate-900 py-4 sm:py-0 ${m.type === 'video' ? 'bg-orange-300' : 'bg-blue-300'}`}>
                  {idx + 1}
                </div>
                <CardContent className="p-6 w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h4 className="font-black text-2xl md:text-3xl text-slate-900 leading-tight truncate group-hover:text-violet-700 transition-colors">
                        {m.title}
                      </h4>
                      {m.type === 'video' ? 
                        <Badge className="bg-orange-100 text-orange-800 border-2 border-slate-900 shadow-sm text-xs tracking-wider uppercase font-black px-3 py-1"><Video className="h-4 w-4 mr-1" /> Video</Badge> 
                        : 
                        <Badge className="bg-blue-100 text-blue-800 border-2 border-slate-900 shadow-sm text-xs tracking-wider uppercase font-black px-3 py-1"><FileText className="h-4 w-4 mr-1" /> Teks</Badge>
                      }
                    </div>
                    <Badge className="bg-slate-100 text-slate-600 border-2 border-slate-300 shadow-sm text-xs tracking-wider uppercase font-bold px-3">
                      REWARD: {m.xp_reward} XP
                    </Badge>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto justify-end shrink-0">
                    <Button variant="ghost" className="h-12 w-12 p-0 text-slate-600 bg-yellow-100 hover:bg-yellow-300 hover:text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-xl hover:-translate-y-1 transition-all" onClick={() => openEditMaterial(m)}><Pencil className="h-5 w-5" /></Button>
                    <Button variant="ghost" className="h-12 w-12 p-0 text-slate-600 bg-red-100 hover:bg-red-400 hover:text-white border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-xl hover:-translate-y-1 transition-all" onClick={() => handleDelete('materials', m.id)}><Trash2 className="h-5 w-5" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Dialog open={!!editingMaterial} onOpenChange={(open) => !open && setEditingMaterial(null)}>
            <DialogContent className="border-4 border-slate-900 shadow-[12px_12px_0px_#0f172a] rounded-[2rem] bg-[#FDFBF7] p-6 sm:p-8 max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="font-black text-3xl uppercase text-slate-900 flex items-center gap-3"><Pencil className="w-6 h-6 text-yellow-500" /> Rombak Arsip</DialogTitle></DialogHeader>
              <form onSubmit={handleUpdateMaterial} className="space-y-6 mt-4">
                <div className="space-y-2"><Label className="font-black uppercase text-xs">Judul Baru</Label><Input className="h-14 border-4 border-slate-900 font-bold text-lg rounded-xl focus-visible:ring-0 focus:shadow-[4px_4px_0px_#0f172a] transition-shadow bg-white" value={mTitle} onChange={e => setMTitle(e.target.value)} required /></div>
                <div className="space-y-2"><Label className="font-black uppercase text-xs">Tipe Informasi</Label>
                  <Select value={mType} onValueChange={setMType}>
                    <SelectTrigger className="h-14 border-4 border-slate-900 font-bold text-lg rounded-xl bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-xl"><SelectItem value="text" className="font-bold py-3 text-base">Teks</SelectItem><SelectItem value="video" className="font-bold py-3 text-base">Video</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                    <Label className="font-black uppercase text-xs">{mType === 'video' ? 'Tautan YouTube' : 'Isi Data'}</Label>
                    {mType === 'video' ? (
                        <Input className="h-14 border-4 border-slate-900 font-bold text-base rounded-xl focus-visible:ring-0 focus:shadow-[4px_4px_0px_#0f172a] transition-shadow bg-white" value={mContent} onChange={e => setMContent(e.target.value)} placeholder="https://youtube.com/..." required />
                    ) : (
                        <div className="border-4 border-slate-900 rounded-2xl overflow-hidden bg-white focus-within:shadow-[4px_4px_0px_#0f172a] transition-shadow">
                           <RichTextEditor value={mContent} onChange={setMContent} placeholder="Tuliskan pengetahuan rahasia di sini..." />
                        </div>
                    )}
                </div>
                <Button type="submit" className="w-full h-16 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black text-xl border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] active:shadow-none active:translate-y-1 rounded-2xl uppercase tracking-wider transition-all" disabled={isSubmitting}><Save className="mr-2 h-6 w-6" /> Simpan Revisi</Button>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ==================== TAB 2: TUGAS ==================== */}
        <TabsContent value="assignments" className="space-y-6 focus:outline-none">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-pink-100 p-6 md:p-8 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a]">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase">Perintah Khusus</h3>
            <Dialog open={isAssOpen} onOpenChange={setIsAssOpen}>
              <DialogTrigger asChild>
                <Button className="bg-pink-500 hover:bg-pink-400 text-slate-900 h-14 px-6 text-base font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] active:shadow-none active:translate-y-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0f172a] transition-all rounded-[1.5rem] uppercase tracking-wider">
                  <Plus className="mr-2 h-6 w-6" /> Turunkan Titah
                </Button>
              </DialogTrigger>
              <DialogContent className="border-4 border-slate-900 shadow-[12px_12px_0px_#0f172a] rounded-[2rem] bg-[#FDFBF7] p-6 sm:p-8 max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle className="font-black text-3xl uppercase text-slate-900">Titah Baru</DialogTitle></DialogHeader>
                <form onSubmit={handleAddAssignment} className="space-y-6 mt-4">
                  <div className="space-y-2"><Label className="font-black uppercase text-xs">Objektif Utama</Label><Input className="h-14 border-4 border-slate-900 font-bold text-lg rounded-xl focus-visible:ring-0 focus:shadow-[4px_4px_0px_#0f172a] bg-white" value={aTitle} onChange={e => setATitle(e.target.value)} required /></div>
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-xs">Penjabaran Misi</Label>
                    <div className="border-4 border-slate-900 rounded-2xl overflow-hidden bg-white focus-within:shadow-[4px_4px_0px_#0f172a] transition-shadow">
                      <RichTextEditor value={aDesc} onChange={setADesc} placeholder="Suruh mereka melakukan sesuatu yang heroik..." />
                    </div>
                  </div>
                  <div className="space-y-2"><Label className="font-black uppercase text-xs">Deadline Kiamat</Label><Input type="datetime-local" className="h-14 border-4 border-slate-900 font-bold text-lg rounded-xl bg-white" value={aDueDate} onChange={e => setADueDate(e.target.value)} /></div>
                  <Button type="submit" className="w-full h-16 bg-pink-500 hover:bg-pink-400 text-slate-900 font-black text-xl border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] active:shadow-none active:translate-y-1 rounded-2xl uppercase tracking-wider transition-all" disabled={isSubmitting}>Eksekusi Titah</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {assignments.length === 0 ? (
            <div className="p-16 text-center bg-white border-4 border-slate-900 border-dashed rounded-[2rem] shadow-sm transform -rotate-1">
              <div className="w-20 h-20 bg-slate-100 rounded-2xl border-4 border-slate-900 flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0px_#0f172a]">
                <Briefcase className="h-10 w-10 text-slate-400" />
              </div>
              <p className="font-black text-xl text-slate-500 uppercase tracking-widest">Siswa masih bisa bernafas lega.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {assignments.map((a) => (
                <Card key={a.id} className="group border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-[24px] bg-white hover:-translate-y-2 hover:shadow-[10px_10px_0px_#0f172a] transition-all duration-300 overflow-hidden flex flex-col md:flex-row cursor-default">
                  <div className="w-full md:w-24 shrink-0 border-b-4 md:border-b-0 md:border-r-4 border-slate-900 bg-pink-300 flex items-center justify-center py-6 md:py-0">
                    <Briefcase className="h-10 w-10 text-slate-900 transform group-hover:scale-110 transition-transform" />
                  </div>
                  <CardContent className="p-6 md:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 w-full">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-2xl md:text-3xl text-slate-900 truncate mb-2 group-hover:text-pink-600 transition-colors">{a.title}</h4>
                      <Badge className="bg-slate-100 text-slate-700 font-bold border-2 border-slate-300 uppercase tracking-wider px-3 py-1 text-xs md:text-sm">
                        <Calendar className="h-4 w-4 mr-2" /> Deadline: {a.due_date ? new Date(a.due_date).toLocaleDateString('id-ID', {day: 'numeric', month:'long', year:'numeric'}) : 'Tanpa Tenggat'}
                      </Badge>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
                      <Link href={`/admin/classes/${id}/assignments/${a.id}`} className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-pink-300 font-black h-12 md:h-14 px-6 border-2 border-transparent shadow-[4px_4px_0px_#f472b6] rounded-xl hover:-translate-y-1 transition-all uppercase tracking-wider text-sm md:text-base">
                          Sidak Tugas <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                      </Link>
                      <div className="flex gap-3 w-full sm:w-auto justify-end sm:justify-start">
                        <Button variant="ghost" className="h-12 w-12 md:h-14 md:w-14 p-0 text-slate-600 bg-yellow-100 hover:bg-yellow-300 hover:text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-xl hover:-translate-y-1 transition-all" onClick={() => openEditAssignment(a)}><Pencil className="h-5 w-5 md:h-6 md:w-6" /></Button>
                        <Button variant="ghost" className="h-12 w-12 md:h-14 md:w-14 p-0 text-slate-600 bg-red-100 hover:bg-red-400 hover:text-white border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-xl hover:-translate-y-1 transition-all" onClick={() => handleDelete('assignments', a.id)}><Trash2 className="h-5 w-5 md:h-6 md:w-6" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Dialog open={!!editingAssignment} onOpenChange={(open) => !open && setEditingAssignment(null)}>
            <DialogContent className="border-4 border-slate-900 shadow-[12px_12px_0px_#0f172a] rounded-[2rem] bg-[#FDFBF7] p-6 sm:p-8 max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="font-black text-3xl uppercase text-slate-900 flex items-center gap-3"><Pencil className="w-6 h-6 text-yellow-500" /> Revisi Titah</DialogTitle></DialogHeader>
              <form onSubmit={handleUpdateAssignment} className="space-y-6 mt-4">
                <div className="space-y-2"><Label className="font-black uppercase text-xs">Ubah Objektif</Label><Input className="h-14 border-4 border-slate-900 font-bold text-lg rounded-xl bg-white" value={aTitle} onChange={e => setATitle(e.target.value)} required /></div>
                <div className="space-y-2">
                    <Label className="font-black uppercase text-xs">Ubah Penjabaran</Label>
                    <div className="border-4 border-slate-900 rounded-2xl overflow-hidden bg-white">
                      <RichTextEditor value={aDesc} onChange={setADesc} placeholder="Tuliskan detail instruksi tugas di sini..." />
                    </div>
                </div>
                <div className="space-y-2"><Label className="font-black uppercase text-xs">Ubah Kiamat (Deadline)</Label><Input type="datetime-local" className="h-14 border-4 border-slate-900 font-bold text-lg rounded-xl bg-white" value={aDueDate} onChange={e => setADueDate(e.target.value)} /></div>
                <Button type="submit" className="w-full h-16 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black text-xl border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] active:shadow-none active:translate-y-1 rounded-2xl uppercase tracking-wider transition-all" disabled={isSubmitting}><Save className="mr-2 h-6 w-6" /> Kirim Revisi</Button>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ==================== TAB 3: QUIZ ==================== */}
        <TabsContent value="quizzes" className="space-y-6 focus:outline-none">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-emerald-100 p-6 md:p-8 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a]">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase">Uji Kompetensi</h3>
            <Dialog open={isQuizOpen} onOpenChange={setIsQuizOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 h-14 px-6 text-base font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] active:shadow-none active:translate-y-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0f172a] transition-all rounded-[1.5rem] uppercase tracking-wider">
                  <Plus className="mr-2 h-6 w-6" /> Rakit Jebakan Quiz
                </Button>
              </DialogTrigger>
              <DialogContent className="border-4 border-slate-900 shadow-[12px_12px_0px_#0f172a] rounded-[2rem] bg-[#FDFBF7] p-6 sm:p-8 max-w-md">
                <DialogHeader><DialogTitle className="font-black text-3xl uppercase text-slate-900">Bikin Quiz Jahat</DialogTitle></DialogHeader>
                <form onSubmit={handleAddQuiz} className="space-y-6 mt-4">
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-xs">Kode Ujian (Judul)</Label>
                    <Input className="h-14 border-4 border-slate-900 font-bold text-lg rounded-xl bg-white focus-visible:ring-0 focus:shadow-[4px_4px_0px_#0f172a]" value={qzTitle} onChange={e => setQzTitle(e.target.value)} required placeholder="Misal: Tembak Kepala 101" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-black uppercase text-xs">Limit Nafas (Detik)</Label>
                      <Input type="number" className="h-14 border-4 border-slate-900 font-black text-lg rounded-xl bg-white" value={qzTimeLimit} onChange={e => setQzTimeLimit(Number(e.target.value))} min={60} step={60} />
                      <p className="text-xs font-black text-red-500 uppercase">{Math.floor(qzTimeLimit / 60)} Menit Menuju Kiamat</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black uppercase text-xs">Taruhan XP</Label>
                      <Input type="number" className="h-14 border-4 border-slate-900 font-black text-lg rounded-xl bg-white" value={qzXP} onChange={e => setQzXP(Number(e.target.value))} min={10} step={10} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-16 bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-black text-xl border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] active:shadow-none active:translate-y-1 rounded-2xl uppercase tracking-wider transition-all mt-4" disabled={isSubmitting}>Pasang Perangkap</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {quizzes.length === 0 ? (
            <div className="p-16 text-center bg-white border-4 border-slate-900 border-dashed rounded-[2rem] shadow-sm transform rotate-1">
              <div className="w-20 h-20 bg-slate-100 rounded-2xl border-4 border-slate-900 flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0px_#0f172a] transform -rotate-12">
                <HelpCircle className="h-10 w-10 text-slate-400" />
              </div>
              <p className="font-black text-xl text-slate-500 uppercase tracking-widest">Siswa kurang tantangan.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {quizzes.map((qz) => {
                const questionCount = qz.quiz_questions?.[0]?.count ?? 0
                return (
                  <Card key={qz.id} className="group border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-[24px] bg-white hover:-translate-y-2 hover:shadow-[10px_10px_0px_#0f172a] transition-all duration-300 overflow-hidden flex flex-col md:flex-row cursor-default">
                    <div className="w-full md:w-24 shrink-0 border-b-4 md:border-b-0 md:border-r-4 border-slate-900 bg-emerald-200 flex items-center justify-center py-6 md:py-0">
                      <HelpCircle className="h-10 w-10 text-slate-900 transform group-hover:rotate-12 transition-transform" />
                    </div>
                    <CardContent className="p-6 md:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 w-full">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-2xl md:text-3xl text-slate-900 truncate mb-3 group-hover:text-emerald-700 transition-colors">{qz.title}</h4>
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge className="bg-slate-100 text-slate-700 font-bold border-2 border-slate-300 uppercase px-3 py-1.5 text-xs md:text-sm shadow-sm">
                            <Clock className="h-4 w-4 mr-1.5" /> {Math.floor(qz.time_limit_seconds / 60)} MNT
                          </Badge>
                          <Badge className="bg-yellow-300 text-slate-900 font-black border-2 border-slate-900 uppercase px-3 py-1.5 text-xs md:text-sm shadow-[2px_2px_0px_#0f172a] transform rotate-2">
                            +{qz.xp_reward} XP
                          </Badge>
                          <Badge className="bg-white text-emerald-700 font-black border-2 border-emerald-300 uppercase px-3 py-1.5 text-xs md:text-sm shadow-sm transform -rotate-1">
                            {questionCount} SOAL
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 w-full lg:w-auto shrink-0 justify-end">
                        <Link href={`/admin/classes/${id}/quiz/${qz.id}/results`} className="w-full sm:w-auto">
                           <Button className="w-full sm:w-auto bg-amber-400 text-slate-900 hover:bg-amber-300 font-black border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] hover:-translate-y-1 hover:shadow-[4px_4px_0px_#0f172a] rounded-xl h-12 md:h-14 uppercase tracking-wider text-sm md:text-base px-6 transition-all">
                             <Trophy className="h-5 w-5 mr-2" /> Klasemen
                           </Button>
                        </Link>
                        <Link href={`/admin/classes/${id}/quiz/${qz.id}/questions`} className="w-full sm:w-auto">
                          <Button className="w-full sm:w-auto bg-slate-900 text-emerald-400 hover:bg-slate-800 font-black border-2 border-transparent shadow-[3px_3px_0px_#34d399] hover:-translate-y-1 hover:shadow-[4px_4px_0px_#34d399] rounded-xl h-12 md:h-14 uppercase tracking-wider text-sm md:text-base px-6 transition-all">
                            Racik Soal
                          </Button>
                        </Link>
                        <Button variant="ghost" className="h-12 w-12 md:h-14 md:w-14 p-0 text-slate-600 bg-red-100 hover:bg-red-400 hover:text-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] rounded-xl hover:-translate-y-1 transition-all shrink-0" onClick={() => handleDelete('quizzes', qz.id)}>
                          <Trash2 className="h-5 w-5 md:h-6 md:w-6" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ====== DELETE CONFIRM DIALOG ====== */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="border-4 border-slate-900 shadow-[12px_12px_0px_#0f172a] rounded-[2rem] bg-[#FDFBF7] p-6 sm:p-8 max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-black text-3xl text-slate-900 flex items-center gap-3 uppercase">
              <div className="bg-red-300 p-2 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] transform -rotate-6">
                <AlertTriangle className="h-8 w-8 text-red-700" />
              </div>
              Pemusnahan
            </DialogTitle>
          </DialogHeader>
          <p className="font-bold text-slate-600 my-4 text-base leading-relaxed">
            Tindakan ini tidak bisa dibatalkan. Apakah Anda yakin ingin membuang elemen data ini ke jurang ketiadaan?
          </p>
          <div className="flex gap-4 justify-end mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="font-black uppercase border-2 border-slate-900 h-14 rounded-xl px-6 hover:bg-slate-200">
              Batal
            </Button>
            <Button onClick={confirmDelete} className="bg-red-500 hover:bg-red-400 text-slate-900 font-black border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] active:shadow-none active:translate-y-1 h-14 rounded-xl px-6 uppercase transition-all">
              Musnahkan!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}