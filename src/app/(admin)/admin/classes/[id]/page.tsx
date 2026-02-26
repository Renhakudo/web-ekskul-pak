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
import { ArrowLeft, Plus, FileText, Video, Trash2, Loader2, Briefcase, Calendar, Pencil, HelpCircle, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// Interface
interface Material {
  id: string
  title: string
  type: 'video' | 'text' | 'quiz' | 'file'
  content?: string
  youtube_url?: string
  xp_reward: number
}

interface Assignment {
  id: string
  title: string
  description: string
  due_date: string
}

export default function ClassAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()

  // Data State
  const [classData, setClassData] = useState<any>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Form States (Create)
  const [isMatOpen, setIsMatOpen] = useState(false)
  const [isAssOpen, setIsAssOpen] = useState(false)
  const [isQuizOpen, setIsQuizOpen] = useState(false)

  // Quiz form state
  const [qzTitle, setQzTitle] = useState('')
  const [qzTimeLimit, setQzTimeLimit] = useState(600)
  const [qzXP, setQzXP] = useState(100)

  // Form States (Edit)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Input States (Shared for Create & Edit)
  // Kita pakai state terpisah biar ga bingung
  const [mTitle, setMTitle] = useState('')
  const [mType, setMType] = useState('text')
  const [mContent, setMContent] = useState('')

  const [aTitle, setATitle] = useState('')
  const [aDesc, setADesc] = useState('')
  const [aDueDate, setADueDate] = useState('')

  // FETCH DATA
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

  // --- HANDLERS CREATE ---

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true)
    const payload: any = { class_id: id, title: mTitle, type: mType, xp_reward: 50 }
    if (mType === 'video') payload.youtube_url = mContent; else payload.content = mContent;

    const { error } = await supabase.from('materials').insert(payload)
    if (!error) { setIsMatOpen(false); resetForms(); fetchData() }
    setIsSubmitting(false)
  }

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true)
    const { error } = await supabase.from('assignments').insert({
      class_id: id,
      title: aTitle,
      description: aDesc,
      due_date: aDueDate ? new Date(aDueDate).toISOString() : null
    })
    if (!error) { setIsAssOpen(false); resetForms(); fetchData() }
    setIsSubmitting(false)
  }

  // --- HANDLERS EDIT ---

  // 1. Klik Tombol Edit Materi -> Isi Form
  const openEditMaterial = (m: Material) => {
    setEditingMaterial(m)
    setMTitle(m.title)
    setMType(m.type)
    setMContent(m.type === 'video' ? m.youtube_url || '' : m.content || '')
  }

  // 2. Simpan Perubahan Materi
  const handleUpdateMaterial = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true)
    const payload: any = { title: mTitle, type: mType }
    if (mType === 'video') {
      payload.youtube_url = mContent
      payload.content = null
    } else {
      payload.content = mContent
      payload.youtube_url = null
    }

    const { error } = await supabase.from('materials').update(payload).eq('id', editingMaterial?.id)
    if (!error) { setEditingMaterial(null); resetForms(); fetchData() }
    setIsSubmitting(false)
  }

  // 3. Klik Tombol Edit Tugas -> Isi Form
  const openEditAssignment = (a: Assignment) => {
    setEditingAssignment(a)
    setATitle(a.title)
    setADesc(a.description)
    // Format date untuk input datetime-local: YYYY-MM-DDTHH:mm
    const dateStr = a.due_date ? new Date(a.due_date).toISOString().slice(0, 16) : ''
    setADueDate(dateStr)
  }

  // 4. Simpan Perubahan Tugas
  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true)
    const { error } = await supabase.from('assignments').update({
      title: aTitle,
      description: aDesc,
      due_date: aDueDate ? new Date(aDueDate).toISOString() : null
    }).eq('id', editingAssignment?.id)

    if (!error) { setEditingAssignment(null); resetForms(); fetchData() }
    setIsSubmitting(false)
  }

  // --- DELETE & RESET ---

  const handleDelete = async (table: 'materials' | 'assignments' | 'quizzes', itemId: string) => {
    if (!confirm("Hapus item ini?")) return;
    await supabase.from(table).delete().eq('id', itemId)
    fetchData()
  }

  const handleAddQuiz = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true)
    const { error } = await supabase.from('quizzes').insert({
      class_id: id,
      title: qzTitle,
      time_limit_seconds: qzTimeLimit,
      xp_reward: qzXP,
    })
    if (!error) { setIsQuizOpen(false); setQzTitle(''); setQzTimeLimit(600); setQzXP(100); fetchData() }
    setIsSubmitting(false)
  }

  const resetForms = () => {
    setMTitle(''); setMType('text'); setMContent('');
    setATitle(''); setADesc(''); setADueDate('');
  }

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/classes">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{classData?.title}</h1>
          <p className="text-slate-500 text-sm">Kelola materi dan tugas kelas.</p>
        </div>
      </div>

      <Tabs defaultValue="materials" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="materials">Materi Belajar</TabsTrigger>
          <TabsTrigger value="assignments">Tugas & PR</TabsTrigger>
          <TabsTrigger value="quizzes">Quiz</TabsTrigger>
        </TabsList>

        {/* TAB 1: MATERI */}
        <TabsContent value="materials" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Daftar Materi</h3>
            {/* Create Dialog */}
            <Dialog open={isMatOpen} onOpenChange={setIsMatOpen}>
              <DialogTrigger asChild><Button className="bg-violet-600"><Plus className="mr-2 h-4 w-4" /> Tambah Materi</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Tambah Materi</DialogTitle></DialogHeader>
                <form onSubmit={handleAddMaterial} className="space-y-4 mt-4">
                  <div className="space-y-2"><Label>Judul</Label><Input value={mTitle} onChange={e => setMTitle(e.target.value)} required /></div>
                  <div className="space-y-2"><Label>Tipe</Label>
                    <Select value={mType} onValueChange={setMType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="text">Teks</SelectItem><SelectItem value="video">Video</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Isi / Link</Label><Textarea value={mContent} onChange={e => setMContent(e.target.value)} /></div>
                  <Button type="submit" className="w-full bg-violet-600" disabled={isSubmitting}>Simpan</Button>
                </form>
              </DialogContent>
            </Dialog>

            {/* Edit Dialog (Hidden logic, controlled by state) */}
            <Dialog open={!!editingMaterial} onOpenChange={(open) => !open && setEditingMaterial(null)}>
              <DialogContent>
                <DialogHeader><DialogTitle>Edit Materi</DialogTitle></DialogHeader>
                <form onSubmit={handleUpdateMaterial} className="space-y-4 mt-4">
                  <div className="space-y-2"><Label>Judul</Label><Input value={mTitle} onChange={e => setMTitle(e.target.value)} required /></div>
                  <div className="space-y-2"><Label>Tipe</Label>
                    <Select value={mType} onValueChange={setMType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="text">Teks</SelectItem><SelectItem value="video">Video</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Isi / Link</Label><Textarea value={mContent} onChange={e => setMContent(e.target.value)} /></div>
                  <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={isSubmitting}>Update Perubahan</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {materials.map((m, idx) => (
            <Card key={m.id} className="group hover:border-violet-300 transition-all">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">{idx + 1}</div>
                  <div>
                    <h4 className="font-medium text-slate-900 flex items-center gap-2">
                      {m.title} {m.type === 'video' ? <Video className="h-3 w-3 text-red-500" /> : <FileText className="h-3 w-3 text-blue-500" />}
                    </h4>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="text-orange-400 hover:text-orange-600" onClick={() => openEditMaterial(m)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600" onClick={() => handleDelete('materials', m.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* TAB 2: TUGAS */}
        <TabsContent value="assignments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Daftar Tugas</h3>

            {/* Create Dialog */}
            <Dialog open={isAssOpen} onOpenChange={setIsAssOpen}>
              <DialogTrigger asChild><Button className="bg-pink-600 hover:bg-pink-700"><Plus className="mr-2 h-4 w-4" /> Buat Tugas</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Buat Tugas Baru</DialogTitle></DialogHeader>
                <form onSubmit={handleAddAssignment} className="space-y-4 mt-4">
                  <div className="space-y-2"><Label>Judul Tugas</Label><Input value={aTitle} onChange={e => setATitle(e.target.value)} required /></div>
                  <div className="space-y-2"><Label>Deskripsi / Soal</Label><Textarea value={aDesc} onChange={e => setADesc(e.target.value)} required placeholder="Jelaskan detail tugas di sini..." /></div>
                  <div className="space-y-2"><Label>Tenggat Waktu (Deadline)</Label><Input type="datetime-local" value={aDueDate} onChange={e => setADueDate(e.target.value)} /></div>
                  <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700" disabled={isSubmitting}>Terbitkan Tugas</Button>
                </form>
              </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editingAssignment} onOpenChange={(open) => !open && setEditingAssignment(null)}>
              <DialogContent>
                <DialogHeader><DialogTitle>Edit Tugas</DialogTitle></DialogHeader>
                <form onSubmit={handleUpdateAssignment} className="space-y-4 mt-4">
                  <div className="space-y-2"><Label>Judul Tugas</Label><Input value={aTitle} onChange={e => setATitle(e.target.value)} required /></div>
                  <div className="space-y-2"><Label>Deskripsi / Soal</Label><Textarea value={aDesc} onChange={e => setADesc(e.target.value)} required /></div>
                  <div className="space-y-2"><Label>Tenggat Waktu (Deadline)</Label><Input type="datetime-local" value={aDueDate} onChange={e => setADueDate(e.target.value)} /></div>
                  <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={isSubmitting}>Update Tugas</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {assignments.length === 0 ? (
            <div className="text-center py-10 border border-dashed rounded-xl bg-slate-50">Belum ada tugas.</div>
          ) : (
            assignments.map((a, idx) => (
              <Card key={a.id} className="group hover:border-pink-300 transition-all">
                <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold"><Briefcase className="h-5 w-5" /></div>
                    <div>
                      <h4 className="font-medium text-slate-900">{a.title}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Deadline: {a.due_date ? new Date(a.due_date).toLocaleDateString() : 'Tanpa Batas'}
                      </p>
                    </div>
                  </div>

                  {/* BUTTON ACTIONS */}
                  <div className="flex gap-2 w-full md:w-auto">
                    {/* TOMBOL BARU: PERIKSA / NILAI */}
                    <Link href={`/admin/classes/${id}/assignments/${a.id}`} className="w-full md:w-auto">
                      <Button variant="outline" size="sm" className="w-full border-violet-200 text-violet-700 hover:bg-violet-50">
                        Periksa & Nilai
                      </Button>
                    </Link>

                    <Button variant="ghost" size="icon" className="text-orange-400 hover:text-orange-600" onClick={() => openEditAssignment(a)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600" onClick={() => handleDelete('assignments', a.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* TAB 3: QUIZ */}
        <TabsContent value="quizzes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Daftar Quiz</h3>
            <Dialog open={isQuizOpen} onOpenChange={setIsQuizOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="mr-2 h-4 w-4" /> Buat Quiz
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Buat Quiz Baru</DialogTitle></DialogHeader>
                <form onSubmit={handleAddQuiz} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Judul Quiz</Label>
                    <Input value={qzTitle} onChange={e => setQzTitle(e.target.value)} required placeholder="misal: Quiz Minggu 1" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Batas Waktu (detik)</Label>
                      <Input type="number" value={qzTimeLimit} onChange={e => setQzTimeLimit(Number(e.target.value))} min={60} step={60} />
                      <p className="text-xs text-slate-400">{Math.floor(qzTimeLimit / 60)} menit</p>
                    </div>
                    <div className="space-y-2">
                      <Label>XP Reward</Label>
                      <Input type="number" value={qzXP} onChange={e => setQzXP(Number(e.target.value))} min={10} step={10} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>Buat Quiz</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {quizzes.length === 0 ? (
            <div className="text-center py-10 border border-dashed rounded-xl bg-slate-50">
              <HelpCircle className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500">Belum ada quiz. Buat quiz pertama!</p>
            </div>
          ) : (
            quizzes.map((qz) => {
              const questionCount = qz.quiz_questions?.[0]?.count ?? 0
              return (
                <Card key={qz.id} className="group hover:border-emerald-300 transition-all">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <HelpCircle className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{qz.title}</h4>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {Math.floor(qz.time_limit_seconds / 60)} menit
                          </span>
                          <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200">
                            +{qz.xp_reward} XP
                          </Badge>
                          <Badge variant="outline" className="text-[10px] text-slate-500">
                            {questionCount} soal
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/admin/classes/${id}/quiz/${qz.id}/questions`}>
                        <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                          <Pencil className="h-3 w-3 mr-1" /> Kelola Soal
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600" onClick={() => handleDelete('quizzes', qz.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}