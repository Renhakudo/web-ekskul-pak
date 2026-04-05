'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'

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
  ArrowLeft, ArrowRight, PlayCircle, FileText, Briefcase, Calendar, 
  MessageSquare, Send, Loader2, Pencil, Trash2, Check, X, Compass, 
  AlertCircle, Trophy, Clock, HelpCircle, Fingerprint
} from 'lucide-react'
import { Skeleton } from "@/components/ui/skeleton"
import { updateLearningStreak } from '@/lib/streak-utils'
import { awardEligibleBadges } from '@/lib/badge-utils'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Matikan SSR untuk RichTextEditor agar tidak crash
const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { 
  ssr: false,
  loading: () => <div className="min-h-[120px] w-full bg-slate-100 border-2 md:border-4 border-slate-900 border-dashed rounded-xl md:rounded-2xl animate-pulse"></div>
})

interface Material { id: string; title: string; module_name?: string; type: 'video' | 'text' | 'quiz' | 'file'; xp_reward: number; created_at: string; }
interface Assignment { id: string; title: string; description: string; due_date: string; }
interface Reply { id: string; user_id: string; content: string; created_at: string; updated_at?: string; parent_reply_id?: string | null; profiles: { full_name: string; avatar_url: string; role: string } }
interface Discussion { id: string; user_id: string; title: string; content: string; created_at: string; updated_at?: string; profiles: { full_name: string; avatar_url: string; role: string }; replies: Reply[]; }
interface ClassDetail { id: string; title: string; description: string; created_by: string; materials: Material[]; assignments: Assignment[]; discussions: Discussion[]; quizzes: any[]; }

export default function StudentClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  
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

  const [attendanceCode, setAttendanceCode] = useState('')
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false)

  const [deleteDialog, setDeleteDialog] = useState<{type: 'discussion'|'reply', id: string} | null>(null)

  const fetchDiscussions = useCallback(async () => {
    const { data: discussionsResult } = await supabase
      .from('discussions')
      .select(`*, profiles (full_name, avatar_url, role), replies (*, profiles (full_name, avatar_url, role))`)
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
      .select(`*, profiles (full_name, avatar_url, role), replies (*, profiles (full_name, avatar_url, role))`)
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

  // --- FORM HANDLERS ---
  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingTopic(true)
    const { error } = await supabase.from('discussions').insert({ class_id: id, user_id: currentUser?.id, title: newTopicTitle, content: newTopicContent })
    if (!error) {
      setNewTopicTitle(''); setNewTopicContent(''); setIsDiscussOpen(false)
      toast.success("Suara berhasil disebarkan! 📢")
      if (currentUser?.id) {
        updateLearningStreak(currentUser.id, supabase).catch(() => { })
        awardEligibleBadges(currentUser.id, supabase).catch(() => { })
      }
      await fetchDiscussions()
    } else {
      toast.error('Gagal menyebarkan topik: ' + error.message)
    }
    setIsSubmittingTopic(false)
  }

  const handleDeleteDiscussion = async (topicId: string, e: React.MouseEvent) => { e.stopPropagation(); setDeleteDialog({type: 'discussion', id: topicId}) }

  const handleUpdateDiscussion = async (topicId: string) => {
    if (!editTopicTitle.trim() || !editTopicContent.trim()) return
    const { error } = await supabase.from('discussions').update({ title: editTopicTitle, content: editTopicContent, updated_at: new Date().toISOString() }).eq('id', topicId)
    if (!error) { 
      setEditingTopicId(null); 
      toast.success("Arsip topik berhasil diperbarui! 🛠️"); 
      await fetchDiscussions() 
    } else {
      toast.error('Gagal merombak arsip: ' + error.message)
    }
  }

  // LOGIKA BALASAN DIKEMBALIKAN KE NESTED REPLY ASLI (MENGGUNAKAN parent_reply_id)
  const handleSendReply = async (discussionId: string) => {
    if (!replyContent.trim()) return
    setIsReplying(true)

    const { error } = await supabase.from('replies').insert({ 
      discussion_id: discussionId, 
      user_id: currentUser?.id, 
      content: replyContent,
      parent_reply_id: replyingTo?.replyId || null // Dikembalikan!
    })

    if (!error) {
      setReplyContent(''); setReplyingTo(null)
      toast.success("Sip! Balasanmu sudah terkirim. 🚀")
      if (currentUser?.id) {
        updateLearningStreak(currentUser.id, supabase).catch(() => { })
        awardEligibleBadges(currentUser.id, supabase).catch(() => { })
      }
      await fetchDiscussions()
    } else {
      toast.error('Waduh, gagal mengirim balasan: ' + error.message)
    }
    setIsReplying(false)
  }

  const handleDeleteReply = async (replyId: string) => setDeleteDialog({type: 'reply', id: replyId})

  const confirmDelete = async () => {
    if (!deleteDialog) return
    if (deleteDialog.type === 'discussion') {
      const { error } = await supabase.from('discussions').delete().eq('id', deleteDialog.id)
      if (error) toast.error("Gagal memusnahkan topik: " + error.message)
      else toast.success("Topik berhasil dimusnahkan. 💥")
    } else {
      const { error } = await supabase.from('replies').delete().eq('id', deleteDialog.id)
      if (error) toast.error("Gagal menghapus balasan: " + error.message)
      else toast.success("Balasan berhasil dihapus. 🧹")
    }
    await fetchDiscussions()
    setDeleteDialog(null)
  }

  const handleUpdateReply = async (replyId: string) => {
    if (!editReplyContent.trim()) return
    const { error } = await supabase.from('replies').update({ content: editReplyContent, updated_at: new Date().toISOString() }).eq('id', replyId)
    if (!error) { 
      setEditingReplyId(null); 
      toast.success("Balasan berhasil diedit!"); 
      await fetchDiscussions() 
    } else {
      toast.error('Gagal merombak balasan: ' + error.message)
    }
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
      
      if (sessionError || !sessionData) { toast.error('Gagal: Sandi Rahasia tidak ditemukan atau salah!'); setIsSubmittingAttendance(false); return; }
      if (new Date(sessionData.expires_at) < new Date()) { toast.error('Gagal: Sesi ini sudah hangus tertelan waktu!'); setIsSubmittingAttendance(false); return; }

      const { data: existingLog } = await supabase.from('points_logs').select('id').eq('user_id', currentUser.id).eq('source', `attendance_${sessionData.id}`).single()
      if (existingLog) { toast.error('Gagal: Kamu sudah masuk barisan di sesi ini!'); setIsSubmittingAttendance(false); return; }

      const xpReward = 50
      const { error: pointsError } = await supabase.from('points_logs').insert({ user_id: currentUser.id, amount: xpReward, reason: 'Gelar Pasukan: ' + (classData?.title || 'Unknown'), source: `attendance_${sessionData.id}` })

      if (!pointsError) {
        const { data: profile } = await supabase.from('profiles').select('xp').eq('id', currentUser.id).single()
        if (profile) await supabase.from('profiles').update({ xp: profile.xp + xpReward }).eq('id', currentUser.id)
        await updateLearningStreak(currentUser.id, supabase).catch(()=>{})
        await awardEligibleBadges(currentUser.id, supabase).catch(()=>{})
        toast.success(`Berhasil Gabung Barisan! +${xpReward} XP ⚡`)
        setAttendanceCode('')
      } else toast.error('Gagal mencatat kehadiran: ' + pointsError.message)
    } catch (err: any) { toast.error('Terjadi kesalahan: ' + err.message) }
    setIsSubmittingAttendance(false)
  }

  // Logika Cek Edit (Batas 1 detik untuk membedakan create dan update dari Supabase)
  const isEdited = (created_at: string, updated_at?: string) => {
    if (!updated_at) return false
    return new Date(updated_at).getTime() - new Date(created_at).getTime() > 1000
  }

  // --- RENDER LOADERS & ERRORS ---
  if (isInitialLoading) return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-4 font-sans mt-10">
      <Skeleton className="h-16 md:h-24 w-full md:w-1/2 rounded-2xl md:rounded-[2rem] bg-slate-200" />
      <Skeleton className="h-6 md:h-8 w-3/4 rounded-xl bg-slate-200" />
      <div className="space-y-4 mt-8">
        <Skeleton className="h-24 w-full rounded-2xl md:rounded-[2rem] bg-slate-200" />
        <Skeleton className="h-24 w-full rounded-2xl md:rounded-[2rem] bg-slate-200" />
      </div>
    </div>
  )

  if (!classData) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#FDFBF7]">
      <div className="w-20 h-20 md:w-24 md:h-24 bg-white border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-full flex items-center justify-center mb-6 transform -rotate-12">
        <AlertCircle className="w-10 h-10 md:w-12 md:h-12 text-slate-400" />
      </div>
      <h2 className="text-2xl md:text-4xl font-black text-slate-900 uppercase">Misi Tidak Ditemukan</h2>
      <p className="text-slate-600 font-bold mt-2 mb-6">Misi mungkin telah dihapus atau arsipnya disegel.</p>
      <Link href="/dashboard/courses"><Button className="border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] h-14 px-8 font-black uppercase text-base hover:-translate-y-1 transition-transform">Kembali ke Peta</Button></Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-24 font-sans relative overflow-x-hidden">

      {/* ====== HERO SECTION ====== */}
      <div className="bg-violet-400 border-b-4 border-slate-900 shadow-[0_6px_0px_#0f172a] md:shadow-[0_8px_0px_#0f172a] py-10 md:py-16 px-4 md:px-12 relative overflow-hidden mb-8 md:mb-12">
        <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-violet-500 rounded-full blur-[40px] md:blur-[60px] opacity-60 pointer-events-none"></div>
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_2px_2px,#000_1px,transparent_0)] [background-size:24px_24px]"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <Link href="/dashboard/courses" className="inline-flex items-center text-slate-900 font-bold hover:text-white bg-white/40 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] hover:-translate-y-1 hover:shadow-[4px_4px_0px_#0f172a] transition-all mb-6 md:mb-8 text-xs md:text-sm uppercase tracking-wider">
            <ArrowLeft className="mr-1.5 md:mr-2 h-4 w-4" /> Kembali ke Peta
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
            <div className="bg-white p-2.5 md:p-3 rounded-xl md:rounded-2xl border-2 md:border-4 border-slate-900 shadow-[2px_2px_0px_#0f172a] md:shadow-[4px_4px_0px_#0f172a] transform -rotate-3 w-fit shrink-0">
              <Compass className="h-8 w-8 md:h-10 md:w-10 text-violet-600" />
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight uppercase">{classData.title}</h1>
          </div>
          
          <p className="text-slate-800 font-bold text-sm md:text-lg max-w-3xl leading-relaxed mt-3 md:mt-4 bg-white/50 p-3 md:p-4 rounded-xl md:rounded-2xl border-2 border-slate-900 shadow-sm backdrop-blur-sm">
            {classData.description || "Misi rahasia. Detail tidak ditemukan di arsip."}
          </p>

          <div className="flex flex-wrap gap-2 md:gap-4 mt-6 md:mt-8">
            <Badge className="flex items-center gap-1.5 md:gap-2 bg-yellow-300 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] px-2.5 py-1 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-sm"><FileText className="h-3 w-3 md:h-5 md:w-5 text-slate-900" /><span className="font-black text-slate-900 uppercase">{classData.materials.length} Materi</span></Badge>
            <Badge className="flex items-center gap-1.5 md:gap-2 bg-pink-300 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] px-2.5 py-1 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-sm"><Briefcase className="h-3 w-3 md:h-5 md:w-5 text-slate-900" /><span className="font-black text-slate-900 uppercase">{classData.assignments.length} Tugas</span></Badge>
            <Badge className="flex items-center gap-1.5 md:gap-2 bg-blue-300 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] px-2.5 py-1 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-sm"><Trophy className="h-3 w-3 md:h-5 md:w-5 text-slate-900" /><span className="font-black text-slate-900 uppercase">{classData.quizzes?.length || 0} Ujian</span></Badge>
            <Badge className="flex items-center gap-1.5 md:gap-2 bg-emerald-300 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] px-2.5 py-1 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-sm"><MessageSquare className="h-3 w-3 md:h-5 md:w-5 text-slate-900" /><span className="font-black text-slate-900 uppercase">{classData.discussions.length} Diskusi</span></Badge>
          </div>
        </div>
      </div>

      {/* ====== CONTENT TABS ====== */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-20">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          {/* PERBAIKAN TABS: Swipeable di Mobile, Grid/Wrap di Desktop tanpa Scroll & Kepotong */}
          <div className="w-full overflow-x-auto md:overflow-visible hide-scrollbar mb-6 md:mb-12 pb-4 pt-4 -mt-4 -mx-4 px-4 md:mx-0 md:px-0 md:pt-0 md:-mt-0">
            <TabsList className="flex w-max md:w-full md:flex-wrap bg-transparent p-0 gap-2 md:gap-4 h-auto items-center">
              {[
                { id: 'materials', icon: FileText, label: 'Materi Pokok', color: 'data-[state=active]:bg-yellow-300' },
                { id: 'assignments', icon: Briefcase, label: 'Tugas Kelas', color: 'data-[state=active]:bg-pink-300' },
                { id: 'discussions', icon: MessageSquare, label: 'Forum Diskusi', color: 'data-[state=active]:bg-emerald-300' },
                { id: 'quizzes', icon: Trophy, label: 'Uji Mental', color: 'data-[state=active]:bg-blue-300' },
                { id: 'attendance', icon: Fingerprint, label: 'Gelar Pasukan', color: 'data-[state=active]:bg-cyan-300' },
              ].map(tab => (
                <TabsTrigger 
                  key={tab.id}
                  value={tab.id} 
                  className={`flex-1 py-2.5 md:py-4 px-4 md:px-6 font-black text-xs md:text-base uppercase rounded-xl md:rounded-[1.5rem] transition-all border-2 md:border-4 border-slate-900 bg-white text-slate-500 shadow-[2px_2px_0px_#0f172a] md:shadow-[4px_4px_0px_#0f172a] data-[state=inactive]:hover:-translate-y-1 data-[state=active]:translate-y-[2px] md:data-[state=active]:translate-y-[4px] data-[state=active]:translate-x-[2px] md:data-[state=active]:translate-x-[4px] data-[state=active]:shadow-none ${tab.color} data-[state=active]:text-slate-900 flex items-center justify-center gap-1.5 md:gap-2 outline-none whitespace-nowrap`}
                >
                  <tab.icon className="w-4 h-4 md:w-5 md:h-5" /> {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* ================== MATERI ================== */}
          <TabsContent value="materials" className="space-y-4 focus:outline-none focus-visible:ring-0 mt-0">
            {classData.materials.length === 0 ? (
              <div className="p-10 md:p-16 text-center bg-white border-2 md:border-4 border-slate-900 border-dashed rounded-2xl md:rounded-[2rem] shadow-sm transform rotate-1">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-100 rounded-full border-2 md:border-4 border-slate-900 flex items-center justify-center mx-auto mb-4 shadow-[2px_2px_0px_#0f172a] md:shadow-[4px_4px_0px_#0f172a]">
                  <FileText className="h-8 w-8 md:h-10 md:w-10 text-slate-400" />
                </div>
                <p className="font-black text-base md:text-xl text-slate-500 uppercase">Belum ada modul yang diluncurkan.</p>
              </div>
            ) : (
              <div className="space-y-8 md:space-y-10">
                {Object.entries(
                  classData.materials.reduce((acc: Record<string, any[]>, m: any) => {
                    const mod = m.module_name || 'Misi Tanpa Kategori'
                    if (!acc[mod]) acc[mod] = []
                    acc[mod].push(m)
                    return acc
                  }, {})
                ).map(([moduleName, mats]: [string, any]) => (
                  <div key={moduleName} className="space-y-4 md:space-y-6 relative">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="h-0.5 flex-1 bg-slate-900 opacity-20 rounded-full"></div>
                      <h3 className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-widest px-3 md:px-4 py-1 md:py-1.5 bg-yellow-100 border-2 border-slate-900 rounded-lg md:rounded-xl shadow-[2px_2px_0px_#0f172a]">
                        {moduleName}
                      </h3>
                      <div className="h-0.5 flex-1 bg-slate-900 opacity-20 rounded-full"></div>
                    </div>
                    
                    <div className="grid gap-4 md:gap-6">
                      {mats.map((m: any, index: number) => (
                        <div key={m.id} className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 p-4 md:p-6 bg-white border-2 md:border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] md:shadow-[6px_6px_0px_#0f172a] rounded-[1.2rem] md:rounded-[24px] hover:-translate-y-1 md:hover:-translate-y-2 hover:shadow-[6px_6px_0px_#0f172a] md:hover:shadow-[10px_10px_0px_#0f172a] transition-all cursor-pointer" onClick={() => router.push(`/dashboard/classes/${id}/materials/${m.id}`)}>
                          <div className={`h-14 w-14 md:h-16 md:w-16 shrink-0 rounded-xl md:rounded-2xl flex items-center justify-center border-2 md:border-4 border-slate-900 shadow-[2px_2px_0px_#0f172a] md:shadow-[4px_4px_0px_#0f172a] transform group-hover:rotate-6 transition-transform ${m.type === 'video' ? 'bg-orange-300 text-slate-900' : m.type === 'file' ? 'bg-emerald-300 text-slate-900' : 'bg-blue-300 text-slate-900'}`}>
                            {m.type === 'video' ? <PlayCircle className="h-6 w-6 md:h-8 md:w-8" /> : <FileText className="h-6 w-6 md:h-8 md:w-8" />}
                          </div>
                          <div className="flex-1 min-w-0 w-full">
                            <span className="text-[10px] md:text-sm font-black text-violet-600 tracking-widest uppercase">Materi {index + 1}</span>
                            <h3 className="text-xl md:text-2xl font-black text-slate-900 truncate my-0.5 md:my-1 leading-tight group-hover:text-violet-700 transition-colors">{m.title}</h3>
                          </div>
                          <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto mt-2 sm:mt-0 justify-between sm:justify-end shrink-0">
                            <Badge className="bg-yellow-300 text-slate-900 font-black text-xs md:text-base border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] px-2.5 py-1 uppercase">+{m.xp_reward} XP</Badge>
                            <div className="h-10 w-10 md:h-12 md:w-12 bg-slate-100 rounded-xl border-2 md:border-4 border-slate-900 shadow-[2px_2px_0px_#0f172a] flex items-center justify-center text-slate-900 group-hover:bg-yellow-300 group-hover:translate-x-1 transition-all">
                              <ArrowRight className="h-5 w-5 md:h-6 md:w-6" />
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

          {/* ================== TUGAS ================== */}
          <TabsContent value="assignments" className="space-y-4 focus:outline-none focus-visible:ring-0 mt-0">
            {classData.assignments.length === 0 ? (
              <div className="p-10 md:p-16 text-center bg-white border-2 md:border-4 border-slate-900 border-dashed rounded-2xl md:rounded-[2rem] shadow-sm transform -rotate-1">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-100 rounded-full border-2 md:border-4 border-slate-900 flex items-center justify-center mx-auto mb-4 shadow-[2px_2px_0px_#0f172a] md:shadow-[4px_4px_0px_#0f172a]">
                  <Briefcase className="h-8 w-8 md:h-10 md:w-10 text-slate-400" />
                </div>
                <p className="font-black text-base md:text-xl text-slate-500 uppercase">Hore! Belum ada tugas misi.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:gap-6">
                {classData.assignments.map((a) => (
                  <div key={a.id} className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 p-4 md:p-6 bg-white border-2 md:border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] md:shadow-[6px_6px_0px_#0f172a] rounded-[1.2rem] md:rounded-[24px] hover:-translate-y-1 md:hover:-translate-y-2 hover:shadow-[6px_6px_0px_#0f172a] md:hover:shadow-[10px_10px_0px_#0f172a] transition-all cursor-pointer" onClick={() => router.push(`/dashboard/classes/${id}/assignments/${a.id}`)}>
                    <div className="h-14 w-14 md:h-16 md:w-16 shrink-0 rounded-xl md:rounded-2xl bg-pink-300 border-2 md:border-4 border-slate-900 shadow-[2px_2px_0px_#0f172a] md:shadow-[4px_4px_0px_#0f172a] flex items-center justify-center transform group-hover:-rotate-6 transition-transform">
                      <Briefcase className="h-6 w-6 md:h-8 md:w-8 text-slate-900" />
                    </div>
                    <div className="flex-1 min-w-0 w-full">
                      <h3 className="text-xl md:text-2xl font-black text-slate-900 truncate mb-1.5 md:mb-2 group-hover:text-pink-600 transition-colors">{a.title}</h3>
                      <Badge className="text-[10px] md:text-sm font-bold text-slate-700 bg-slate-100 px-2.5 py-1 md:px-3 rounded-lg border-2 border-slate-300 inline-flex items-center gap-1.5 md:gap-2 uppercase tracking-wider">
                        <Calendar className="h-3 w-3 md:h-4 md:w-4" /> {a.due_date ? new Date(a.due_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'}) : 'Tanpa Tenggat'}
                      </Badge>
                    </div>
                    <Button className="w-full sm:w-auto mt-3 sm:mt-0 h-12 bg-pink-400 hover:bg-pink-300 text-slate-900 font-black uppercase tracking-wider border-2 md:border-4 border-slate-900 shadow-[2px_2px_0px_#0f172a] md:shadow-[4px_4px_0px_#0f172a] group-hover:translate-x-1 group-hover:shadow-[4px_4px_0px_#0f172a] md:group-hover:shadow-[6px_6px_0px_#0f172a] transition-all rounded-xl shrink-0 text-xs md:text-sm">
                      Mulai Eksekusi <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ================== QUIZ ================== */}
          <TabsContent value="quizzes" className="space-y-4 focus:outline-none focus-visible:ring-0 mt-0">
            {classData.quizzes?.length === 0 ? (
              <div className="p-10 md:p-16 text-center bg-white border-2 md:border-4 border-slate-900 border-dashed rounded-2xl md:rounded-[2rem] shadow-sm transform rotate-1">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-100 rounded-full border-2 md:border-4 border-slate-900 flex items-center justify-center mx-auto mb-4 shadow-[2px_2px_0px_#0f172a] md:shadow-[4px_4px_0px_#0f172a]">
                  <Trophy className="h-8 w-8 md:h-10 md:w-10 text-slate-400" />
                </div>
                <p className="font-black text-base md:text-xl text-slate-500 uppercase">Aman! Belum ada ujian nyali.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:gap-6">
                {classData.quizzes?.map((qz) => {
                  const qCount = qz.quiz_questions?.[0]?.count ?? qz.quiz_questions?.count ?? 0
                  return (
                    <div key={qz.id} className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 p-4 md:p-6 bg-white border-2 md:border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] md:shadow-[6px_6px_0px_#0f172a] rounded-[1.2rem] md:rounded-[24px] hover:-translate-y-1 md:hover:-translate-y-2 hover:shadow-[6px_6px_0px_#0f172a] md:hover:shadow-[10px_10px_0px_#0f172a] transition-all cursor-pointer" onClick={() => router.push(`/dashboard/classes/${id}/quiz/${qz.id}`)}>
                      <div className="h-14 w-14 md:h-16 md:w-16 shrink-0 rounded-xl md:rounded-2xl bg-blue-300 border-2 md:border-4 border-slate-900 shadow-[2px_2px_0px_#0f172a] md:shadow-[4px_4px_0px_#0f172a] flex items-center justify-center transform group-hover:-rotate-6 transition-transform">
                        <HelpCircle className="h-6 w-6 md:h-8 w-8 text-slate-900" />
                      </div>
                      <div className="flex-1 min-w-0 w-full">
                        <h3 className="text-xl md:text-2xl font-black text-slate-900 truncate my-1 group-hover:text-blue-700 transition-colors uppercase">{qz.title}</h3>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge className="text-[10px] md:text-xs font-bold text-slate-700 bg-slate-100 border-2 border-slate-300 uppercase shadow-sm px-2 py-0.5">
                            <Clock className="h-3 w-3 mr-1" /> {Math.floor(qz.time_limit_seconds / 60)} Menit
                          </Badge>
                          <Badge className="text-[10px] md:text-xs font-black text-slate-900 bg-yellow-300 border-2 border-slate-900 uppercase shadow-[2px_2px_0px_#0f172a] px-2 py-0.5">
                            <Trophy className="h-3 w-3 mr-1" /> +{qz.xp_reward} XP
                          </Badge>
                          <Badge className="text-[10px] md:text-xs font-bold text-blue-900 bg-white border-2 border-blue-300 uppercase shadow-sm border-dashed px-2 py-0.5">
                             {qCount} Rintangan
                          </Badge>
                        </div>
                      </div>
                      <Button className="w-full sm:w-auto mt-3 sm:mt-0 h-12 bg-blue-400 hover:bg-blue-300 text-slate-900 font-black uppercase tracking-wider border-2 md:border-4 border-slate-900 shadow-[2px_2px_0px_#0f172a] md:shadow-[4px_4px_0px_#0f172a] group-hover:translate-x-1 group-hover:shadow-[4px_4px_0px_#0f172a] md:group-hover:shadow-[6px_6px_0px_#0f172a] transition-all rounded-xl shrink-0 text-xs md:text-sm">
                        Mulai Ujian <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* ================== DISKUSI (FORUM) ================== */}
          <TabsContent value="discussions" className="space-y-6 focus:outline-none focus-visible:ring-0 mt-0">

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-emerald-200 border-2 md:border-4 border-slate-900 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-[4px_4px_0px_#0f172a] md:shadow-[6px_6px_0px_#0f172a]">
              <div>
                <h3 className="font-black text-slate-900 text-xl md:text-3xl flex items-center gap-2 md:gap-3"><MessageSquare className="h-6 w-6 md:h-8 md:w-8 text-emerald-800" /> Forum Diskusi</h3>
                <p className="text-xs md:text-base font-bold text-slate-800 mt-1 md:mt-2 bg-white/50 px-2 md:px-3 py-1 rounded-lg w-fit border-2 border-slate-900 border-dashed">Ada kendala? Tanya komandan atau teman di sini.</p>
              </div>

              <Dialog open={isDiscussOpen} onOpenChange={setIsDiscussOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-black text-sm md:text-base h-12 md:h-14 px-4 md:px-6 rounded-xl md:rounded-[1rem] border-2 md:border-4 border-slate-900 shadow-[2px_2px_0px_#0f172a] md:shadow-[4px_4px_0px_#0f172a] hover:-translate-y-1 hover:shadow-[4px_4px_0px_#0f172a] md:hover:shadow-[6px_6px_0px_#0f172a] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all uppercase tracking-wider">
                    <Pencil className="mr-2 h-4 w-4 md:h-5 md:w-5" /> Topik Baru
                  </Button>
                </DialogTrigger>
                <DialogContent className="border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] md:shadow-[10px_10px_0px_#0f172a] rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 max-w-lg bg-[#FDFBF7] w-[95vw] md:w-full">
                  <DialogHeader><DialogTitle className="font-black text-2xl md:text-3xl text-slate-900 uppercase">Topik Baru</DialogTitle></DialogHeader>
                  <form onSubmit={handleCreateDiscussion} className="space-y-4 md:space-y-6 mt-2 md:mt-4">
                    <div className="space-y-2">
                      <Label className="font-black text-slate-900 uppercase text-xs md:text-sm">Judul Masalah</Label>
                      <Input value={newTopicTitle} onChange={e => setNewTopicTitle(e.target.value)} placeholder="Singkat dan jelas..." className="h-12 md:h-14 border-2 md:border-4 border-slate-900 font-bold rounded-xl focus-visible:ring-0 focus:shadow-[2px_2px_0px_#0f172a] md:focus:shadow-[4px_4px_0px_#0f172a] transition-all bg-white text-sm md:text-base" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black text-slate-900 uppercase text-xs md:text-sm">Detail Masalah</Label>
                      <Textarea className="min-h-[100px] md:min-h-[160px] border-2 md:border-4 border-slate-900 font-medium resize-none rounded-xl focus-visible:ring-0 focus:shadow-[2px_2px_0px_#0f172a] md:focus:shadow-[4px_4px_0px_#0f172a] transition-all p-3 md:p-4 bg-white text-sm md:text-base" value={newTopicContent} onChange={e => setNewTopicContent(e.target.value)} placeholder="Tuliskan selengkapnya di sini..." required />
                    </div>
                    <Button type="submit" className="w-full h-12 md:h-16 bg-emerald-400 hover:bg-emerald-300 text-slate-900 text-base md:text-xl font-black border-2 md:border-4 border-slate-900 shadow-[2px_2px_0px_#0f172a] md:shadow-[4px_4px_0px_#0f172a] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none rounded-xl uppercase transition-all" disabled={isSubmittingTopic}>
                      {isSubmittingTopic ? <Loader2 className="animate-spin mr-2 h-5 w-5 md:h-6 md:w-6" /> : "Sebarkan Topik"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {classData.discussions.length === 0 ? (
              <div className="text-center py-10 md:py-16 bg-white rounded-[1.5rem] md:rounded-[2rem] border-2 md:border-4 border-dashed border-slate-300">
                <MessageSquare className="h-12 w-12 md:h-16 md:w-16 text-slate-300 mx-auto mb-3 md:mb-4" />
                <p className="font-black text-lg md:text-2xl text-slate-400 uppercase tracking-widest">Belum ada suara.</p>
              </div>
            ) : (
              <div className="space-y-4 md:space-y-8 mt-4 md:mt-8">
                {classData.discussions.map((topic) => {
                  const isTopicOwner = currentUser?.id === topic.user_id;
                  const canDeleteTopic = isTopicOwner || currentUserRole === 'guru' || currentUserRole === 'admin';

                  return (
                    <Card key={topic.id} className="border-2 md:border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] md:shadow-[8px_8px_0px_#0f172a] rounded-[1.2rem] md:rounded-[2rem] overflow-hidden bg-white">
                      <div
                        className="p-4 md:p-8 cursor-pointer hover:bg-emerald-50 transition-colors group relative"
                        onClick={() => { 
                          if (editingTopicId !== topic.id) {
                            setExpandedTopic(expandedTopic === topic.id ? null : topic.id)
                            setReplyingTo(null)
                          }
                        }}
                      >
                        <div className="flex flex-col lg:flex-row justify-between items-start gap-3 md:gap-4">
                          <div className="flex gap-3 md:gap-5 w-full items-start">
                            <Avatar className="h-10 w-10 md:h-14 md:w-14 border-2 md:border-4 border-slate-900 shadow-[2px_2px_0px_#0f172a] shrink-0 transform group-hover:rotate-6 transition-transform bg-white">
                              <AvatarImage src={topic.profiles?.avatar_url} />
                              <AvatarFallback className="font-black text-sm md:text-lg bg-orange-300 text-slate-900">{topic.profiles?.full_name?.[0]}</AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              {editingTopicId === topic.id ? (
                                <div className="space-y-2 md:space-y-4" onClick={e => e.stopPropagation()}>
                                  <Input value={editTopicTitle} onChange={e => setEditTopicTitle(e.target.value)} className="h-10 md:h-12 font-black border-2 md:border-4 border-slate-900 rounded-lg md:rounded-xl text-sm md:text-base" />
                                  <Textarea value={editTopicContent} onChange={e => setEditTopicContent(e.target.value)} className="font-medium min-h-[80px] md:min-h-[100px] border-2 md:border-4 border-slate-900 resize-none rounded-lg md:rounded-xl text-sm md:text-base" />
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={() => handleUpdateDiscussion(topic.id)} className="h-8 md:h-12 px-3 md:px-6 bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-black border-2 md:border-4 border-slate-900 shadow-[2px_2px_0px_#0f172a] active:shadow-none active:translate-y-1 rounded-lg md:rounded-xl text-xs md:text-sm"><Check className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" /> Simpan</Button>
                                    <Button size="sm" variant="outline" onClick={() => setEditingTopicId(null)} className="h-8 md:h-12 px-3 md:px-6 font-black border-2 md:border-4 border-slate-900 hover:bg-slate-100 rounded-lg md:rounded-xl text-xs md:text-sm"><X className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" /> Batal</Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <h4 className="font-black text-slate-900 text-base md:text-2xl leading-tight group-hover:text-emerald-700 transition-colors pr-2 md:pr-4">{topic.title}</h4>
                                  <div className="flex items-center flex-wrap gap-1.5 md:gap-2 text-[9px] md:text-xs font-bold text-slate-500 mt-1 md:mt-2">
                                    <span className="text-violet-700 bg-violet-100 px-1.5 md:px-2 py-0.5 rounded md:rounded-md border border-violet-200 uppercase tracking-wider">{topic.profiles?.full_name}</span>
                                    <span className="hidden sm:inline">•</span>
                                    <span>{new Date(topic.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                    {isEdited(topic.created_at, topic.updated_at) && <span className="text-slate-400 italic font-bold">(Diedit)</span>}
                                    {topic.profiles?.role === 'guru' && <Badge className="text-[8px] md:text-[10px] h-3 md:h-5 border md:border-2 border-slate-900 text-slate-900 bg-yellow-400 ml-1 font-black shadow-sm uppercase px-1">Master</Badge>}
                                  </div>
                                  <p className="mt-2 md:mt-4 text-slate-700 text-xs md:text-lg font-medium whitespace-pre-wrap leading-relaxed">{topic.content}</p>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between lg:justify-start lg:flex-col gap-2 md:gap-3 shrink-0 w-full lg:w-auto mt-3 lg:mt-0 border-t-2 lg:border-t-0 border-slate-100 pt-3 lg:pt-0">
                            <Badge className="bg-slate-100 border-2 md:border-4 border-slate-900 text-slate-900 font-black flex items-center gap-1 md:gap-1.5 shadow-[2px_2px_0px_#0f172a] px-2.5 md:px-4 py-1 md:py-1.5 text-xs md:text-base rounded-lg md:rounded-xl">
                              <MessageSquare className="h-3 w-3 md:h-5 md:w-5" /> {topic.replies?.length || 0}
                            </Badge>
                            {canDeleteTopic && editingTopicId !== topic.id && (
                              <div className="flex gap-1.5 md:gap-2" onClick={e => e.stopPropagation()}>
                                {isTopicOwner && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7 md:h-10 md:w-10 text-slate-500 bg-blue-50 border md:border-2 border-blue-200 hover:bg-blue-200 hover:text-blue-800 hover:border-blue-900 shadow-sm rounded-md md:rounded-xl transition-all" onClick={() => { setEditTopicTitle(topic.title); setEditTopicContent(topic.content); setEditingTopicId(topic.id) }}><Pencil className="h-3 w-3 md:h-4 md:w-4" /></Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-7 w-7 md:h-10 md:w-10 text-slate-500 bg-red-50 border md:border-2 border-red-200 hover:bg-red-200 hover:text-red-800 hover:border-red-900 shadow-sm rounded-md md:rounded-xl transition-all" onClick={(e) => handleDeleteDiscussion(topic.id, e)}><Trash2 className="h-3 w-3 md:h-4 md:w-4" /></Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ====== AREA BALASAN BERSARANG (NESTED REPLIES) ====== */}
                      {expandedTopic === topic.id && (
                        <div className="bg-slate-100 border-t-2 md:border-t-4 border-slate-900 p-3 md:p-8">

                          <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                            {topic.replies && topic.replies.length > 0 ? (
                              (() => {
                                const topLevel = topic.replies.filter(r => !r.parent_reply_id)
                                const getChildren = (parentId: string) => topic.replies.filter(r => r.parent_reply_id === parentId)

                                const renderReply = (reply: Reply, isChild: boolean = false) => {
                                  const isReplyOwner = currentUser?.id === reply.user_id;
                                  const canDeleteReply = isReplyOwner || currentUserRole === 'guru' || currentUserRole === 'admin';

                                  return (
                                    <div key={reply.id} className="space-y-2 md:space-y-3 mt-2 md:mt-3">
                                      <div className={cn("bg-white p-3 md:p-5 rounded-xl md:rounded-2xl border-2 md:border-4 shadow-[2px_2px_0px_#0f172a] md:shadow-[4px_4px_0px_#0f172a] flex flex-col gap-2 md:gap-3 relative", isChild ? "border-emerald-600 md:border-emerald-700 ml-6 sm:ml-10 md:ml-16 mt-4" : "border-slate-900 mt-4")}>
                                        {/* Tali Penghubung Komentar Anak */}
                                        {isChild && (
                                          <div className="absolute -left-6 sm:-left-10 md:-left-16 top-6 md:top-8 w-6 sm:w-10 md:w-16 h-4 border-b-2 md:border-b-4 border-l-2 md:border-l-4 border-emerald-600 md:border-emerald-700 rounded-bl-xl z-0"></div>
                                        )}
                                        
                                        <div className="flex justify-between items-start gap-2 z-10 relative bg-white">
                                          <div className="flex items-center gap-2 md:gap-3 w-full">
                                            <Avatar className="h-6 w-6 md:h-10 md:w-10 border md:border-2 border-slate-900 shrink-0"><AvatarImage src={reply.profiles?.avatar_url} /><AvatarFallback className="bg-violet-300 font-black text-slate-900 text-[10px] md:text-sm">{reply.profiles?.full_name?.[0]}</AvatarFallback></Avatar>
                                            <div className="flex flex-row items-center gap-1.5 md:gap-2 flex-wrap min-w-0">
                                              <span className="font-black text-xs md:text-base text-slate-900 truncate">{reply.profiles?.full_name}</span>
                                              {reply.profiles?.role === 'guru' && <Badge className="text-[8px] md:text-[10px] h-3 md:h-5 bg-yellow-400 text-slate-900 border md:border-2 border-slate-900 px-1 font-black uppercase">Master</Badge>}
                                              <span className="text-[9px] md:text-xs font-bold text-slate-400 hidden sm:inline-block">• {new Date(reply.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
                                              {isEdited(reply.created_at, reply.updated_at) && <span className="text-slate-400 italic font-bold text-[9px] md:text-xs">(Diedit)</span>}
                                            </div>
                                          </div>

                                          <div className="flex gap-1 md:gap-2 shrink-0">
                                            {!isChild && (
                                              <Button variant="ghost" size="icon" className="h-6 w-6 md:h-8 md:w-8 text-slate-500 hover:bg-emerald-100 hover:text-emerald-800 border md:border-2 border-transparent hover:border-emerald-900 rounded md:rounded-lg transition-all" onClick={() => { setReplyingTo({ replyId: reply.id, userName: reply.profiles?.full_name }); document.getElementById(`reply-input-${topic.id}`)?.focus() }}><MessageSquare className="h-3 w-3 md:h-4 md:w-4" /></Button>
                                            )}
                                            {canDeleteReply && editingReplyId !== reply.id && (
                                              <>
                                                {isReplyOwner && (
                                                  <Button variant="ghost" size="icon" className="h-6 w-6 md:h-8 md:w-8 text-slate-500 hover:bg-blue-100 hover:text-blue-800 border md:border-2 border-transparent hover:border-blue-900 rounded md:rounded-lg transition-all" onClick={() => { setEditReplyContent(reply.content); setEditingReplyId(reply.id) }}><Pencil className="h-3 w-3 md:h-4 md:w-4" /></Button>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-6 w-6 md:h-8 md:w-8 text-slate-500 hover:bg-red-100 hover:text-red-800 border md:border-2 border-transparent hover:border-red-900 rounded md:rounded-lg transition-all" onClick={() => handleDeleteReply(reply.id)}><Trash2 className="h-3 w-3 md:h-4 md:w-4" /></Button>
                                              </>
                                            )}
                                          </div>
                                        </div>

                                        {editingReplyId === reply.id ? (
                                          <div className="mt-1 md:mt-2 space-y-2 relative z-10 bg-white">
                                            <Textarea value={editReplyContent} onChange={(e) => setEditReplyContent(e.target.value)} className="text-xs md:text-base min-h-[60px] md:min-h-[80px] font-medium border-2 md:border-4 border-slate-900 rounded-lg md:rounded-xl p-2" />
                                            <div className="flex gap-1.5 md:gap-2">
                                              <Button size="sm" className="h-7 md:h-10 px-2 md:px-4 bg-emerald-400 text-slate-900 font-black border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-md md:rounded-lg text-[10px] md:text-sm uppercase tracking-wider" onClick={() => handleUpdateReply(reply.id)}>Simpan</Button>
                                              <Button size="sm" variant="outline" className="h-7 md:h-10 px-2 md:px-4 font-black border-2 border-slate-900 hover:bg-slate-100 rounded-md md:rounded-lg text-[10px] md:text-sm uppercase tracking-wider" onClick={() => setEditingReplyId(null)}>Batal</Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <p className="text-xs md:text-base font-medium text-slate-800 whitespace-pre-wrap leading-relaxed relative z-10 bg-white mt-1 md:mt-0">{reply.content}</p>
                                        )}
                                      </div>
                                      
                                      {/* Render Children (Recursive) */}
                                      {!isChild && getChildren(reply.id).map(child => renderReply(child, true))}
                                    </div>
                                  )
                                }

                                return topLevel.map(reply => renderReply(reply))
                              })()
                            ) : (
                              <p className="text-xs md:text-lg font-black text-slate-400 uppercase tracking-widest text-center py-4 md:py-6 bg-white border-2 md:border-4 border-slate-300 border-dashed rounded-xl md:rounded-2xl">Belum ada yang menyahut.</p>
                            )}
                          </div>

                          {/* KOTAK KETIK BALASAN */}
                          {replyingTo && (
                            <div className="flex items-center justify-between bg-emerald-100 border-2 border-emerald-900 text-emerald-900 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-sm font-bold shadow-sm mb-2 md:mb-3">
                              <span>Membalas <span className="font-black">{replyingTo.userName}</span></span>
                              <Button variant="ghost" size="icon" className="h-5 w-5 md:h-6 md:w-6 hover:bg-emerald-200 rounded-full" onClick={() => setReplyingTo(null)}><X className="h-3 w-3 md:h-4 md:w-4" /></Button>
                            </div>
                          )}
                          <div className="flex gap-2 md:gap-4 relative bg-emerald-300 p-2 md:p-5 rounded-xl md:rounded-2xl border-2 md:border-4 border-slate-900 shadow-[2px_2px_0px_#0f172a] md:shadow-[6px_6px_0px_#0f172a]">
                            <Avatar className="h-8 w-8 md:h-12 md:w-12 border-2 md:border-4 border-slate-900 hidden sm:block shrink-0 shadow-[2px_2px_0px_#0f172a] bg-white mt-1"><AvatarImage src={currentUser?.user_metadata?.avatar_url} /><AvatarFallback className="bg-slate-200 font-black text-slate-900">U</AvatarFallback></Avatar>
                            <div className="flex-1 relative w-full">
                              <Textarea
                                id={`reply-input-${topic.id}`}
                                className="min-h-[50px] md:min-h-[80px] bg-white border-2 md:border-4 border-slate-900 font-medium resize-none pr-12 md:pr-16 py-2.5 md:py-4 focus-visible:ring-0 focus:shadow-[2px_2px_0px_#0f172a] md:focus:shadow-[4px_4px_0px_#0f172a] rounded-lg md:rounded-xl text-xs md:text-base"
                                placeholder={replyingTo ? `Membalas ${replyingTo.userName}...` : "Ketik komentar..."}
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                              />
                              <Button
                                size="icon"
                                className="absolute bottom-1.5 right-1.5 md:bottom-3 md:right-3 bg-violet-500 hover:bg-violet-400 text-white border-2 md:border-4 border-slate-900 shadow-[2px_2px_0px_#0f172a] md:shadow-[4px_4px_0px_#0f172a] active:shadow-none active:translate-y-1 h-8 w-8 md:h-12 md:w-12 shrink-0 rounded-lg md:rounded-xl transition-all"
                                onClick={() => handleSendReply(topic.id)}
                                disabled={isReplying || !replyContent.trim()}
                              >
                                {isReplying ? <Loader2 className="animate-spin h-4 w-4 md:h-6 md:w-6 text-slate-900" /> : <Send className="h-3 w-3 md:h-6 md:w-6" />}
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

          {/* ================== ABSENSI (GELAR PASUKAN) ================== */}
          <TabsContent value="attendance" className="space-y-4 focus:outline-none focus-visible:ring-0 mt-0">
            <div className="bg-cyan-200 border-2 md:border-4 border-slate-900 p-6 md:p-12 rounded-[1.5rem] md:rounded-[32px] shadow-[6px_6px_0px_#0f172a] md:shadow-[8px_8px_0px_#0f172a] max-w-2xl mx-auto flex flex-col items-center text-center mt-4">
              <div className="h-16 w-16 md:h-24 md:w-24 bg-white border-2 md:border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-full flex items-center justify-center mb-4 md:mb-6 transform -rotate-6">
                <Fingerprint className="h-8 w-8 md:h-12 md:w-12 text-slate-900" />
              </div>
              <h3 className="text-xl md:text-3xl font-black text-slate-900 uppercase">Sandi Pasukan</h3>
              <p className="font-bold text-xs md:text-base text-slate-700 mt-2 mb-6 md:mb-8 bg-white/50 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl border-2 border-slate-900 border-dashed inline-block">Masukkan kode rahasia dari komandan untuk absen.</p>
              
              <form onSubmit={handleAttendanceSubmit} className="w-full flex flex-col gap-3 md:gap-4">
                <Input 
                  value={attendanceCode} 
                  onChange={e => setAttendanceCode(e.target.value)} 
                  placeholder="R3H4S1A..." 
                  className="h-12 md:h-16 text-center text-lg md:text-2xl font-black uppercase tracking-widest border-2 md:border-4 border-slate-900 rounded-xl md:rounded-2xl focus-visible:ring-0 focus:shadow-[2px_2px_0px_#0f172a] md:focus:shadow-[4px_4px_0px_#0f172a] transition-all bg-white"
                  maxLength={10}
                />
                <Button 
                  type="submit" 
                  disabled={isSubmittingAttendance || !attendanceCode.trim()} 
                  className="h-14 md:h-16 w-full text-base md:text-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 font-black tracking-widest uppercase border-2 md:border-4 border-slate-900 shadow-[4px_4px_0px_#0891b2] rounded-xl md:rounded-2xl hover:-translate-y-1 hover:shadow-[4px_4px_0px_#0891b2] md:hover:shadow-[6px_6px_0px_#0891b2] active:translate-y-1 active:shadow-none transition-all"
                >
                  {isSubmittingAttendance ? <Loader2 className="animate-spin mr-2 h-5 w-5 md:h-6 md:w-6" /> : "GABUNG BARISAN"}
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>

        {/* ====== DELETE CONFIRM DIALOG ====== */}
        <Dialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
          <DialogContent className="border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] md:shadow-[12px_12px_0px_#0f172a] rounded-[1.5rem] md:rounded-[24px] w-[90vw] max-w-sm p-6 md:p-8 bg-[#FDFBF7]">
            <DialogHeader>
              <DialogTitle className="font-black text-xl md:text-2xl text-red-600 flex items-center gap-2 uppercase">
                <Trash2 className="h-5 w-5 md:h-6 md:w-6"/> Pemusnahan
              </DialogTitle>
            </DialogHeader>
            <p className="font-bold text-slate-600 my-2 md:my-4 text-sm md:text-base leading-relaxed">
               Tindakan ini tidak bisa dibatalkan. {deleteDialog?.type === 'discussion' ? 'Yakin hapus topik ini beserta seluruh balasannya?' : 'Yakin hapus balasan ini?'}
            </p>
            <div className="flex gap-3 md:gap-4 justify-end mt-2">
              <Button variant="outline" onClick={() => setDeleteDialog(null)} className="font-black border-2 border-slate-900 uppercase text-xs md:text-sm h-10 md:h-12 px-4 md:px-6">Batal</Button>
              <Button onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 text-slate-900 font-black border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] uppercase text-xs md:text-sm h-10 md:h-12 px-4 md:px-6">Musnahkan</Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  )
}