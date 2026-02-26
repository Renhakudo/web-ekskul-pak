'use client'

import { useState, useEffect, use, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    ArrowLeft, Clock, Trophy, CheckCircle2, XCircle, ChevronRight,
    ChevronLeft, AlertTriangle, Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'

interface Question {
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
    class_id: string
}

export default function QuizAttemptPage({
    params
}: {
    params: Promise<{ id: string; quizId: string }>
}) {
    const { id: classId, quizId } = use(params)
    const supabase = createClient()
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [quiz, setQuiz] = useState<Quiz | null>(null)
    const [questions, setQuestions] = useState<Question[]>([])
    const [currentIdx, setCurrentIdx] = useState(0)
    const [answers, setAnswers] = useState<Record<string, number>>({}) // {questionId: optionIndex}
    const [timeLeft, setTimeLeft] = useState(0)
    const [phase, setPhase] = useState<'loading' | 'intro' | 'playing' | 'result'>('loading')
    const [result, setResult] = useState<{ score: number; correct: number; total: number } | null>(null)
    const [alreadyAttempted, setAlreadyAttempted] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    const fetchData = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        setUserId(user.id)

        const [quizRes, questionsRes, attemptRes] = await Promise.all([
            supabase.from('quizzes').select('*').eq('id', quizId).single(),
            supabase.from('quiz_questions').select('*').eq('quiz_id', quizId).order('order_index'),
            supabase.from('quiz_attempts').select('score').eq('quiz_id', quizId).eq('user_id', user.id).single(),
        ])

        if (quizRes.data) { setQuiz(quizRes.data); setTimeLeft(quizRes.data.time_limit_seconds) }
        if (questionsRes.data) setQuestions(questionsRes.data)
        if (attemptRes.data) { setAlreadyAttempted(true); setResult({ score: attemptRes.data.score, correct: 0, total: questionsRes.data?.length || 0 }) }

        setLoading(false)
        setPhase(attemptRes.data ? 'result' : 'intro')
    }, [quizId])

    useEffect(() => { fetchData() }, [fetchData])

    // Timer countdown
    useEffect(() => {
        if (phase !== 'playing') return

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!)
                    handleSubmit(true) // Auto submit saat waktu habis
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [phase])

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0')
        const s = (secs % 60).toString().padStart(2, '0')
        return `${m}:${s}`
    }

    const handleSelectOption = (questionId: string, optionIdx: number) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionIdx }))
    }

    const handleSubmit = async (autoSubmit = false) => {
        if (timerRef.current) clearInterval(timerRef.current)
        if (!userId || !quiz) return
        setSubmitting(true)

        // Hitung skor
        let correct = 0
        questions.forEach(q => {
            const chosen = answers[q.id]
            if (chosen !== undefined && q.options[chosen]?.is_correct) correct++
        })

        const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0
        const xpEarned = Math.round((score / 100) * (quiz.xp_reward || 100))

        // Simpan attempt
        await supabase.from('quiz_attempts').insert({
            quiz_id: quizId,
            user_id: userId,
            score,
            answers,
            completed_at: new Date().toISOString(),
        })

        // Tambah XP jika lulus (≥ 60)
        if (xpEarned > 0) {
            const { data: profile } = await supabase.from('profiles').select('points').eq('id', userId).single()
            await supabase.from('profiles').update({ points: (profile?.points || 0) + xpEarned }).eq('id', userId)
            await supabase.from('points_logs').insert({
                user_id: userId,
                source: `quiz_${quizId}`,
                points: xpEarned
            })
        }

        setResult({ score, correct, total: questions.length })
        setPhase('result')
        setSubmitting(false)

        if (score >= 60) {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } })
        }
    }

    const currentQuestion = questions[currentIdx]
    const progress = ((currentIdx + 1) / questions.length) * 100
    const answeredCount = Object.keys(answers).length

    // --- RENDER STATES ---
    if (loading || phase === 'loading') return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
        </div>
    )

    if (!quiz) return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-slate-500">Quiz tidak ditemukan.</p>
        </div>
    )

    // --- INTRO SCREEN ---
    if (phase === 'intro') return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <Card className="max-w-lg w-full shadow-xl border-0 overflow-hidden">
                <div className="bg-gradient-to-br from-violet-600 to-indigo-700 p-8 text-white text-center">
                    <Trophy className="h-16 w-16 mx-auto mb-4 opacity-80" />
                    <h1 className="text-2xl font-black mb-2">{quiz.title}</h1>
                    <p className="text-violet-200 text-sm">Kerjakan dengan jujur dan fokus!</p>
                </div>
                <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center py-4">
                        <div>
                            <div className="text-2xl font-black text-slate-900">{questions.length}</div>
                            <div className="text-xs text-slate-500">Soal</div>
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900">{formatTime(quiz.time_limit_seconds)}</div>
                            <div className="text-xs text-slate-500">Waktu</div>
                        </div>
                        <div>
                            <div className="text-2xl font-black text-violet-600">+{quiz.xp_reward} XP</div>
                            <div className="text-xs text-slate-500">Reward</div>
                        </div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                        <AlertTriangle className="h-4 w-4 inline mr-1" />
                        Quiz hanya bisa dikerjakan <strong>1 kali</strong>. Pastikan kamu sudah siap!
                    </div>
                    <div className="flex gap-3">
                        <Link href={`/dashboard/classes/${classId}`} className="flex-1">
                            <Button variant="outline" className="w-full"><ArrowLeft className="h-4 w-4 mr-1" /> Kembali</Button>
                        </Link>
                        <Button
                            className="flex-1 bg-violet-600 hover:bg-violet-700 font-bold"
                            onClick={() => setPhase('playing')}
                            disabled={questions.length === 0}
                        >
                            Mulai Quiz! →
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )

    // --- RESULT SCREEN ---
    if (phase === 'result' && result) {
        const passed = result.score >= 60
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <Card className="max-w-lg w-full shadow-xl border-0 overflow-hidden">
                    <div className={cn(
                        "p-8 text-white text-center",
                        passed ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-gradient-to-br from-slate-700 to-slate-900"
                    )}>
                        {passed
                            ? <CheckCircle2 className="h-16 w-16 mx-auto mb-4" />
                            : <XCircle className="h-16 w-16 mx-auto mb-4 opacity-80" />
                        }
                        <h1 className="text-3xl font-black mb-1">{result.score}%</h1>
                        <p className="text-white/80">{passed ? 'Quiz Lulus! Selamat 🎉' : 'Belum Lulus — Tetap Semangat!'}</p>
                    </div>
                    <CardContent className="p-6 space-y-4">
                        {!alreadyAttempted && (
                            <div className="grid grid-cols-2 gap-4 text-center py-2">
                                <div>
                                    <div className="text-2xl font-black text-slate-900">
                                        {result.correct}/{result.total}
                                    </div>
                                    <div className="text-xs text-slate-500">Jawaban Benar</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-black text-violet-600">
                                        +{Math.round((result.score / 100) * (quiz.xp_reward || 100))} XP
                                    </div>
                                    <div className="text-xs text-slate-500">XP Didapat</div>
                                </div>
                            </div>
                        )}
                        {alreadyAttempted && (
                            <div className="text-center text-sm text-slate-500 py-2">
                                Kamu sudah mengerjakan quiz ini sebelumnya.
                            </div>
                        )}
                        <Link href={`/dashboard/classes/${classId}`}>
                            <Button className="w-full bg-violet-600 hover:bg-violet-700 font-bold">
                                Kembali ke Kelas
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // --- PLAYING SCREEN ---
    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">

            {/* Quiz Header */}
            <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
                <div className="text-sm font-medium text-slate-400">
                    Soal <span className="text-white font-bold">{currentIdx + 1}</span> / {questions.length}
                </div>
                <h2 className="font-bold text-sm line-clamp-1 max-w-xs hidden sm:block">{quiz.title}</h2>
                <div className={cn(
                    "flex items-center gap-2 font-bold text-lg tabular-nums",
                    timeLeft < 60 ? "text-red-400 animate-pulse" : "text-emerald-400"
                )}>
                    <Clock className="h-5 w-5" />
                    {formatTime(timeLeft)}
                </div>
            </header>

            {/* Progress Bar */}
            <div className="bg-slate-800 px-6 py-2">
                <Progress value={progress} className="h-1.5 bg-slate-700 [&>div]:bg-violet-500" />
            </div>

            {/* Question */}
            <main className="flex-1 flex items-center justify-center p-4 md:p-8">
                <div className="w-full max-w-2xl space-y-6">
                    <Card className="shadow-lg border-0">
                        <CardContent className="p-6 md:p-8">
                            <Badge variant="outline" className="mb-4 text-violet-600 border-violet-200">
                                Soal {currentIdx + 1}
                            </Badge>
                            <p className="text-xl font-bold text-slate-900 mb-6 leading-relaxed">
                                {currentQuestion?.question}
                            </p>

                            <div className="grid gap-3">
                                {currentQuestion?.options.map((opt, idx) => {
                                    const isSelected = answers[currentQuestion.id] === idx
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleSelectOption(currentQuestion.id, idx)}
                                            className={cn(
                                                "w-full text-left p-4 rounded-xl border-2 font-medium text-sm transition-all",
                                                isSelected
                                                    ? "border-violet-500 bg-violet-50 text-violet-900"
                                                    : "border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/50 text-slate-700"
                                            )}
                                        >
                                            <span className={cn(
                                                "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold mr-3",
                                                isSelected ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"
                                            )}>
                                                {String.fromCharCode(65 + idx)}
                                            </span>
                                            {opt.text}
                                        </button>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Navigation */}
                    <div className="flex items-center justify-between gap-4">
                        <Button
                            variant="outline"
                            disabled={currentIdx === 0}
                            onClick={() => setCurrentIdx(i => i - 1)}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Sebelumnya
                        </Button>

                        <span className="text-xs text-slate-500">{answeredCount}/{questions.length} dijawab</span>

                        {currentIdx < questions.length - 1 ? (
                            <Button onClick={() => setCurrentIdx(i => i + 1)} className="bg-violet-600 hover:bg-violet-700">
                                Selanjutnya <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        ) : (
                            <Button
                                onClick={() => handleSubmit(false)}
                                disabled={submitting}
                                className="bg-emerald-600 hover:bg-emerald-700 font-bold"
                            >
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                                Selesai & Kumpulkan
                            </Button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
