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
  PlayCircle,
  FileText,
  Briefcase,
  Calendar,
  MessageSquare,
  Send,
  Loader2,
  Pencil, // Icon edit
  Trash2, // Icon hapus
  Check,
  X
} from 'lucide-react'
import { Skeleton } from "@/components/ui/skeleton"

// --- Interfaces ---
interface Material { id: string; title: string; type: 'video' | 'text' | 'quiz' | 'file'; xp_reward: number; created_at: string; }
interface Assignment { id: string; title: string; description: string; due_date: string; }
// Tambahkan updated_at
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
  const [currentUserRole, setCurrentUserRole] = useState<string>('siswa') // State untuk menyimpan Role

  const [activeTab, setActiveTab] = useState('materials')

  const [isDiscussOpen, setIsDiscussOpen] = useState(false)
  const [newTopicTitle, setNewTopicTitle] = useState('')
  const [newTopicContent, setNewTopicContent] = useState('')
  const [isSubmittingTopic, setIsSubmittingTopic] = useState(false)

  const [expandedTopic, setExpandedTopic] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [isReplying, setIsReplying] = useState(false)

  // STATE UNTUK EDITING
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null)
  const [editTopicTitle, setEditTopicTitle] = useState('')
  const [editTopicContent, setEditTopicContent] = useState('')

  const [editingReplyId, setEditingReplyId] = useState<string | null>(null)
  const [editReplyContent, setEditReplyContent] = useState('')

  // Fetch hanya diskusi (dipanggil oleh Realtime listener)
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

  // Fetch semua data (hanya sekali saat mount)
  const fetchData = useCallback(async () => {
    setIsInitialLoading(true)

    // Fetch user + role sekali saja
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUser(user)
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile) setCurrentUserRole(profile.role)
    }

    // Fetch data statis kelas, materi, tugas secara paralel (tidak butuh realtime)
    const [classRes, materialsRes, assignmentsRes] = await Promise.all([
      supabase.from('classes').select('*').eq('id', id).single(),
      supabase.from('materials').select('*').eq('class_id', id).order('created_at'),
      supabase.from('assignments').select('*').eq('class_id', id).order('created_at', { ascending: false }),
    ])

    // Fetch diskusi awal
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

    // Ganti polling 3s dengan Supabase Realtime Subscription
    // Hanya subscribe ke tabel diskusi & balasan — jauh lebih efisien
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

  // --- HANDLER TOPIK (CREATE, UPDATE, DELETE) ---
  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingTopic(true)
    const { error } = await supabase.from('discussions').insert({ class_id: id, user_id: currentUser?.id, title: newTopicTitle, content: newTopicContent })
    if (!error) { setNewTopicTitle(''); setNewTopicContent(''); setIsDiscussOpen(false); await fetchDiscussions() }
    else { alert("Gagal membuat diskusi: " + error.message) }
    setIsSubmittingTopic(false)
  }

  const handleDeleteDiscussion = async (topicId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Yakin ingin menghapus topik diskusi ini? Semua balasan akan ikut terhapus.')) return
    await supabase.from('discussions').delete().eq('id', topicId)
    await fetchDiscussions()
  }

  const handleUpdateDiscussion = async (topicId: string) => {
    if (!editTopicTitle.trim() || !editTopicContent.trim()) return
    const { error } = await supabase.from('discussions').update({ title: editTopicTitle, content: editTopicContent, updated_at: new Date().toISOString() }).eq('id', topicId)
    if (!error) { setEditingTopicId(null); await fetchDiscussions() }
    else { alert("Gagal update diskusi: " + error.message) }
  }

  // --- HANDLER BALASAN (CREATE, UPDATE, DELETE) ---
  const handleSendReply = async (discussionId: string) => {
    if (!replyContent.trim()) return
    setIsReplying(true)
    const { error } = await supabase.from('replies').insert({ discussion_id: discussionId, user_id: currentUser?.id, content: replyContent })
    if (!error) { setReplyContent(''); await fetchDiscussions() }
    else { alert("Gagal mengirim balasan: " + error.message) }
    setIsReplying(false)
  }

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm('Yakin ingin menghapus balasan ini?')) return
    await supabase.from('replies').delete().eq('id', replyId)
    await fetchDiscussions()
  }

  const handleUpdateReply = async (replyId: string) => {
    if (!editReplyContent.trim()) return
    const { error } = await supabase.from('replies').update({ content: editReplyContent, updated_at: new Date().toISOString() }).eq('id', replyId)
    if (!error) { setEditingReplyId(null); await fetchDiscussions() }
    else { alert("Gagal update balasan: " + error.message) }
  }

  // Fungsi utilitas cek apakah pesan diedit (beda lebih dari 2 detik)
  const isEdited = (created_at: string, updated_at?: string) => {
    if (!updated_at) return false
    return new Date(updated_at).getTime() - new Date(created_at).getTime() > 2000
  }

  if (isInitialLoading) return (
    <div className="p-8 max-w-5xl mx-auto space-y-4">
      <Skeleton className="h-12 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <div className="space-y-2 mt-8"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
    </div>
  )

  if (!classData) return <div className="p-12 text-center">Kelas tidak ditemukan.</div>

  return (
    <div className="min-h-screen bg-slate-50 pb-20">

      <div className="bg-slate-900 text-white py-12 px-6 md:px-12 relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10">
          <Link href="/dashboard/courses" className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar Kelas
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">{classData.title}</h1>
          <p className="text-slate-300 text-lg max-w-2xl leading-relaxed">{classData.description || "Tidak ada deskripsi untuk kelas ini."}</p>

          <div className="flex flex-wrap gap-4 mt-8">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/5"><FileText className="h-4 w-4 text-cyan-400" /><span className="text-sm font-medium">{classData.materials.length} Materi</span></div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/5"><Briefcase className="h-4 w-4 text-pink-400" /><span className="text-sm font-medium">{classData.assignments.length} Tugas</span></div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/5"><MessageSquare className="h-4 w-4 text-emerald-400" /><span className="text-sm font-medium">{classData.discussions.length} Diskusi</span></div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-12 -mt-8 relative z-20">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          <TabsList className="grid w-full md:w-[600px] grid-cols-3 mb-4 bg-white/90 backdrop-blur shadow-sm p-1 border border-slate-200">
            <TabsTrigger value="materials">Materi Belajar</TabsTrigger>
            <TabsTrigger value="assignments">Tugas & PR</TabsTrigger>
            <TabsTrigger value="discussions">Forum Diskusi</TabsTrigger>
          </TabsList>

          <TabsContent value="materials">
            <Card className="shadow-xl border-slate-200/60">
              <CardContent className="p-0 bg-white rounded-xl">
                {classData.materials.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">Belum ada materi.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {classData.materials.map((m, index) => (
                      <div key={m.id} className="group flex items-center gap-4 p-5 hover:bg-slate-50 cursor-pointer" onClick={() => router.push(`/dashboard/classes/${id}/materials/${m.id}`)}>
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${m.type === 'video' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                          {m.type === 'video' ? <PlayCircle className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-slate-400 uppercase">Modul {index + 1}</span>
                          <h3 className="text-lg font-semibold text-slate-900 truncate">{m.title}</h3>
                        </div>
                        <Badge variant="secondary" className="bg-violet-100 text-violet-700">+{m.xp_reward} XP</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments">
            <Card className="shadow-xl border-slate-200/60">
              <CardContent className="p-0 bg-white rounded-xl">
                {classData.assignments.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">Hore! Tidak ada tugas saat ini.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {classData.assignments.map((a) => (
                      <div key={a.id} className="group flex items-center gap-4 p-5 hover:bg-slate-50 cursor-pointer" onClick={() => router.push(`/dashboard/classes/${id}/assignments/${a.id}`)}>
                        <div className="h-12 w-12 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center"><Briefcase className="h-6 w-6" /></div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-slate-900 truncate">{a.title}</h3>
                          <span className="text-sm text-slate-500 flex items-center gap-1 mt-1"><Calendar className="h-3 w-3" /> {a.due_date ? new Date(a.due_date).toLocaleDateString() : 'Tanpa Deadline'}</span>
                        </div>
                        <Button size="sm" variant="outline" className="border-pink-200 text-pink-700">Buka Tugas</Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discussions" className="space-y-4">

            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Ruang Tanya Jawab</h3>
                <p className="text-sm text-slate-500">Ada kendala? Tanyakan di sini.</p>
              </div>

              <Dialog open={isDiscussOpen} onOpenChange={setIsDiscussOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700"><MessageSquare className="mr-2 h-4 w-4" /> Buat Topik</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Mulai Diskusi Baru</DialogTitle></DialogHeader>
                  <form onSubmit={handleCreateDiscussion} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Judul / Inti Pertanyaan</Label>
                      <Input value={newTopicTitle} onChange={e => setNewTopicTitle(e.target.value)} placeholder="Contoh: Error saat install React" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Detail Lengkap</Label>
                      <Textarea className="min-h-[120px]" value={newTopicContent} onChange={e => setNewTopicContent(e.target.value)} placeholder="Jelaskan detailnya..." required />
                    </div>
                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isSubmittingTopic}>
                      {isSubmittingTopic ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Posting Pertanyaan"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {classData.discussions.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Belum ada diskusi. Jadilah yang pertama bertanya!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {classData.discussions.map((topic) => {
                  const isTopicOwner = currentUser?.id === topic.user_id;
                  const canDeleteTopic = isTopicOwner || currentUserRole === 'guru' || currentUserRole === 'admin';

                  return (
                    <Card key={topic.id} className="border-slate-200 shadow-sm overflow-hidden">
                      <div
                        className="p-5 cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => { if (editingTopicId !== topic.id) setExpandedTopic(expandedTopic === topic.id ? null : topic.id) }}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex gap-3 w-full">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={topic.profiles?.avatar_url} />
                              <AvatarFallback>{topic.profiles?.full_name?.[0]}</AvatarFallback>
                            </Avatar>

                            <div className="flex-1">
                              {/* EDIT MODE TOPIK */}
                              {editingTopicId === topic.id ? (
                                <div className="space-y-2 mt-1" onClick={e => e.stopPropagation()}>
                                  <Input value={editTopicTitle} onChange={e => setEditTopicTitle(e.target.value)} className="font-bold" />
                                  <Textarea value={editTopicContent} onChange={e => setEditTopicContent(e.target.value)} className="text-sm min-h-[80px]" />
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={() => handleUpdateDiscussion(topic.id)} className="bg-emerald-600 h-8"><Check className="w-4 h-4 mr-1" /> Simpan</Button>
                                    <Button size="sm" variant="outline" onClick={() => setEditingTopicId(null)} className="h-8"><X className="w-4 h-4 mr-1" /> Batal</Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <h4 className="font-bold text-slate-900 text-lg leading-tight">{topic.title}</h4>
                                  <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 mt-1">
                                    <span className="font-medium text-violet-600">{topic.profiles?.full_name}</span>
                                    <span>•</span>
                                    <span>{new Date(topic.created_at).toLocaleDateString()}</span>
                                    {isEdited(topic.created_at, topic.updated_at) && <span className="text-slate-400 italic">(diedit)</span>}
                                    {topic.profiles?.role === 'guru' && <Badge variant="outline" className="text-[10px] h-4 border-violet-200 text-violet-600 bg-violet-50">Guru</Badge>}
                                  </div>
                                  <p className="mt-3 text-slate-700 text-sm whitespace-pre-wrap">{topic.content}</p>
                                </>
                              )}
                            </div>
                          </div>

                          {/* ACTION BUTTONS TOPIK */}
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" /> {topic.replies?.length || 0}
                            </Badge>
                            {canDeleteTopic && editingTopicId !== topic.id && (
                              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                {isTopicOwner && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-600" onClick={() => { setEditTopicTitle(topic.title); setEditTopicContent(topic.content); setEditingTopicId(topic.id) }}><Pencil className="h-3 w-3" /></Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600" onClick={(e) => handleDeleteDiscussion(topic.id, e)}><Trash2 className="h-3 w-3" /></Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {expandedTopic === topic.id && (
                        <div className="bg-slate-50 border-t border-slate-100 p-5">
                          <h5 className="font-semibold text-sm text-slate-900 mb-4 flex items-center gap-2">Komentar & Balasan</h5>

                          <div className="space-y-4 mb-6 pl-4 border-l-2 border-slate-200">
                            {topic.replies && topic.replies.length > 0 ? (
                              topic.replies.map((reply) => {
                                const isReplyOwner = currentUser?.id === reply.user_id;
                                const canDeleteReply = isReplyOwner || currentUserRole === 'guru' || currentUserRole === 'admin';

                                return (
                                  <div key={reply.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 group animate-in fade-in slide-in-from-top-1 duration-300">
                                    <div className="flex justify-between items-start">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Avatar className="h-6 w-6"><AvatarImage src={reply.profiles?.avatar_url} /><AvatarFallback>{reply.profiles?.full_name?.[0]}</AvatarFallback></Avatar>
                                        <span className="font-semibold text-xs text-slate-800">{reply.profiles?.full_name}</span>
                                        <span className="text-[10px] text-slate-400">{new Date(reply.created_at).toLocaleString()}</span>
                                        {isEdited(reply.created_at, reply.updated_at) && <span className="text-[10px] text-slate-400 italic">(diedit)</span>}
                                        {reply.profiles?.role === 'guru' && <Badge className="text-[9px] h-3 px-1 bg-violet-600 text-white">Guru</Badge>}
                                      </div>

                                      {/* ACTION BUTTONS BALASAN */}
                                      {canDeleteReply && editingReplyId !== reply.id && (
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          {isReplyOwner && (
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-blue-600" onClick={() => { setEditReplyContent(reply.content); setEditingReplyId(reply.id) }}><Pencil className="h-3 w-3" /></Button>
                                          )}
                                          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-600" onClick={() => handleDeleteReply(reply.id)}><Trash2 className="h-3 w-3" /></Button>
                                        </div>
                                      )}
                                    </div>

                                    {/* EDIT MODE BALASAN */}
                                    {editingReplyId === reply.id ? (
                                      <div className="ml-8 mt-2 space-y-2">
                                        <Textarea value={editReplyContent} onChange={(e) => setEditReplyContent(e.target.value)} className="text-sm min-h-[60px]" />
                                        <div className="flex gap-2">
                                          <Button size="sm" className="h-7 text-xs bg-emerald-600" onClick={() => handleUpdateReply(reply.id)}>Simpan</Button>
                                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingReplyId(null)}>Batal</Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-slate-700 ml-8 whitespace-pre-wrap">{reply.content}</p>
                                    )}
                                  </div>
                                )
                              })
                            ) : (
                              <p className="text-sm text-slate-400 italic text-center py-2">Belum ada yang membalas.</p>
                            )}
                          </div>

                          <div className="flex gap-2 relative">
                            <Textarea
                              className="min-h-[50px] bg-white resize-none pr-12 focus:ring-emerald-500"
                              placeholder="Tulis balasanmu di sini..."
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                            />
                            <Button
                              size="icon"
                              className="absolute bottom-2 right-2 bg-emerald-600 hover:bg-emerald-700 h-8 w-8"
                              onClick={() => handleSendReply(topic.id)}
                              disabled={isReplying || !replyContent.trim()}
                            >
                              {isReplying ? <Loader2 className="animate-spin h-4 w-4" /> : <Send className="h-4 w-4" />}
                            </Button>
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