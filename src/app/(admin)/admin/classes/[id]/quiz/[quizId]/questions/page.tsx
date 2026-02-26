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
import { ArrowLeft, Plus, Trash2, Loader2, CheckCircle2, HelpCircle } from 'lucide-react'

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

    // Form state: soal baru yang sedang dibuat
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
            supabase.from('quiz_questions').select('*').eq('quiz_id', quizId).order('order_index'),
        ])
        if (quizRes.data) setQuiz(quizRes.data)
        if (questionsRes.data) setQuestions(questionsRes.data)
        setLoading(false)
    }, [quizId])

    useEffect(() => { fetchData() }, [fetchData])

    const handleOptionChange = (idx: number, text: string) => {
        setNewOptions(prev => prev.map((o, i) => i === idx ? { ...o, text } : o))
    }

    const handleCorrectChange = (idx: number) => {
        // Hanya satu jawaban benar (radio behavior)
        setNewOptions(prev => prev.map((o, i) => ({ ...o, is_correct: i === idx })))
    }

    const handleAddQuestion = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newQuestion.trim()) return
        const filledOptions = newOptions.filter(o => o.text.trim())
        if (filledOptions.length < 2) { alert('Minimal 2 pilihan jawaban.'); return }
        if (!filledOptions.some(o => o.is_correct)) { alert('Pilih satu jawaban yang benar.'); return }

        setSaving(true)
        const { error } = await supabase.from('quiz_questions').insert({
            quiz_id: quizId,
            question: newQuestion.trim(),
            options: filledOptions,
            order_index: questions.length,
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
        }
        setSaving(false)
    }

    const handleDeleteQuestion = async (qId: string) => {
        if (!confirm('Hapus soal ini?')) return
        await supabase.from('quiz_questions').delete().eq('id', qId)
        fetchData()
    }

    const optionLabels = ['A', 'B', 'C', 'D']

    if (loading) return (
        <div className="p-8 max-w-3xl mx-auto space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
        </div>
    )

    return (
        <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">

            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href={`/admin/classes/${classId}`}>
                    <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{quiz?.title}</h1>
                    <div className="flex items-center gap-3 mt-1">
                        <Badge variant="outline" className="text-xs text-slate-500">
                            {questions.length} soal
                        </Badge>
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">
                            +{quiz?.xp_reward} XP
                        </Badge>
                        <Badge variant="outline" className="text-xs text-slate-500">
                            {Math.floor((quiz?.time_limit_seconds || 0) / 60)} menit
                        </Badge>
                    </div>
                </div>
            </div>

            {/* EXISTING QUESTIONS */}
            {questions.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-base font-bold text-slate-700">Daftar Soal ({questions.length})</h2>
                    {questions.map((q, idx) => (
                        <Card key={q.id} className="border-slate-200 shadow-sm">
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start gap-4 mb-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                                            {idx + 1}
                                        </div>
                                        <p className="font-semibold text-slate-900 leading-snug">{q.question}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-400 hover:text-red-600 shrink-0"
                                        onClick={() => handleDeleteQuestion(q.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {q.options.map((opt, oIdx) => (
                                        <div
                                            key={oIdx}
                                            className={`flex items-center gap-2 p-2.5 rounded-lg text-sm border ${opt.is_correct
                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold'
                                                    : 'bg-slate-50 border-slate-200 text-slate-600'
                                                }`}
                                        >
                                            <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${opt.is_correct ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                                                }`}>
                                                {optionLabels[oIdx]}
                                            </span>
                                            {opt.is_correct && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                                            {opt.text}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {questions.length === 0 && (
                <div className="text-center py-8 border border-dashed border-slate-300 rounded-2xl bg-slate-50">
                    <HelpCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Belum ada soal. Tambah soal pertama di bawah!</p>
                </div>
            )}

            {/* ADD QUESTION FORM */}
            <Card className="shadow-sm border-slate-200">
                <CardContent className="p-6">
                    <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
                        <Plus className="h-5 w-5 text-emerald-600" /> Tambah Soal Baru
                    </h2>
                    <form onSubmit={handleAddQuestion} className="space-y-5">

                        <div>
                            <Label className="text-sm font-semibold">Pertanyaan *</Label>
                            <Input
                                value={newQuestion}
                                onChange={e => setNewQuestion(e.target.value)}
                                placeholder="Tulis pertanyaan di sini..."
                                required
                                className="mt-1.5 h-11"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-semibold">Pilihan Jawaban</Label>
                            <p className="text-xs text-slate-400">Aktifkan toggle di sebelah kanan untuk menandai jawaban yang benar.</p>
                            {newOptions.map((opt, idx) => (
                                <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${opt.is_correct ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'
                                    }`}>
                                    <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${opt.is_correct ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                                        }`}>
                                        {optionLabels[idx]}
                                    </span>
                                    <Input
                                        value={opt.text}
                                        onChange={e => handleOptionChange(idx, e.target.value)}
                                        placeholder={`Pilihan ${optionLabels[idx]}`}
                                        className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 p-0 h-8"
                                    />
                                    <div className="flex items-center gap-2 shrink-0">
                                        {opt.is_correct && (
                                            <span className="text-xs text-emerald-600 font-bold">Benar</span>
                                        )}
                                        <Switch
                                            checked={opt.is_correct}
                                            onCheckedChange={() => handleCorrectChange(idx)}
                                            className="data-[state=checked]:bg-emerald-600"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 font-semibold h-11"
                        >
                            {saving
                                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Menyimpan...</>
                                : <><Plus className="h-4 w-4 mr-2" /> Tambahkan Soal</>
                            }
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
