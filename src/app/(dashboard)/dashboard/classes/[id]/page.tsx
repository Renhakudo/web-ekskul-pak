'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from '@/components/ui/label'
import {
  ArrowLeft,
  ArrowRight,
  PlayCircle,
  FileText,
  Briefcase,
  Calendar,
  MessageSquare,
  Send,
  Loader2,
  Pencil,
  Trash2,
  Check,
  X,
  Compass
} from 'lucide-react'
import { Skeleton } from "@/components/ui/skeleton"
import { updateLearningStreak } from '@/lib/streak-utils'
import { awardEligibleBadges } from '@/lib/badge-utils'

interface Material { id: string; title: string; type: 'video' | 'text' | 'quiz' | 'file'; xp_reward: number; created_at: string; }
interface Assignment { id: string; title: string; description: string; due_date: string; }
interface Reply { id: string; user_id: string; content: string; created_at: string; updated_at?: string; profiles: { full_name: string; avatar_url: string; role: string } }
interface Discussion { id: string; user_id: string; title: string; content: string; created_at: string; updated_at?: string; profiles: { full_name: string; avatar_url: string; role: string }; replies: Reply[]; }
interface ClassDetail { id: string; title: string; description: string; created_by: string; materials: Material[]; assignments: Assignment[]; discussions: Discussion[]; }

export default function StudentClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()
  const router = useRouter()

  const [classData, setClassData] = useState<ClassDetail | null>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string>('siswa')

  const [activeTab, setActiveTab] = useState('materials')

  const [isDiscussOpen, setIsDiscussOpen] = useState(false)
  const [newTopicTitle, setNewTopicTitle] = useState('')
  const [newTopicContent, setNewTopicContent] = useState('')
  const [isSubmittingTopic, setIsSubmittingTopic] = useState(false)

  const [expandedTopic, setExpandedTopic] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [isReplying, setIsReplying] = useState(false)

  const [editingTopicId, setEditingTopicId] = useState<string | null>(null)
  const [editTopicTitle, setEditTopicTitle] = useState('')
  const [editTopicContent, setEditTopicContent] = useState('')

  const [editingReplyId, setEditingReplyId] = useState<string | null>(null)
  const [editReplyContent, setEditReplyContent] = useState('')

  // State untuk error inline pada forum (menggantikan native alert())
  const [forumError, setForumError] = useState<string | null>(null)

  const fetchDiscussions = useCallback(async () => {
    const { data: discussionsResult } = await supabase
      .from('discussions')
      .select(`
        *,
        profiles (full_name, avatar_url, role),
        replies (
          *,
          profiles (full_name, avatar_url, role)
        )
      `)
      .eq('class_id', id)
      .order('created_at', { ascending: false })

    const sortedDiscussions = discussionsResult?.map((d: any) => ({
      ...d,
      replies: (d.replies || []).sort((a: any, b: any) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    })) || []

    setClassData(prev => prev ? { ...prev, discussions: sortedDiscussions } : prev)
  }, [id])

  const fetchData = useCallback(async () => {
    setIsInitialLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUser(user)
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile) setCurrentUserRole(profile.role)
    }

    const [classRes, materialsRes, assignmentsRes] = await Promise.all([
      supabase.from('classes').select('*').eq('id', id).single(),
      supabase.from('materials').select('*').eq('class_id', id).order('created_at'),
      supabase.from('assignments').select('*').eq('class_id', id).order('created_at', { ascending: false }),
    ])

    const { data: discussionsResult } = await supabase
      .from('discussions')
      .select(`
         *,
         profiles (full_name, avatar_url, role),
         replies (
           *,
           profiles (full_name, avatar_url, role)
         )
       `)
      .eq('class_id', id)
      .order('created_at', { ascending: false })

    const sortedDiscussions = discussionsResult?.map((d: any) => ({
      ...d,
      replies: (d.replies || []).sort((a: any, b: any) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    })) || []

    if (classRes.data) {
      setClassData({
        ...classRes.data,
        materials: materialsRes.data || [],
        assignments: assignmentsRes.data || [],
        discussions: sortedDiscussions,
      })
    }
    setIsInitialLoading(false)
  }, [id])

  useEffect(() => {
    fetchData()

    const channel = supabase
      .channel(`class-${id}-forum`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'discussions', filter: `class_id=eq.${id}` }, () => {
        fetchDiscussions()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'replies' }, () => {
        fetchDiscussions()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, fetchData, fetchDiscussions])

  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingTopic(true)
    setForumError(null)
    const { error } = await supabase.from('discussions').insert({ class_id: id, user_id: currentUser?.id, title: newTopicTitle, content: newTopicContent })
    if (!error) {
      setNewTopicTitle('')
      setNewTopicContent('')
      setIsDiscussOpen(false)
      // Update learning streak setelah berhasil membuat topik diskusi baru
      if (currentUser?.id) {
        updateLearningStreak(currentUser.id, supabase).catch(() => { })
        // Cek dan berikan badge
        awardEligibleBadges(currentUser.id, supabase).catch(() => { })
      }
      await fetchDiscussions()
    } else {
      setForumError('Gagal membuat diskusi: ' + error.message)
    }
    setIsSubmittingTopic(false)
  }

  const handleDeleteDiscussion = async (topicId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Yakin hapus topik ini beserta balasannya?')) return
    await supabase.from('discussions').delete().eq('id', topicId)
    await fetchDiscussions()
  }

  const handleUpdateDiscussion = async (topicId: string) => {
    if (!editTopicTitle.trim() || !editTopicContent.trim()) return
    const { error } = await supabase.from('discussions').update({ title: editTopicTitle, content: editTopicContent, updated_at: new Date().toISOString() }).eq('id', topicId)
    if (!error) { setEditingTopicId(null); await fetchDiscussions() }
    else { setForumError('Gagal update diskusi: ' + error.message) }
  }

  const handleSendReply = async (discussionId: string) => {
    if (!replyContent.trim()) return
    setIsReplying(true)
    setForumError(null)
    const { error } = await supabase.from('replies').insert({ discussion_id: discussionId, user_id: currentUser?.id, content: replyContent })
    if (!error) {
      setReplyContent('')
      // Update learning streak setelah berhasil membalas diskusi
      if (currentUser?.id) {
        updateLearningStreak(currentUser.id, supabase).catch(() => { })
        // Cek dan berikan badge
        awardEligibleBadges(currentUser.id, supabase).catch(() => { })
      }
      await fetchDiscussions()
    } else {
      setForumError('Gagal mengirim pesan: ' + error.message)
    }
    setIsReplying(false)
  }

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm('Yakin hapus balasan ini?')) return
    await supabase.from('replies').delete().eq('id', replyId)
    await fetchDiscussions()
  }

  const handleUpdateReply = async (replyId: string) => {
    if (!editReplyContent.trim()) return
    const { error } = await supabase.from('replies').update({ content: editReplyContent, updated_at: new Date().toISOString() }).eq('id', replyId)
    if (!error) { setEditingReplyId(null); await fetchDiscussions() }
    else { setForumError('Gagal update balasan: ' + error.message) }
  }

  const isEdited = (created_at: string, updated_at?: string) => {
    if (!updated_at) return false
    return new Date(updated_at).getTime() - new Date(created_at).getTime() > 2000
  }

  if (isInitialLoading) return (
    <div className="p-8 max-w-5xl mx-auto space-y-4 font-sans mt-10">
      <Skeleton className="h-16 w-1/2 rounded-2xl bg-slate-300" />
      <Skeleton className="h-4 w-3/4 bg-slate-200" />
      <div className="space-y-4 mt-8">
        <Skeleton className="h-24 w-full rounded-2xl bg-slate-300" />
        <Skeleton className="h-24 w-full rounded-2xl bg-slate-300" />
      </div>
    </div>
  )

  if (!classData) return <div className="p-12 text-center font-bold text-xl text-slate-500 font-sans mt-20">Misi tidak ditemukan.</div>

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-20 font-sans">

      {/* Hero Section */}
      <div className="bg-violet-400 border-b-4 border-slate-900 shadow-[0_8px_0px_#0f172a] py-16 px-6 md:px-12 relative overflow-hidden mb-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500 rounded-full blur-[60px] opacity-60 pointer-events-none"></div>
        <div className="max-w-5xl mx-auto relative z-10">
          <Link href="/dashboard/courses" className="inline-flex items-center text-slate-900 font-bold hover:text-white bg-white/40 px-4 py-2 rounded-xl border-2 border-transparent hover:border-slate-900 transition-all mb-8 shadow-sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali Peta
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white p-3 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] transform -rotate-3">
              <Compass className="h-10 w-10 text-violet-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">{classData.title}</h1>
          </div>
          <p className="text-slate-900 font-bold text-lg max-w-2xl leading-relaxed mt-4 bg-white/40 p-4 rounded-2xl border-2 border-slate-900 italic">
            "{classData.description || "Misi ini masih misterius."}"
          </p>

          <div className="flex flex-wrap gap-4 mt-8">
            <div className="flex items-center gap-2 bg-yellow-300 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] px-4 py-2 rounded-xl"><FileText className="h-5 w-5 text-slate-900" /><span className="font-black text-slate-900">{classData.materials.length} Materi</span></div>
            <div className="flex items-center gap-2 bg-pink-300 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] px-4 py-2 rounded-xl"><Briefcase className="h-5 w-5 text-slate-900" /><span className="font-black text-slate-900">{classData.assignments.length} Tugas</span></div>
            <div className="flex items-center gap-2 bg-emerald-300 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] px-4 py-2 rounded-xl"><MessageSquare className="h-5 w-5 text-slate-900" /><span className="font-black text-slate-900">{classData.discussions.length} Diskusi</span></div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-12 relative z-20">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          <TabsList className="grid w-full grid-cols-3 mb-8 bg-slate-200/60 p-2 gap-2 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a]">
            <TabsTrigger value="materials" className="font-bold text-sm sm:text-base data-[state=active]:bg-violet-400 data-[state=active]:text-slate-900 data-[state=active]:border-2 data-[state=active]:border-slate-900 data-[state=active]:shadow-[2px_2px_0px_#0f172a] rounded-xl transition-all min-h-12 border-2 border-transparent">Materi Pokok</TabsTrigger>
            <TabsTrigger value="assignments" className="font-bold text-sm sm:text-base data-[state=active]:bg-pink-400 data-[state=active]:text-slate-900 data-[state=active]:border-2 data-[state=active]:border-slate-900 data-[state=active]:shadow-[2px_2px_0px_#0f172a] rounded-xl transition-all min-h-12 border-2 border-transparent">Tugas Kelas</TabsTrigger>
            <TabsTrigger value="discussions" className="font-bold text-sm sm:text-base data-[state=active]:bg-emerald-400 data-[state=active]:text-slate-900 data-[state=active]:border-2 data-[state=active]:border-slate-900 data-[state=active]:shadow-[2px_2px_0px_#0f172a] rounded-xl transition-all min-h-12 border-2 border-transparent">Forum Diskusi</TabsTrigger>
          </TabsList>

          <TabsContent value="materials" className="space-y-4">
            {classData.materials.length === 0 ? (
              <div className="p-16 text-center bg-white border-4 border-slate-900 border-dashed rounded-[32px] shadow-sm">
                <div className="w-20 h-20 bg-slate-100 rounded-full border-2 border-slate-300 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-10 w-10 text-slate-400" />
                </div>
                <p className="font-bold text-xl text-slate-500">Materi belum ditambahkan oleh guru kelas.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {classData.materials.map((m, index) => (
                  <div key={m.id} className="group flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-[24px] hover:-translate-y-1 hover:shadow-[4px_4px_0px_#0f172a] transition-all cursor-pointer" onClick={() => router.push(`/dashboard/classes/${id}/materials/${m.id}`)}>
                    <div className={`h-16 w-16 shrink-0 rounded-2xl flex items-center justify-center border-4 border-slate-900 shadow-[2px_2px_0px_#0f172a] transform group-hover:rotate-12 transition-transform ${m.type === 'video' ? 'bg-orange-300 text-slate-900' : 'bg-blue-300 text-slate-900'}`}>
                      {m.type === 'video' ? <PlayCircle className="h-8 w-8" /> : <FileText className="h-8 w-8" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-black text-violet-600 tracking-wider">MODUL {index + 1}</span>
                      <h3 className="text-xl md:text-2xl font-black text-slate-900 truncate my-1 leading-tight">{m.title}</h3>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0 justify-between sm:justify-end">
                      <Badge className="bg-yellow-300 text-slate-900 font-black text-base border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] px-3 py-1">+{m.xp_reward} XP</Badge>
                      <div className="h-10 w-10 bg-slate-100 rounded-full border-2 border-slate-900 flex items-center justify-center text-slate-900 group-hover:bg-violet-400 transition-colors">
                        <ArrowRight className="h-5 w-5 transform -rotate-45 group-hover:rotate-0 transition-transform" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            {classData.assignments.length === 0 ? (
              <div className="p-16 text-center bg-white border-4 border-slate-900 border-dashed rounded-[32px] shadow-sm">
                <div className="w-20 h-20 bg-slate-100 rounded-full border-2 border-slate-300 flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-10 w-10 text-slate-400" />
                </div>
                <p className="font-bold text-xl text-slate-500">Belum ada tugas yang diberikan di kelas ini.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {classData.assignments.map((a) => (
                  <div key={a.id} className="group flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-[24px] hover:-translate-y-1 hover:shadow-[4px_4px_0px_#0f172a] transition-all cursor-pointer" onClick={() => router.push(`/dashboard/classes/${id}/assignments/${a.id}`)}>
                    <div className="h-16 w-16 shrink-0 rounded-2xl bg-pink-300 border-4 border-slate-900 shadow-[2px_2px_0px_#0f172a] flex items-center justify-center transform group-hover:-rotate-12 transition-transform">
                      <Briefcase className="h-8 w-8 text-slate-900" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl md:text-2xl font-black text-slate-900 truncate my-1">{a.title}</h3>
                      <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg border-2 border-slate-200 inline-flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" /> {a.due_date ? new Date(a.due_date).toLocaleDateString() : 'Tanpa Tenggat Waktu'}
                      </span>
                    </div>
                    <Button className="w-full sm:w-auto mt-4 sm:mt-0 bg-pink-500 hover:bg-pink-400 text-slate-900 font-black border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]">
                      Mulai Kerjakan <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="discussions" className="space-y-6">

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-emerald-100 border-4 border-slate-900 p-6 md:p-8 rounded-[32px] shadow-[6px_6px_0px_#0f172a]">
              <div>
                <h3 className="font-black text-slate-900 text-2xl flex items-center gap-2"><MessageSquare className="h-6 w-6 text-emerald-600" /> Forum Diskusi</h3>
                <p className="text-base font-bold text-slate-600 mt-1">Gunakan forum ini untuk bertanya seputar materi.</p>
              </div>

              <Dialog open={isDiscussOpen} onOpenChange={setIsDiscussOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black h-12 px-6 rounded-xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:translate-y-1 hover:shadow-[2px_2px_0px_#0f172a] transition-all whitespace-nowrap">
                    <Pencil className="mr-2 h-5 w-5" /> Buat Topik Baru
                  </Button>
                </DialogTrigger>
                <DialogContent className="border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[24px]">
                  <DialogHeader><DialogTitle className="font-black text-2xl text-slate-900">Ada pertanyaan?</DialogTitle></DialogHeader>
                  <form onSubmit={handleCreateDiscussion} className="space-y-4 mt-2">
                    <div className="space-y-2">
                      <Label className="font-black">Judul Diskusi</Label>
                      <Input value={newTopicTitle} onChange={e => setNewTopicTitle(e.target.value)} placeholder="Misal: Saya bingung tentang perulangan" className="h-12 border-2 border-slate-900 font-medium" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black">Detail Pertanyaan</Label>
                      <Textarea className="min-h-[140px] border-2 border-slate-900 font-medium resize-none" value={newTopicContent} onChange={e => setNewTopicContent(e.target.value)} placeholder="Tuliskan detail pertanyaan atau masalahmu di sini..." required />
                    </div>
                    <Button type="submit" className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]" disabled={isSubmittingTopic}>
                      {isSubmittingTopic ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : "Kirim Diskusi"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {classData.discussions.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-[32px] border-4 border-dashed border-slate-300">
                <MessageSquare className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="font-black text-xl text-slate-400">Belum ada obrolan di kelas ini.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {classData.discussions.map((topic) => {
                  const isTopicOwner = currentUser?.id === topic.user_id;
                  const canDeleteTopic = isTopicOwner || currentUserRole === 'guru' || currentUserRole === 'admin';

                  return (
                    <Card key={topic.id} className="border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-[24px] overflow-hidden bg-white">
                      <div
                        className="p-6 cursor-pointer hover:bg-emerald-50 transition-colors group"
                        onClick={() => { if (editingTopicId !== topic.id) setExpandedTopic(expandedTopic === topic.id ? null : topic.id) }}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex gap-4 w-full items-start">
                            <Avatar className="h-12 w-12 border-2 border-slate-900 shadow-sm shrink-0">
                              <AvatarImage src={topic.profiles?.avatar_url} />
                              <AvatarFallback className="font-black text-lg bg-orange-200">{topic.profiles?.full_name?.[0]}</AvatarFallback>
                            </Avatar>

                            <div className="flex-1">
                              {editingTopicId === topic.id ? (
                                <div className="space-y-3 mt-1" onClick={e => e.stopPropagation()}>
                                  <Input value={editTopicTitle} onChange={e => setEditTopicTitle(e.target.value)} className="font-black border-2 border-slate-900" />
                                  <Textarea value={editTopicContent} onChange={e => setEditTopicContent(e.target.value)} className="font-medium min-h-[100px] border-2 border-slate-900 resize-none" />
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={() => handleUpdateDiscussion(topic.id)} className="bg-emerald-500 text-slate-900 font-bold border-2 border-slate-900"><Check className="w-4 h-4 mr-1" /> Simpan</Button>
                                    <Button size="sm" variant="outline" onClick={() => setEditingTopicId(null)} className="font-bold border-2 border-slate-900"><X className="w-4 h-4 mr-1" /> Batal</Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <h4 className="font-black text-slate-900 text-xl leading-tight group-hover:text-emerald-700 transition-colors">{topic.title}</h4>
                                  <div className="flex items-center flex-wrap gap-2 text-xs font-bold text-slate-500 mt-2">
                                    <span className="text-violet-600">{topic.profiles?.full_name}</span>
                                    <span>•</span>
                                    <span>{new Date(topic.created_at).toLocaleDateString()}</span>
                                    {isEdited(topic.created_at, topic.updated_at) && <span className="text-slate-400 italic">(Diedit)</span>}
                                    {topic.profiles?.role === 'guru' && <Badge className="text-[10px] h-4 border-2 border-slate-900 text-slate-900 bg-yellow-300 ml-1">Master</Badge>}
                                  </div>
                                  <p className="mt-3 text-slate-700 text-base font-medium whitespace-pre-wrap leading-relaxed">{topic.content}</p>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-3 shrink-0">
                            <Badge className="bg-slate-100 border-2 border-slate-900 text-slate-900 font-black flex items-center gap-1 shadow-[2px_2px_0px_#0f172a] px-3">
                              <MessageSquare className="h-4 w-4" /> {topic.replies?.length || 0}
                            </Badge>
                            {canDeleteTopic && editingTopicId !== topic.id && (
                              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                {isTopicOwner && (
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-blue-100 hover:text-blue-700 border-2 border-transparent hover:border-blue-700 rounded-lg transition-all" onClick={() => { setEditTopicTitle(topic.title); setEditTopicContent(topic.content); setEditingTopicId(topic.id) }}><Pencil className="h-4 w-4" /></Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-red-100 hover:text-red-700 border-2 border-transparent hover:border-red-700 rounded-lg transition-all" onClick={(e) => handleDeleteDiscussion(topic.id, e)}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {expandedTopic === topic.id && (
                        <div className="bg-slate-50 border-t-4 border-slate-900 p-6 pt-4">

                          <div className="space-y-4 mb-6">
                            {topic.replies && topic.replies.length > 0 ? (
                              topic.replies.map((reply) => {
                                const isReplyOwner = currentUser?.id === reply.user_id;
                                const canDeleteReply = isReplyOwner || currentUserRole === 'guru' || currentUserRole === 'admin';

                                return (
                                  <div key={reply.id} className="bg-white p-5 rounded-2xl border-2 border-slate-900 shadow-sm flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                      <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8 border-2 border-slate-900"><AvatarImage src={reply.profiles?.avatar_url} /><AvatarFallback className="bg-violet-200 font-bold">{reply.profiles?.full_name?.[0]}</AvatarFallback></Avatar>
                                        <div className="flex flex-row items-center gap-2 flex-wrap">
                                          <span className="font-black text-sm text-slate-900">{reply.profiles?.full_name}</span>
                                          {reply.profiles?.role === 'guru' && <Badge className="text-[10px] h-4 bg-yellow-300 text-slate-900 border-2 border-slate-900 px-1.5 font-black hidden sm:inline-flex">Master</Badge>}
                                          <span className="text-xs font-bold text-slate-400 hidden sm:inline-block">• {new Date(reply.created_at).toLocaleString()}</span>
                                        </div>
                                      </div>

                                      {canDeleteReply && editingReplyId !== reply.id && (
                                        <div className="flex gap-1 shrink-0">
                                          {isReplyOwner && (
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-700" onClick={() => { setEditReplyContent(reply.content); setEditingReplyId(reply.id) }}><Pencil className="h-3 w-3" /></Button>
                                          )}
                                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-700" onClick={() => handleDeleteReply(reply.id)}><Trash2 className="h-3 w-3" /></Button>
                                        </div>
                                      )}
                                    </div>

                                    {editingReplyId === reply.id ? (
                                      <div className="ml-0 sm:ml-11 mt-2 space-y-3">
                                        <Textarea value={editReplyContent} onChange={(e) => setEditReplyContent(e.target.value)} className="text-sm min-h-[80px] font-medium border-2 border-slate-900" />
                                        <div className="flex gap-2">
                                          <Button size="sm" className="bg-emerald-500 text-slate-900 font-bold border-2 border-slate-900" onClick={() => handleUpdateReply(reply.id)}>Simpan</Button>
                                          <Button size="sm" variant="outline" className="font-bold border-2 border-slate-900" onClick={() => setEditingReplyId(null)}>Batal</Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-base font-medium text-slate-700 sm:ml-11 whitespace-pre-wrap">{reply.content}</p>
                                    )}
                                  </div>
                                )
                              })
                            ) : (
                              <p className="text-base font-bold text-slate-400 italic text-center py-4 bg-white border-2 border-slate-200 border-dashed rounded-2xl">Belum ada penyuluh di sini.</p>
                            )}
                          </div>

                          <div className="flex gap-3 relative bg-emerald-100 p-4 rounded-2xl border-2 border-slate-900">
                            <Avatar className="h-10 w-10 border-2 border-slate-900 hidden sm:block shrink-0"><AvatarImage src={currentUser?.user_metadata?.avatar_url} /><AvatarFallback className="bg-slate-300 font-black">U</AvatarFallback></Avatar>
                            <div className="flex-1 relative w-full">
                              <Textarea
                                className="min-h-[60px] bg-white border-2 border-slate-900 font-medium resize-none pr-14 py-3 focus-visible:ring-0 focus:shadow-[2px_2px_0px_#0f172a] rounded-xl"
                                placeholder="Ketik balasan komentarmu..."
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                              />
                              <Button
                                size="icon"
                                className="absolute bottom-2 right-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 border-2 border-slate-900 shadow-sm h-10 w-10 shrink-0"
                                onClick={() => handleSendReply(topic.id)}
                                disabled={isReplying || !replyContent.trim()}
                              >
                                {isReplying ? <Loader2 className="animate-spin h-5 w-5" /> : <Send className="h-5 w-5" />}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

        </Tabs>
      </div>
    </div>
  )
}