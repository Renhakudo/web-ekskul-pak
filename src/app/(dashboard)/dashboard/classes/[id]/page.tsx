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
  Compass,
  AlertCircle,
  Trophy,
  Clock,
  HelpCircle,
  Fingerprint
} from 'lucide-react'
import { Skeleton } from "@/components/ui/skeleton"
import { updateLearningStreak } from '@/lib/streak-utils'
import { awardEligibleBadges } from '@/lib/badge-utils'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Material { id: string; title: string; module_name?: string; type: 'video' | 'text' | 'quiz' | 'file'; xp_reward: number; created_at: string; }
interface Assignment { id: string; title: string; description: string; due_date: string; }
interface Reply { id: string; user_id: string; content: string; created_at: string; updated_at?: string; parent_reply_id?: string | null; profiles: { full_name: string; avatar_url: string; role: string } }
interface Discussion { id: string; user_id: string; title: string; content: string; created_at: string; updated_at?: string; profiles: { full_name: string; avatar_url: string; role: string }; replies: Reply[]; }
interface ClassDetail { id: string; title: string; description: string; created_by: string; materials: Material[]; assignments: Assignment[]; discussions: Discussion[]; quizzes: any[]; }

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
  const [replyingTo, setReplyingTo] = useState<{ replyId: string, userName: string } | null>(null)

  // State untuk error inline pada forum
  const [forumError, setForumError] = useState<string | null>(null)

  const [attendanceCode, setAttendanceCode] = useState('')
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false)

  const [deleteDialog, setDeleteDialog] = useState<{type: 'discussion'|'reply', id: string} | null>(null)

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

    const [classRes, materialsRes, assignmentsRes, quizzesRes] = await Promise.all([
      supabase.from('classes').select('*').eq('id', id).single(),
      supabase.from('materials').select('*').eq('class_id', id).order('created_at'),
      supabase.from('assignments').select('*').eq('class_id', id).order('created_at', { ascending: false }),
      supabase.from('quizzes').select('*, quiz_questions(count)').eq('class_id', id).order('created_at')
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
        quizzes: quizzesRes.data || [],
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
      if (currentUser?.id) {
        updateLearningStreak(currentUser.id, supabase).catch(() => { })
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
    setDeleteDialog({type: 'discussion', id: topicId})
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
    const { error } = await supabase.from('replies').insert({ 
      discussion_id: discussionId, 
      user_id: currentUser?.id, 
      content: replyContent,
      parent_reply_id: replyingTo?.replyId || null
    })
    if (!error) {
      setReplyContent('')
      setReplyingTo(null)
      if (currentUser?.id) {
        updateLearningStreak(currentUser.id, supabase).catch(() => { })
        awardEligibleBadges(currentUser.id, supabase).catch(() => { })
      }
      await fetchDiscussions()
    } else {
      setForumError('Gagal mengirim pesan: ' + error.message)
    }
    setIsReplying(false)
  }

  const handleDeleteReply = async (replyId: string) => {
    setDeleteDialog({type: 'reply', id: replyId})
  }

  const confirmDelete = async () => {
    if (!deleteDialog) return
    if (deleteDialog.type === 'discussion') {
        await supabase.from('discussions').delete().eq('id', deleteDialog.id)
    } else {
        await supabase.from('replies').delete().eq('id', deleteDialog.id)
    }
    await fetchDiscussions()
    setDeleteDialog(null)
  }

  const handleUpdateReply = async (replyId: string) => {
    if (!editReplyContent.trim()) return
    const { error } = await supabase.from('replies').update({ content: editReplyContent, updated_at: new Date().toISOString() }).eq('id', replyId)
    if (!error) { setEditingReplyId(null); await fetchDiscussions() }
    else { setForumError('Gagal update balasan: ' + error.message) }
  }

  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!attendanceCode.trim() || !currentUser) return
    setIsSubmittingAttendance(true)

    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('class_sessions')
        .select('*')
        .eq('class_id', id)
        .eq('unique_code', attendanceCode.trim().toUpperCase())
        .single()
      
      if (sessionError || !sessionData) {
        toast.error('Gagal: Sandi Rahasia tidak ditemukan atau salah!')
        setIsSubmittingAttendance(false)
        return
      }

      if (new Date(sessionData.expires_at) < new Date()) {
        toast.error('Gagal: Sesi ini sudah hangus tertelan waktu!')
        setIsSubmittingAttendance(false)
        return
      }

      const { data: existingLog } = await supabase
        .from('points_logs')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('source', `attendance_${sessionData.id}`)
        .single()

      if (existingLog) {
        toast.error('Gagal: Kamu sudah masuk barisan di sesi ini!')
        setIsSubmittingAttendance(false)
        return
      }

      const xpReward = 50
      const { error: pointsError } = await supabase.from('points_logs').insert({
        user_id: currentUser.id,
        amount: xpReward,
        reason: 'Gelar Pasukan: ' + (classData?.title || 'Unknown'),
        source: `attendance_${sessionData.id}`
      })

      if (!pointsError) {
        const { data: profile } = await supabase.from('profiles').select('xp').eq('id', currentUser.id).single()
        if (profile) await supabase.from('profiles').update({ xp: profile.xp + xpReward }).eq('id', currentUser.id)
        
        await updateLearningStreak(currentUser.id, supabase).catch(()=>{})
        await awardEligibleBadges(currentUser.id, supabase).catch(()=>{})
        
        toast.success(`Berhasil Gabung Barisan! +${xpReward} XP`)
        setAttendanceCode('')
      } else {
        toast.error('Gagal mencatat kehadiran: ' + pointsError.message)
      }

    } catch (err: any) {
      toast.error('Terjadi kesalahan: ' + err.message)
    }
    setIsSubmittingAttendance(false)
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
    <div className="min-h-screen bg-[#FDFBF7] pb-20 font-sans relative overflow-x-hidden">

      {/* Hero Section */}
      <div className="bg-violet-400 border-b-4 border-slate-900 shadow-[0_8px_0px_#0f172a] py-16 px-6 md:px-12 relative overflow-hidden mb-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500 rounded-full blur-[60px] opacity-60 pointer-events-none"></div>
        <div className="max-w-5xl mx-auto relative z-10">
          <Link href="/dashboard/courses" className="inline-flex items-center text-slate-900 font-bold hover:text-white bg-white/40 px-4 py-2 rounded-xl border-2 border-transparent hover:border-slate-900 transition-all mb-8 shadow-sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali Peta
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
            <div className="bg-white p-3 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] transform -rotate-3 w-fit">
              <Compass className="h-10 w-10 text-violet-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">{classData.title}</h1>
          </div>
          <p className="text-slate-900 font-bold text-base md:text-lg max-w-2xl leading-relaxed mt-4 bg-white/40 p-4 rounded-2xl border-2 border-slate-900 italic">
            "{classData.description || "Misi ini masih misterius."}"
          </p>

          <div className="flex flex-wrap gap-4 mt-8">
            <div className="flex items-center gap-2 bg-yellow-300 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] px-4 py-2 rounded-xl"><FileText className="h-5 w-5 text-slate-900" /><span className="font-black text-slate-900">{classData.materials.length} Materi</span></div>
            <div className="flex items-center gap-2 bg-pink-300 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] px-4 py-2 rounded-xl"><Briefcase className="h-5 w-5 text-slate-900" /><span className="font-black text-slate-900">{classData.assignments.length} Tugas</span></div>
            <div className="flex items-center gap-2 bg-blue-300 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] px-4 py-2 rounded-xl"><Trophy className="h-5 w-5 text-slate-900" /><span className="font-black text-slate-900">{classData.quizzes?.length || 0} Ujian</span></div>
            <div className="flex items-center gap-2 bg-emerald-300 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] px-4 py-2 rounded-xl"><MessageSquare className="h-5 w-5 text-slate-900" /><span className="font-black text-slate-900">{classData.discussions.length} Diskusi</span></div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-12 relative z-20">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          {/* PERBAIKAN UI TAB: Chunky Buttons */}
          <TabsList className="flex flex-col sm:flex-row flex-wrap w-full mb-12 bg-transparent p-0 gap-3 sm:gap-4 h-auto overflow-visible">
            <TabsTrigger 
              value="materials" 
              className="flex-1 w-full py-4 font-black text-sm sm:text-base uppercase rounded-[1.5rem] transition-all border-4 border-slate-900 bg-white text-slate-500 shadow-[4px_4px_0px_#0f172a] data-[state=inactive]:hover:-translate-y-1 data-[state=inactive]:hover:shadow-[6px_6px_0px_#0f172a] data-[state=active]:translate-y-[4px] data-[state=active]:translate-x-[4px] data-[state=active]:shadow-none data-[state=active]:bg-yellow-300 data-[state=active]:text-slate-900 flex items-center justify-center gap-2 outline-none"
            >
              <FileText className="w-5 h-5" /> Materi Pokok
            </TabsTrigger>
            
            <TabsTrigger 
              value="assignments" 
              className="flex-1 w-full py-4 font-black text-sm sm:text-base uppercase rounded-[1.5rem] transition-all border-4 border-slate-900 bg-white text-slate-500 shadow-[4px_4px_0px_#0f172a] data-[state=inactive]:hover:-translate-y-1 data-[state=inactive]:hover:shadow-[6px_6px_0px_#0f172a] data-[state=active]:translate-y-[4px] data-[state=active]:translate-x-[4px] data-[state=active]:shadow-none data-[state=active]:bg-pink-300 data-[state=active]:text-slate-900 flex items-center justify-center gap-2 outline-none"
            >
              <Briefcase className="w-5 h-5" /> Tugas Kelas
            </TabsTrigger>
            
            <TabsTrigger 
              value="discussions" 
              className="flex-1 w-full py-4 font-black text-sm sm:text-base uppercase rounded-[1.5rem] transition-all border-4 border-slate-900 bg-white text-slate-500 shadow-[4px_4px_0px_#0f172a] data-[state=inactive]:hover:-translate-y-1 data-[state=inactive]:hover:shadow-[6px_6px_0px_#0f172a] data-[state=active]:translate-y-[4px] data-[state=active]:translate-x-[4px] data-[state=active]:shadow-none data-[state=active]:bg-emerald-300 data-[state=active]:text-slate-900 flex items-center justify-center gap-2 outline-none"
            >
              <MessageSquare className="w-5 h-5" /> Forum Diskusi
            </TabsTrigger>
            
            <TabsTrigger 
              value="quizzes" 
              className="flex-auto py-4 font-black text-sm sm:text-base uppercase rounded-[1.5rem] transition-all border-4 border-slate-900 bg-white text-slate-500 shadow-[4px_4px_0px_#0f172a] data-[state=inactive]:hover:-translate-y-1 data-[state=inactive]:hover:shadow-[6px_6px_0px_#0f172a] data-[state=active]:translate-y-[4px] data-[state=active]:translate-x-[4px] data-[state=active]:shadow-none data-[state=active]:bg-blue-300 data-[state=active]:text-slate-900 flex items-center justify-center gap-2 outline-none"
            >
              <Trophy className="w-5 h-5" /> Uji Mental
            </TabsTrigger>

            <TabsTrigger 
              value="attendance" 
              className="flex-auto py-4 font-black text-sm sm:text-base uppercase rounded-[1.5rem] transition-all border-4 border-slate-900 bg-white text-slate-500 shadow-[4px_4px_0px_#0f172a] data-[state=inactive]:hover:-translate-y-1 data-[state=inactive]:hover:shadow-[6px_6px_0px_#0f172a] data-[state=active]:translate-y-[4px] data-[state=active]:translate-x-[4px] data-[state=active]:shadow-none data-[state=active]:bg-cyan-300 data-[state=active]:text-slate-900 flex items-center justify-center gap-2 outline-none"
            >
              <Fingerprint className="w-5 h-5" /> Gelar Pasukan
            </TabsTrigger>
          </TabsList>

          {/* TAB MATERI */}
          <TabsContent value="materials" className="space-y-4 focus:outline-none">
            {classData.materials.length === 0 ? (
              <div className="p-16 text-center bg-white border-4 border-slate-900 border-dashed rounded-[32px] shadow-sm transform rotate-1">
                <div className="w-20 h-20 bg-slate-100 rounded-full border-4 border-slate-900 flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0px_#0f172a]">
                  <FileText className="h-10 w-10 text-slate-400" />
                </div>
                <p className="font-black text-xl text-slate-500">Materi belum ditambahkan oleh komandan kelas.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(
                  classData.materials.reduce((acc: Record<string, any[]>, m: any) => {
                    const mod = m.module_name || 'Materi Tanpa Kategori'
                    if (!acc[mod]) acc[mod] = []
                    acc[mod].push(m)
                    return acc
                  }, {})
                ).map(([moduleName, mats]: [string, any]) => (
                  <div key={moduleName} className="space-y-4 relative">
                    <div className="flex items-center gap-4">
                      <div className="h-0.5 flex-1 bg-slate-300 rounded-full"></div>
                      <h3 className="text-xl font-black text-slate-500 uppercase tracking-widest px-4 bg-white border-2 border-slate-300 rounded-full py-1 inline-block shadow-sm">
                        {moduleName}
                      </h3>
                      <div className="h-0.5 flex-1 bg-slate-300 rounded-full"></div>
                    </div>
                    
                    <div className="grid gap-6">
                      {mats.map((m: any, index: number) => (
                        <div key={m.id} className="group flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-[24px] hover:-translate-y-1 hover:shadow-[8px_8px_0px_#0f172a] transition-all cursor-pointer" onClick={() => router.push(`/dashboard/classes/${id}/materials/${m.id}`)}>
                          <div className={`h-16 w-16 shrink-0 rounded-2xl flex items-center justify-center border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] transform group-hover:rotate-6 transition-transform ${m.type === 'video' ? 'bg-orange-300 text-slate-900' : m.type === 'file' ? 'bg-emerald-300 text-slate-900' : 'bg-blue-300 text-slate-900'}`}>
                            {m.type === 'video' ? <PlayCircle className="h-8 w-8" /> : m.type === 'file' ? <FileText className="h-8 w-8" /> : <FileText className="h-8 w-8" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-black text-violet-600 tracking-wider">BAGIAN {index + 1}</span>
                            <h3 className="text-2xl font-black text-slate-900 truncate my-1 leading-tight group-hover:text-violet-700 transition-colors">{m.title}</h3>
                          </div>
                          <div className="flex items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0 justify-between sm:justify-end">
                            <Badge className="bg-yellow-300 text-slate-900 font-black text-base border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] px-3 py-1 hover:bg-yellow-300">+{m.xp_reward} XP</Badge>
                            <div className="h-12 w-12 bg-slate-100 rounded-2xl border-4 border-slate-900 shadow-[2px_2px_0px_#0f172a] flex items-center justify-center text-slate-900 group-hover:bg-yellow-300 group-hover:translate-x-1 transition-all">
                              <ArrowRight className="h-6 w-6" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB TUGAS */}
          <TabsContent value="assignments" className="space-y-4 focus:outline-none">
            {classData.assignments.length === 0 ? (
              <div className="p-16 text-center bg-white border-4 border-slate-900 border-dashed rounded-[32px] shadow-sm transform -rotate-1">
                <div className="w-20 h-20 bg-slate-100 rounded-full border-4 border-slate-900 flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0px_#0f172a]">
                  <Briefcase className="h-10 w-10 text-slate-400" />
                </div>
                <p className="font-black text-xl text-slate-500">Hore! Belum ada tugas misi yang diberikan.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {classData.assignments.map((a) => (
                  <div key={a.id} className="group flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-[24px] hover:-translate-y-1 hover:shadow-[8px_8px_0px_#0f172a] transition-all cursor-pointer" onClick={() => router.push(`/dashboard/classes/${id}/assignments/${a.id}`)}>
                    <div className="h-16 w-16 shrink-0 rounded-2xl bg-pink-300 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] flex items-center justify-center transform group-hover:-rotate-6 transition-transform">
                      <Briefcase className="h-8 w-8 text-slate-900" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xl font-black text-slate-900 truncate my-1 group-hover:text-pink-600 transition-colors">{a.title}</h3>
                      <span className="text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl border-2 border-slate-900 inline-flex items-center gap-2 mt-1 shadow-sm">
                        <Calendar className="h-4 w-4" /> {a.due_date ? new Date(a.due_date).toLocaleDateString() : 'Tanpa Tenggat Waktu'}
                      </span>
                    </div>
                    <Button className="w-full sm:w-auto mt-4 sm:mt-0 h-12 bg-pink-400 hover:bg-pink-300 text-slate-900 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] group-hover:translate-x-1 group-hover:shadow-[2px_2px_0px_#0f172a] transition-all rounded-xl">
                      Mulai Kerjakan <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB QUIZ */}
          <TabsContent value="quizzes" className="space-y-4 focus:outline-none">
            {classData.quizzes?.length === 0 ? (
              <div className="p-16 text-center bg-white border-4 border-slate-900 border-dashed rounded-[32px] shadow-sm transform rotate-1">
                <div className="w-20 h-20 bg-slate-100 rounded-full border-4 border-slate-900 flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0px_#0f172a]">
                  <Trophy className="h-10 w-10 text-slate-400" />
                </div>
                <p className="font-black text-xl text-slate-500">Aman! Belum ada ujian nyali di kelas ini.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {classData.quizzes?.map((qz) => {
                  const qCount = qz.quiz_questions?.[0]?.count ?? qz.quiz_questions?.count ?? 0
                  return (
                    <div key={qz.id} className="group flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-[24px] hover:-translate-y-1 hover:shadow-[8px_8px_0px_#0f172a] transition-all cursor-pointer" onClick={() => router.push(`/dashboard/classes/${id}/quiz/${qz.id}`)}>
                      <div className="h-16 w-16 shrink-0 rounded-2xl bg-blue-300 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] flex items-center justify-center transform group-hover:-rotate-6 transition-transform">
                        <HelpCircle className="h-8 w-8 text-slate-900" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-2xl font-black text-slate-900 truncate my-1 group-hover:text-blue-700 transition-colors uppercase">{qz.title}</h3>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl border-2 border-slate-900 inline-flex items-center gap-1.5 shadow-sm">
                            <Clock className="h-4 w-4" /> {Math.floor(qz.time_limit_seconds / 60)} Menit
                          </span>
                          <span className="text-sm font-bold text-slate-900 bg-yellow-300 px-3 py-1 rounded-xl border-2 border-slate-900 inline-flex items-center gap-1.5 shadow-[2px_2px_0px_#0f172a]">
                            <Trophy className="h-4 w-4" /> +{qz.xp_reward} XP
                          </span>
                          <span className="text-sm font-bold text-blue-900 bg-blue-100 px-3 py-1 rounded-xl border-2 border-slate-900 inline-flex items-center gap-1.5 border-dashed">
                             {qCount} Rintangan
                          </span>
                        </div>
                      </div>
                      <Button className="w-full sm:w-auto mt-4 sm:mt-0 h-12 bg-blue-400 hover:bg-blue-300 text-slate-900 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] group-hover:translate-x-1 group-hover:shadow-[2px_2px_0px_#0f172a] transition-all rounded-xl">
                        Mulai Ujian <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* TAB DISKUSI */}
          <TabsContent value="discussions" className="space-y-6 focus:outline-none">
            
            {/* UI Error Alert untuk Forum */}
            {forumError && (
              <div className="flex items-start gap-3 bg-red-200 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] p-4 rounded-[1.5rem] text-slate-900 font-black mb-6 transform rotate-1">
                <AlertCircle className="h-6 w-6 mt-0.5 shrink-0 text-red-600" />
                <span>{forumError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-emerald-200 border-4 border-slate-900 p-6 md:p-8 rounded-[32px] shadow-[6px_6px_0px_#0f172a]">
              <div>
                <h3 className="font-black text-slate-900 text-3xl flex items-center gap-3"><MessageSquare className="h-8 w-8 text-emerald-700 fill-emerald-100" /> Forum Diskusi</h3>
                <p className="text-base font-bold text-slate-700 mt-2 bg-white/50 px-3 py-1 rounded-lg w-fit border-2 border-slate-900 border-dashed">Ada kendala? Tanya teman atau instruktur di sini.</p>
              </div>

              <Dialog open={isDiscussOpen} onOpenChange={setIsDiscussOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-black text-base h-14 px-6 rounded-[1rem] border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-[0px_0px_0px_#0f172a] transition-all whitespace-nowrap">
                    <Pencil className="mr-2 h-5 w-5" /> Buka Obrolan Baru
                  </Button>
                </DialogTrigger>
                <DialogContent className="border-4 border-slate-900 shadow-[12px_12px_0px_#0f172a] rounded-[2rem] p-8 max-w-lg bg-[#FDFBF7]">
                  <DialogHeader><DialogTitle className="font-black text-3xl text-slate-900 uppercase">Topik Baru</DialogTitle></DialogHeader>
                  <form onSubmit={handleCreateDiscussion} className="space-y-6 mt-4">
                    <div className="space-y-2">
                      <Label className="font-black text-slate-900 uppercase text-sm">Judul Singkat</Label>
                      <Input value={newTopicTitle} onChange={e => setNewTopicTitle(e.target.value)} placeholder="Misal: Error saat instal React..." className="h-14 border-4 border-slate-900 font-bold rounded-xl focus-visible:ring-0 focus:shadow-[4px_4px_0px_#0f172a] transition-all" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black text-slate-900 uppercase text-sm">Ceritakan Masalahmu</Label>
                      <Textarea className="min-h-[160px] border-4 border-slate-900 font-medium resize-none rounded-xl focus-visible:ring-0 focus:shadow-[4px_4px_0px_#0f172a] transition-all p-4" value={newTopicContent} onChange={e => setNewTopicContent(e.target.value)} placeholder="Tulis sedetail mungkin biar gampang dibantu..." required />
                    </div>
                    <Button type="submit" className="w-full h-16 bg-emerald-400 hover:bg-emerald-300 text-slate-900 text-xl font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none rounded-xl uppercase transition-all" disabled={isSubmittingTopic}>
                      {isSubmittingTopic ? <Loader2 className="animate-spin mr-2 h-6 w-6" /> : "Sebarkan Topik"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {classData.discussions.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[32px] border-4 border-dashed border-slate-300">
                <MessageSquare className="h-20 w-20 text-slate-300 mx-auto mb-4" />
                <p className="font-black text-2xl text-slate-400">Belum ada suara di sini.</p>
              </div>
            ) : (
              <div className="space-y-8 mt-8">
                {classData.discussions.map((topic) => {
                  const isTopicOwner = currentUser?.id === topic.user_id;
                  const canDeleteTopic = isTopicOwner || currentUserRole === 'guru' || currentUserRole === 'admin';

                  return (
                    <Card key={topic.id} className="border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[2rem] overflow-hidden bg-white">
                      <div
                        className="p-6 md:p-8 cursor-pointer hover:bg-emerald-50 transition-colors group relative"
                        onClick={() => { 
                          if (editingTopicId !== topic.id) {
                            setExpandedTopic(expandedTopic === topic.id ? null : topic.id)
                            setReplyingTo(null)
                          }
                        }}
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                          <div className="flex gap-4 md:gap-6 w-full items-start">
                            <Avatar className="h-14 w-14 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] shrink-0 transform group-hover:rotate-6 transition-transform">
                              <AvatarImage src={topic.profiles?.avatar_url} />
                              <AvatarFallback className="font-black text-xl bg-orange-300 text-slate-900">{topic.profiles?.full_name?.[0]}</AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0 mt-1">
                              {editingTopicId === topic.id ? (
                                <div className="space-y-4" onClick={e => e.stopPropagation()}>
                                  <Input value={editTopicTitle} onChange={e => setEditTopicTitle(e.target.value)} className="h-12 font-black border-4 border-slate-900 rounded-xl" />
                                  <Textarea value={editTopicContent} onChange={e => setEditTopicContent(e.target.value)} className="font-medium min-h-[120px] border-4 border-slate-900 resize-none rounded-xl" />
                                  <div className="flex gap-3">
                                    <Button size="sm" onClick={() => handleUpdateDiscussion(topic.id)} className="h-12 px-6 bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] active:shadow-none active:translate-y-1 rounded-xl"><Check className="w-5 h-5 mr-2" /> Simpan</Button>
                                    <Button size="sm" variant="outline" onClick={() => setEditingTopicId(null)} className="h-12 px-6 font-black border-4 border-slate-900 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5 mr-2" /> Batal</Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <h4 className="font-black text-slate-900 text-2xl leading-tight group-hover:text-emerald-600 transition-colors pr-4">{topic.title}</h4>
                                  <div className="flex items-center flex-wrap gap-2 text-xs md:text-sm font-bold text-slate-500 mt-2">
                                    <span className="text-violet-600 bg-violet-100 px-2 py-0.5 rounded-md border-2 border-violet-200">{topic.profiles?.full_name}</span>
                                    <span>•</span>
                                    <span>{new Date(topic.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                    {isEdited(topic.created_at, topic.updated_at) && <span className="text-slate-400 italic">(Diedit)</span>}
                                    {topic.profiles?.role === 'guru' && <Badge className="text-[10px] h-5 border-2 border-slate-900 text-slate-900 bg-yellow-400 ml-1 font-black shadow-sm">Master</Badge>}
                                  </div>
                                  <p className="mt-4 text-slate-700 text-lg font-medium whitespace-pre-wrap leading-relaxed">{topic.content}</p>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0 w-full sm:w-auto mt-4 sm:mt-0 justify-between sm:justify-start">
                            <Badge className="bg-slate-100 border-4 border-slate-900 text-slate-900 font-black flex items-center gap-2 shadow-[4px_4px_0px_#0f172a] px-4 py-1.5 text-base rounded-xl">
                              <MessageSquare className="h-5 w-5" /> {topic.replies?.length || 0}
                            </Badge>
                            {canDeleteTopic && editingTopicId !== topic.id && (
                              <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                {isTopicOwner && (
                                  <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-500 bg-blue-50 border-2 border-blue-200 hover:bg-blue-200 hover:text-blue-800 hover:border-blue-900 shadow-sm rounded-xl transition-all" onClick={() => { setEditTopicTitle(topic.title); setEditTopicContent(topic.content); setEditingTopicId(topic.id) }}><Pencil className="h-4 w-4" /></Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-500 bg-red-50 border-2 border-red-200 hover:bg-red-200 hover:text-red-800 hover:border-red-900 shadow-sm rounded-xl transition-all" onClick={(e) => handleDeleteDiscussion(topic.id, e)}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* AREA BALASAN */}
                      {expandedTopic === topic.id && (
                        <div className="bg-slate-100 border-t-4 border-slate-900 p-6 md:p-8">

                          <div className="space-y-4 mb-8">
                            {topic.replies && topic.replies.length > 0 ? (
                              (() => {
                                const topLevel = topic.replies.filter(r => !r.parent_reply_id)
                                const getChildren = (parentId: string) => topic.replies.filter(r => r.parent_reply_id === parentId)

                                const renderReply = (reply: Reply, isChild: boolean = false) => {
                                  const isReplyOwner = currentUser?.id === reply.user_id;
                                  const canDeleteReply = isReplyOwner || currentUserRole === 'guru' || currentUserRole === 'admin';

                                  return (
                                    <div key={reply.id} className="space-y-3">
                                      <div className={cn("bg-white p-5 rounded-2xl border-4 shadow-[4px_4px_0px_#0f172a] flex flex-col gap-3 relative", isChild ? "border-emerald-700 ml-4 sm:ml-12" : "border-slate-900")}>
                                        {isChild && (
                                          <div className="absolute -left-5 sm:-left-12 top-8 w-4 sm:w-11 h-4 border-b-4 border-l-4 border-emerald-700 rounded-bl-xl z-0"></div>
                                        )}
                                        <div className="flex justify-between items-start gap-4 z-10 relative bg-white">
                                          <div className="flex items-center gap-3 w-full">
                                            <Avatar className="h-10 w-10 border-2 border-slate-900 shrink-0"><AvatarImage src={reply.profiles?.avatar_url} /><AvatarFallback className="bg-violet-300 font-black text-slate-900">{reply.profiles?.full_name?.[0]}</AvatarFallback></Avatar>
                                            <div className="flex flex-row items-center gap-2 flex-wrap min-w-0">
                                              <span className="font-black text-base text-slate-900 truncate">{reply.profiles?.full_name}</span>
                                              {reply.profiles?.role === 'guru' && <Badge className="text-[10px] h-5 bg-yellow-400 text-slate-900 border-2 border-slate-900 px-1.5 font-black">Master</Badge>}
                                              <span className="text-xs font-bold text-slate-400 hidden sm:inline-block">• {new Date(reply.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
                                            </div>
                                          </div>

                                          <div className="flex gap-2 shrink-0">
                                            {!isChild && (
                                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-emerald-100 hover:text-emerald-800 border-2 border-transparent hover:border-emerald-900 rounded-lg transition-all" onClick={() => { setReplyingTo({ replyId: reply.id, userName: reply.profiles?.full_name }); document.getElementById(`reply-input-${topic.id}`)?.focus() }}><MessageSquare className="h-4 w-4" /></Button>
                                            )}
                                            {canDeleteReply && editingReplyId !== reply.id && (
                                              <>
                                                {isReplyOwner && (
                                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-blue-100 hover:text-blue-800 border-2 border-transparent hover:border-blue-900 rounded-lg transition-all" onClick={() => { setEditReplyContent(reply.content); setEditingReplyId(reply.id) }}><Pencil className="h-4 w-4" /></Button>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-red-100 hover:text-red-800 border-2 border-transparent hover:border-red-900 rounded-lg transition-all" onClick={() => handleDeleteReply(reply.id)}><Trash2 className="h-4 w-4" /></Button>
                                              </>
                                            )}
                                          </div>
                                        </div>

                                        {editingReplyId === reply.id ? (
                                          <div className="ml-0 sm:ml-12 space-y-3 relative z-10 bg-white">
                                            <Textarea value={editReplyContent} onChange={(e) => setEditReplyContent(e.target.value)} className="text-base min-h-[100px] font-medium border-4 border-slate-900 rounded-xl" />
                                            <div className="flex gap-2">
                                              <Button size="sm" className="h-10 px-4 bg-emerald-400 text-slate-900 font-black border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-lg" onClick={() => handleUpdateReply(reply.id)}>Simpan</Button>
                                              <Button size="sm" variant="outline" className="h-10 px-4 font-black border-2 border-slate-900 hover:bg-slate-100 rounded-lg" onClick={() => setEditingReplyId(null)}>Batal</Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <p className="text-base font-medium text-slate-800 sm:ml-13 whitespace-pre-wrap leading-relaxed relative z-10 bg-white">{reply.content}</p>
                                        )}
                                      </div>
                                      
                                      {!isChild && getChildren(reply.id).map(child => renderReply(child, true))}
                                    </div>
                                  )
                                }

                                return topLevel.map(reply => renderReply(reply))
                              })()
                            ) : (
                              <p className="text-lg font-black text-slate-400 uppercase tracking-widest text-center py-6 bg-white border-4 border-slate-300 border-dashed rounded-2xl">Belum ada yang menyahut.</p>
                            )}
                          </div>

                          {/* KOTAK KETIK BALASAN */}
                          {forumError && <div className="mb-4 text-sm font-bold bg-red-100 text-red-700 px-4 py-2 rounded-xl border-2 border-red-200">{forumError}</div>}
                          {replyingTo && (
                            <div className="flex items-center justify-between bg-emerald-100 border-2 border-emerald-900 text-emerald-900 px-4 py-2 rounded-xl text-sm font-bold shadow-sm mb-3">
                              <span>Membalas <span className="font-black">{replyingTo.userName}</span></span>
                              <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-emerald-200 rounded-full" onClick={() => setReplyingTo(null)}><X className="h-4 w-4" /></Button>
                            </div>
                          )}
                          <div className="flex gap-3 sm:gap-4 relative bg-emerald-300 p-4 sm:p-5 rounded-2xl border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a]">
                            <Avatar className="h-12 w-12 border-4 border-slate-900 hidden sm:block shrink-0 shadow-[2px_2px_0px_#0f172a] bg-white"><AvatarImage src={currentUser?.user_metadata?.avatar_url} /><AvatarFallback className="bg-slate-200 font-black text-slate-900">U</AvatarFallback></Avatar>
                            <div className="flex-1 relative w-full">
                              <Textarea
                                id={`reply-input-${topic.id}`}
                                className="min-h-[80px] bg-white border-4 border-slate-900 font-medium resize-none pr-16 py-4 focus-visible:ring-0 focus:shadow-[4px_4px_0px_#0f172a] rounded-xl text-base"
                                placeholder={replyingTo ? `Tulis balasan untuk ${replyingTo.userName}...` : "Ketik balasan komentarmu di sini..."}
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                              />
                              <Button
                                size="icon"
                                className="absolute bottom-3 right-3 bg-violet-500 hover:bg-violet-400 text-white border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] active:shadow-none active:translate-y-1 h-12 w-12 shrink-0 rounded-xl transition-all"
                                onClick={() => handleSendReply(topic.id)}
                                disabled={isReplying || !replyContent.trim()}
                              >
                                {isReplying ? <Loader2 className="animate-spin h-6 w-6 text-slate-900" /> : <Send className="h-6 w-6" />}
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

        {/* TAB ABSENSI (GELAR PASUKAN) */}
        <TabsContent value="attendance" className="space-y-4 focus:outline-none">
          <div className="bg-cyan-200 border-4 border-slate-900 p-8 md:p-12 rounded-[32px] shadow-[8px_8px_0px_#0f172a] max-w-2xl mx-auto flex flex-col items-center text-center">
            <div className="h-24 w-24 bg-white border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-full flex items-center justify-center mb-6 transform -rotate-6">
              <Fingerprint className="h-12 w-12 text-slate-900" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 uppercase">Input Sandi Pasukan</h3>
            <p className="font-bold text-slate-700 mt-2 mb-8 bg-white/50 px-4 py-2 rounded-xl border-2 border-slate-900 border-dashed inline-block">Masukkan kode rahasia dari komandan kelas untuk absen harian.</p>
            
            <form onSubmit={handleAttendanceSubmit} className="w-full flex flex-col gap-4">
              <Input 
                value={attendanceCode} 
                onChange={e => setAttendanceCode(e.target.value)} 
                placeholder="R3H4S1A..." 
                className="h-16 text-center text-2xl font-black uppercase tracking-widest border-4 border-slate-900 rounded-2xl focus-visible:ring-0 focus:shadow-[4px_4px_0px_#0f172a] transition-all"
                maxLength={10}
              />
              <Button 
                type="submit" 
                disabled={isSubmittingAttendance || !attendanceCode.trim()} 
                className="h-16 w-full text-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 font-black tracking-widest uppercase border-4 border-slate-900 shadow-[4px_4px_0px_#0891b2] rounded-2xl hover:translate-y-1 hover:shadow-[2px_2px_0px_#0891b2] transition-all"
              >
                {isSubmittingAttendance ? <Loader2 className="animate-spin mr-2 h-6 w-6" /> : "GABUNG BARISAN"}
              </Button>
            </form>
          </div>
        </TabsContent>
        </Tabs>

        {/* DELETE CONFIRM DIALOG PADA STUDENT DASHBOARD FORUM */}
        <Dialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
          <DialogContent className="border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[24px]">
            <DialogHeader>
              <DialogTitle className="font-black text-2xl text-red-600 flex items-center gap-2">
                <Trash2 className="h-6 w-6"/> Konfirmasi Pemusnahan
              </DialogTitle>
            </DialogHeader>
            <p className="font-bold text-slate-600 my-4">
               Tindakan ini tidak bisa dibatalkan. {deleteDialog?.type === 'discussion' ? 'Yakin hapus topik ini beserta balasannya?' : 'Yakin hapus balasan ini?'}
            </p>
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={() => setDeleteDialog(null)} className="font-bold border-2 border-slate-900">Batal</Button>
              <Button onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 text-white font-black border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]">Ya, Musnahkan!</Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  )
}