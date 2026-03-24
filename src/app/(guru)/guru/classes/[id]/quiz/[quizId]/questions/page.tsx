'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Trash2, Loader2, CheckCircle2, HelpCircle, Settings, Save, Edit2 } from 'lucide-react'

interface QuizQuestion {
    id: string
    question: string
    options: { text: string; is_correct: boolean }[]
    order_index: number
}

interface Quiz {
    id: string
    title: string
    xp_reward: number
    time_limit_seconds: number
    kkm?: number
    max_attempts?: number
}

export default function QuizQuestionsPage({
    params
}: {
    params: Promise<{ id: string; quizId: string }>
}) {
    const { id: classId, quizId } = use(params)
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [quiz, setQuiz] = useState<Quiz | null>(null)
    const [questions, setQuestions] = useState<QuizQuestion[]>([])

    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [editQTitle, setEditQTitle] = useState('')
    const [editQTimeLimit, setEditQTimeLimit] = useState(600)
    const [editQXP, setEditQXP] = useState(100)
    const [editQKKM, setEditQKKM] = useState(70)
    const [editQMaxAttempts, setEditQMaxAttempts] = useState(1)

    const [isEditQOpen, setIsEditQOpen] = useState(false)
    const [editQuestionId, setEditQuestionId] = useState<string | null>(null)
    const [editQuestionText, setEditQuestionText] = useState('')
    const [editQuestionOptions, setEditQuestionOptions] = useState<{text: string, is_correct: boolean}[]>([])

    const [qToDelete, setQToDelete] = useState<string | null>(null)

    const [newQuestion, setNewQuestion] = useState('')
    const [newOptions, setNewOptions] = useState([
        { text: '', is_correct: true },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
    ])

    const fetchData = useCallback(async () => {
        setLoading(true)
        const [quizRes, questionsRes] = await Promise.all([
            supabase.from('quizzes').select('*').eq('id', quizId).single(),
            supabase.from('quiz_questions').select('*').eq('quiz_id', quizId).order('created_at'),
        ])
        if (quizRes.data) {
            setQuiz(quizRes.data)
            setEditQTitle(quizRes.data.title)
            setEditQTimeLimit(quizRes.data.time_limit_seconds || 600)
            setEditQXP(quizRes.data.xp_reward || 100)
            setEditQKKM(quizRes.data.kkm || 70)
            setEditQMaxAttempts(quizRes.data.max_attempts ?? 1)
        }
        if (questionsRes.data) setQuestions(questionsRes.data)
        setLoading(false)
    }, [quizId])

    useEffect(() => { fetchData() }, [fetchData])

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        const { error } = await supabase.from('quizzes').update({
            title: editQTitle,
            time_limit_seconds: editQTimeLimit,
            xp_reward: editQXP,
            kkm: editQKKM,
            max_attempts: editQMaxAttempts
        }).eq('id', quizId)

        if (!error) {
            toast.success('Pengaturan kuis berhasil disimpan!')
            setIsSettingsOpen(false)
            fetchData()
        } else {
            toast.error('Gagal menyimpan: ' + error.message)
        }
        setSaving(false)
    }

    const handleOptionChange = (idx: number, text: string) => {
        setNewOptions(prev => prev.map((o, i) => i === idx ? { ...o, text } : o))
    }

    const handleCorrectChange = (idx: number) => {
        setNewOptions(prev => prev.map((o, i) => ({ ...o, is_correct: i === idx })))
    }

    const handleAddQuestion = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newQuestion.trim()) return
        const filledOptions = newOptions.filter(o => o.text.trim())
        if (filledOptions.length < 2) { toast.error('Minimal 2 pilihan yang sah.'); return }
        const correctOpt = filledOptions.find(o => o.is_correct)
        if (!correctOpt) { toast.error('Mesti ada sebuah kebenaran di antara kepalsuan.'); return }

        setSaving(true)
        const { error } = await supabase.from('quiz_questions').insert({
            quiz_id: quizId,
            question: newQuestion.trim(),
            options: filledOptions,
            correct_answer: filledOptions.find(o => o.is_correct)?.text || '',
        })

        if (!error) {
            setNewQuestion('')
            setNewOptions([
                { text: '', is_correct: true },
                { text: '', is_correct: false },
                { text: '', is_correct: false },
                { text: '', is_correct: false },
            ])
            fetchData()
        } else {
            console.error("DEBUG ERROR", error)
            toast.error('Gagal merekam: ' + error.message)
        }
        setSaving(false)
    }

    const handleDeleteQuestion = async (qId: string) => {
        setQToDelete(qId)
    }

    const confirmDeleteQuestion = async () => {
        if (!qToDelete) return
        await supabase.from('quiz_questions').delete().eq('id', qToDelete)
        setQToDelete(null)
        fetchData()
        toast.success('Pertanyaan berhasil dimusnahkan.')
    }

    const openEditQuestion = (q: QuizQuestion) => {
        setEditQuestionId(q.id)
        setEditQuestionText(q.question)
        
        // Pad options to 4 if less than 4
        const opts = q.options.map(o => ({...o}))
        while(opts.length < 4) {
            opts.push({ text: '', is_correct: false })
        }
        setEditQuestionOptions(opts)
        setIsEditQOpen(true)
    }

    const handleSaveEditQuestion = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editQuestionText.trim() || !editQuestionId) return
        const filledOptions = editQuestionOptions.filter(o => o.text.trim())
        if (filledOptions.length < 2) { toast.error('Minimal 2 pilihan yang sah.'); return }
        const correctOpt = filledOptions.find(o => o.is_correct)
        if (!correctOpt) { toast.error('Mesti ada sebuah kebenaran di antara kepalsuan.'); return }

        setSaving(true)
        const { error } = await supabase.from('quiz_questions').update({
            question: editQuestionText.trim(),
            options: filledOptions,
            correct_answer: correctOpt.text || '',
        }).eq('id', editQuestionId)

        if (!error) {
            toast.success('Soal berhasil diperbarui!')
            setIsEditQOpen(false)
            fetchData()
        } else {
            console.error("DEBUG ERROR", error)
            toast.error('Gagal memperbarui soal: ' + error.message)
        }
        setSaving(false)
    }

    const optionLabels = ['A', 'B', 'C', 'D']

    if (loading) return (
        <div className="p-8 max-w-4xl mx-auto space-y-6 mt-10">
            <Skeleton className="h-24 w-full rounded-2xl bg-emerald-100 border-4 border-slate-900" />
            <Skeleton className="h-[400px] w-full rounded-[32px] bg-slate-200 border-4 border-slate-900" />
        </div>
    )

    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-10 min-h-screen font-sans">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-emerald-300 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] p-6 md:p-8 relative overflow-hidden">
                <div className="flex items-center gap-5 relative z-10 w-full">
                    <Link href={`/guru/classes/${classId}`} className="shrink-0">
                        <Button size="icon" className="h-12 w-12 bg-white text-slate-900 border-4 border-slate-900 shadow-[2px_2px_0px_#0f172a] hover:bg-slate-200 rounded-2xl transform rotate-3 hover:rotate-0 transition-transform">
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                    </Link>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 flex items-center gap-3 truncate">
                            {quiz?.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-3 mt-3">
                            <Badge className="bg-slate-100 text-slate-900 font-black border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] px-3 py-1 uppercase text-xs">
                                {questions.length} JEBAKAN
                            </Badge>
                            <Badge className="bg-yellow-300 text-slate-900 font-black border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] px-3 py-1 uppercase text-xs">
                                +{quiz?.xp_reward} XP
                            </Badge>
                            <Badge className="bg-slate-900 text-white font-black border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] px-3 py-1 uppercase text-xs">
                                {Math.floor((quiz?.time_limit_seconds || 0) / 60)} MENIT NAFAS
                            </Badge>
                            <Button onClick={() => setIsSettingsOpen(true)} className="ml-2 bg-slate-900 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] hover:bg-slate-800 text-white font-black px-3 h-8 rounded-lg text-xs hover:-translate-y-0.5 transition-all">
                                <Settings className="w-3 h-3 mr-2"/> UBAH PENGATURAN
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* EXISTING QUESTIONS */}
            {questions.length > 0 && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                        <div className="bg-emerald-400 p-2 rounded-xl border-4 border-slate-900 shadow-sm transform -rotate-2">
                            <HelpCircle className="h-6 w-6 text-slate-900" />
                        </div>
                        Papan Interogasi ({questions.length})
                    </h2>

                    <div className="grid gap-6">
                        {questions.map((q, idx) => (
                            <Card key={q.id} className="border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-[24px] overflow-hidden bg-white">
                                <CardContent className="p-0">
                                    <div className="bg-slate-100 border-b-4 border-slate-900 p-5 flex justify-between items-start gap-4">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="w-10 h-10 bg-slate-900 text-emerald-400 rounded-xl flex items-center justify-center font-black text-lg border-2 border-emerald-400 shadow-[2px_2px_0px_#34d399] shrink-0 transform -rotate-3">
                                                {idx + 1}
                                            </div>
                                            <p className="font-black text-xl text-slate-900 leading-snug mt-1">{q.question}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 text-slate-600 bg-emerald-200 hover:bg-emerald-400 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] hover:text-slate-900 rounded-xl shrink-0 hover:-translate-y-1 transition-all"
                                                onClick={() => openEditQuestion(q)}
                                                title="Revisi Soal"
                                            >
                                                <Edit2 className="h-5 w-5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 text-slate-600 bg-red-200 hover:bg-red-400 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] hover:text-white rounded-xl shrink-0 hover:-translate-y-1 transition-all"
                                                onClick={() => handleDeleteQuestion(q.id)}
                                                title="Musnahkan"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white">
                                        {q.options.map((opt, oIdx) => (
                                            <div
                                                key={oIdx}
                                                className={`flex items-start gap-3 p-4 rounded-xl border-4 transition-all ${opt.is_correct
                                                    ? 'bg-emerald-100 border-emerald-400 shadow-[4px_4px_0px_#34d399]'
                                                    : 'bg-slate-50 border-slate-200 text-slate-500'
                                                    }`}
                                            >
                                                <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-black shrink-0 border-2 ${opt.is_correct ? 'bg-emerald-400 text-slate-900 border-slate-900 shadow-sm' : 'bg-slate-200 text-slate-400 border-transparent'
                                                    }`}>
                                                    {optionLabels[oIdx]}
                                                </span>
                                                <div className={`mt-1 font-bold ${opt.is_correct ? 'text-slate-900' : 'text-slate-600'}`}>
                                                    {opt.text}
                                                </div>
                                                {opt.is_correct && <CheckCircle2 className="h-6 w-6 text-emerald-600 ml-auto shrink-0 mt-0.5" />}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {questions.length === 0 && (
                <div className="text-center py-16 border-4 border-dashed border-slate-300 rounded-[32px] bg-slate-50">
                    <HelpCircle className="h-16 w-16 text-slate-300 mx-auto mb-4 transform rotate-12" />
                    <p className="font-black text-2xl text-slate-400 uppercase">Kekosongan Total</p>
                    <p className="font-bold text-slate-500 mt-2">Mulai merakit pertanyaan maut di form berikut.</p>
                </div>
            )}

            {/* ADD QUESTION FORM */}
            <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] overflow-hidden bg-white mt-8">
                <CardContent className="p-0">
                    <div className="bg-yellow-300 border-b-4 border-slate-900 p-6">
                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 uppercase">
                            <Plus className="h-8 w-8 text-slate-900 bg-white p-1 rounded-lg border-2 border-slate-900 shadow-sm" /> Rancang Pertanyaan Baru
                        </h2>
                    </div>
                    <form onSubmit={handleAddQuestion} className="p-6 md:p-8 space-y-8">

                        <div className="space-y-3">
                            <Label className="text-lg font-black text-slate-900">Deskripsi Pertanyaan *</Label>
                            <Input
                                value={newQuestion}
                                onChange={e => setNewQuestion(e.target.value)}
                                placeholder="Apa inti dari tata surya kita?..."
                                required
                                className="h-14 border-4 border-slate-900 rounded-xl font-bold text-lg shadow-sm focus:shadow-[4px_4px_0px_#0f172a] transition-all"
                            />
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label className="text-lg font-black text-slate-900">Opsi Jawaban</Label>
                                <p className="text-sm font-bold text-slate-500 mt-1">Aktifkan tuas hijau di satu opsi untuk menetapkan mana yang BENAR.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {newOptions.map((opt, idx) => (
                                    <div key={idx} className={`flex flex-col gap-3 p-4 rounded-xl border-4 transition-colors ${opt.is_correct ? 'border-emerald-400 bg-emerald-50 shadow-[4px_4px_0px_#34d399]' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 focus-within:border-slate-400'
                                        }`}>
                                        <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
                                            <span className={`px-3 py-1 rounded-md text-sm font-black tracking-widest uppercase border-2 ${opt.is_correct ? 'bg-emerald-400 text-slate-900 border-slate-900 shadow-[2px_2px_0px_#0f172a]' : 'bg-slate-200 text-slate-500 border-transparent'
                                                }`}>
                                                Pilihan {optionLabels[idx]}
                                            </span>
                                            <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border-2 border-slate-200">
                                                <span className={`text-xs font-black uppercase ${opt.is_correct ? 'text-emerald-600' : 'text-slate-400'}`}>{opt.is_correct ? 'BENAR' : 'SALAH'}</span>
                                                <Switch
                                                    checked={opt.is_correct}
                                                    onCheckedChange={() => handleCorrectChange(idx)}
                                                    className={`data-[state=checked]:bg-emerald-500 ${!opt.is_correct && 'bg-slate-300'}`}
                                                />
                                            </div>
                                        </div>
                                        <Input
                                            value={opt.text}
                                            onChange={e => handleOptionChange(idx, e.target.value)}
                                            placeholder={`Ketik isi opsi ${optionLabels[idx]}...`}
                                            className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 rounded-none h-10 font-bold text-slate-900 text-base"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={saving}
                            className="w-full h-16 bg-slate-900 hover:bg-slate-800 text-emerald-400 font-black text-xl border-4 border-transparent hover:border-slate-900 shadow-[6px_6px_0px_#34d399] rounded-2xl transition-all hover:-translate-y-1 uppercase tracking-widest"
                        >
                            {saving
                                ? <><Loader2 className="h-6 w-6 animate-spin mr-3" /> Menyuntikkan Data...</>
                                : <><Plus className="h-6 w-6 mr-3" /> Rekam Pertanyaan</>
                            }
                        </Button>
                    </form>
                </CardContent>
            </Card>
            {/* SETTINGS DIALOG */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent className="border-4 border-slate-900 shadow-[12px_12px_0px_#0f172a] rounded-[32px] sm:max-w-xl">
                    <DialogHeader><DialogTitle className="font-black text-2xl uppercase">Pengaturan Esensial Kuis</DialogTitle></DialogHeader>
                    <form onSubmit={handleUpdateSettings} className="space-y-5 mt-4">
                        <div className="space-y-2">
                            <Label className="font-black">Nama Kuis / Ujian</Label>
                            <Input value={editQTitle} onChange={e => setEditQTitle(e.target.value)} required className="h-12 border-4 border-slate-900 font-bold" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-black">Durasi Waktu (Detik)</Label>
                                <Input type="number" value={editQTimeLimit} onChange={e => setEditQTimeLimit(Number(e.target.value))} min={60} step={60} className="h-12 border-4 border-slate-900 font-bold" />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-black">Reward XP</Label>
                                <Input type="number" value={editQXP} onChange={e => setEditQXP(Number(e.target.value))} min={10} step={10} className="h-12 border-4 border-slate-900 font-bold" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-black">Nilai KKM Lulus (0-100)</Label>
                                <Input type="number" value={editQKKM} onChange={e => setEditQKKM(Number(e.target.value))} min={0} max={100} className="h-12 border-4 border-slate-900 font-bold" />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-black">Batas Mengerjakan</Label>
                                <Input type="number" value={editQMaxAttempts} onChange={e => setEditQMaxAttempts(Number(e.target.value))} min={0} className="h-12 border-4 border-slate-900 font-bold" />
                                <p className="text-xs font-bold text-slate-500">0 = Bebas (Unlimited)</p>
                            </div>
                        </div>
                        <Button type="submit" disabled={saving} className="w-full h-12 bg-yellow-400 text-slate-900 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:bg-yellow-300 transition-all hover:-translate-y-1">
                            <Save className="w-5 h-5 mr-2" /> Simpan Pengaturan
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* EDIT QUESTION DIALOG */}
            <Dialog open={isEditQOpen} onOpenChange={setIsEditQOpen}>
                <DialogContent className="border-4 border-slate-900 shadow-[12px_12px_0px_#0f172a] rounded-[32px] sm:max-w-2xl bg-slate-50 overflow-y-auto max-h-[90vh]">
                    <DialogHeader className="border-b-4 border-slate-900 pb-4 mb-2"><DialogTitle className="font-black text-2xl uppercase flex items-center gap-2"><Edit2 className="w-6 h-6"/> Revisi Pertanyaan</DialogTitle></DialogHeader>
                    <form onSubmit={handleSaveEditQuestion} className="space-y-6 mt-4">
                        <div className="space-y-3">
                            <Label className="text-lg font-black text-slate-900">Deskripsi Pertanyaan *</Label>
                            <Input
                                value={editQuestionText}
                                onChange={e => setEditQuestionText(e.target.value)}
                                required
                                className="h-14 border-4 border-slate-900 rounded-xl font-bold text-lg bg-white"
                            />
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label className="text-lg font-black text-slate-900">Opsi Jawaban</Label>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {editQuestionOptions.map((opt, idx) => (
                                    <div key={idx} className={`flex flex-col gap-3 p-4 rounded-xl border-4 transition-colors ${opt.is_correct ? 'border-emerald-400 bg-emerald-50 shadow-[4px_4px_0px_#34d399]' : 'border-slate-300 bg-white hover:border-slate-400'
                                        }`}>
                                        <div className="flex items-center justify-between border-b-2 border-slate-200 pb-2">
                                            <span className={`px-2 py-1 mx-1 rounded-md text-sm font-black uppercase border-2 ${opt.is_correct ? 'bg-emerald-400 text-slate-900 border-slate-900' : 'bg-slate-200 text-slate-500 border-transparent'
                                                }`}>
                                                Pilihan {optionLabels[idx]}
                                            </span>
                                            <div className="flex items-center gap-2 px-2">
                                                <Switch
                                                    checked={opt.is_correct}
                                                    onCheckedChange={() => setEditQuestionOptions(prev => prev.map((o, i) => ({ ...o, is_correct: i === idx })))}
                                                    className={`data-[state=checked]:bg-emerald-500`}
                                                />
                                            </div>
                                        </div>
                                        <Input
                                            value={opt.text}
                                            onChange={e => setEditQuestionOptions(prev => prev.map((o, i) => i === idx ? { ...o, text: e.target.value } : o))}
                                            placeholder={`Isi opsi ${optionLabels[idx]}...`}
                                            className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-10 font-bold"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button type="submit" disabled={saving} className="w-full h-14 bg-emerald-400 text-slate-900 font-black text-lg border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] hover:bg-emerald-300 transition-all hover:-translate-y-1">
                            {saving ? <Loader2 className="h-6 w-6 animate-spin mr-2"/> : <Save className="w-6 h-6 mr-2" />} TERAPKAN REVISI
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DELETE CONFIRM DIALOG */}
            <Dialog open={!!qToDelete} onOpenChange={(open) => !open && setQToDelete(null)}>
                <DialogContent className="border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[24px]">
                    <DialogHeader>
                        <DialogTitle className="font-black text-2xl text-red-600 flex items-center gap-2">
                            <Trash2 className="h-6 w-6"/> Musnahkan Teka-teki?
                        </DialogTitle>
                    </DialogHeader>
                    <p className="font-bold text-slate-600 my-4">Tindakan ini tidak bisa dibatalkan. Apakah Anda yakin ingin membuang pertanyaan ini ke jurang ketiadaan?</p>
                    <div className="flex gap-4 justify-end">
                        <Button variant="outline" onClick={() => setQToDelete(null)} className="font-bold border-2 border-slate-900">Batal</Button>
                        <Button onClick={confirmDeleteQuestion} className="bg-red-500 hover:bg-red-600 text-white font-black border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]">Ya, Musnahkan!</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
