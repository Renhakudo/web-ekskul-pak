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
    ChevronLeft, AlertTriangle, Loader2, Play
} from 'lucide-react'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'
import { updateLearningStreak } from '@/lib/streak-utils'

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
    kkm?: number
    max_attempts?: number
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
    const [answers, setAnswers] = useState<Record<string, number>>({})
    const [timeLeft, setTimeLeft] = useState(0)
    const [phase, setPhase] = useState<'loading' | 'intro' | 'playing' | 'result'>('loading')
    const [result, setResult] = useState<{ score: number; correct: number; total: number } | null>(null)
    const [alreadyAttempted, setAlreadyAttempted] = useState(false)
    const [attemptsCount, setAttemptsCount] = useState(0)
    const [userId, setUserId] = useState<string | null>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    const fetchData = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        setUserId(user.id)

        const [quizRes, questionsRes, attemptsRes] = await Promise.all([
            supabase.from('quizzes').select('*').eq('id', quizId).single(),
            supabase.from('quiz_questions').select('*').eq('quiz_id', quizId).order('created_at'),
            supabase.from('quiz_attempts').select('score').eq('quiz_id', quizId).eq('user_id', user.id).order('score', { ascending: false }),
        ])

        if (quizRes.data) { setQuiz(quizRes.data); setTimeLeft(quizRes.data.time_limit_seconds || 600) }
        if (questionsRes.data) setQuestions(questionsRes.data)

        let reachedMax = false
        if (attemptsRes.data) {
            setAttemptsCount(attemptsRes.data.length)
            const limit = quizRes.data?.max_attempts ?? 1
            if (limit > 0 && attemptsRes.data.length >= limit) {
                reachedMax = true
                setAlreadyAttempted(true)
                setResult({ score: attemptsRes.data[0].score, correct: 0, total: questionsRes.data?.length || 0 })
            }
        }

        setLoading(false)
        setPhase(reachedMax ? 'result' : 'intro')
    }, [quizId])

    useEffect(() => { fetchData() }, [fetchData])

    useEffect(() => {
        if (phase !== 'playing') return

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!)
                    handleSubmit(true)
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

        let correct = 0
        questions.forEach(q => {
            const chosen = answers[q.id]
            if (chosen !== undefined && q.options[chosen]?.is_correct) correct++
        })

        const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0
        const xpEarned = Math.round((score / 100) * (quiz.xp_reward || 100))

        await supabase.from('quiz_attempts').insert({
            quiz_id: quizId,
            user_id: userId,
            score,
            answers,
            completed_at: new Date().toISOString(),
        })

        if (xpEarned > 0 && attemptsCount === 0) {
            const { data: profile } = await supabase.from('profiles').select('points').eq('id', userId).single()
            await supabase.from('profiles').update({ points: (profile?.points || 0) + xpEarned }).eq('id', userId)
            await supabase.from('points_logs').insert({
                user_id: userId,
                source: `quiz_${quizId}`,
                points: xpEarned
            })
        }

        // Update learning streak setelah berhasil mengerjakan quiz
        updateLearningStreak(userId, supabase).catch(() => { })

        setResult({ score, correct, total: questions.length })
        setPhase('result')
        setSubmitting(false)

        const kkm = quiz.kkm || 70
        if (score >= kkm) {
            confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 }, colors: ['#f472b6', '#34d399', '#fbbf24', '#f87171', '#8b5cf6'] })
        }
    }

    const currentQuestion = questions[currentIdx]
    const progress = ((currentIdx + 1) / questions.length) * 100
    const answeredCount = Object.keys(answers).length

    // --- RENDER STATES ---
    if (loading || phase === 'loading') return (
        <div className="min-h-screen flex flex-col gap-4 items-center justify-center bg-slate-50">
            <Loader2 className="h-16 w-16 animate-spin text-slate-900" />
            <div className="font-black text-2xl text-slate-900 uppercase">Menyiapkan Ruang Ujian...</div>
        </div>
    )

    if (!quiz) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="bg-red-200 border-4 border-slate-900 p-8 rounded-3xl font-black text-2xl text-slate-900 shadow-[8px_8px_0px_#0f172a] transform rotate-2">Quiz Lenyap!</div>
        </div>
    )

    // --- INTRO SCREEN ---
    if (phase === 'intro') return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center p-6 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]">
            <Card className="max-w-2xl w-full mx-auto shadow-[12px_12px_0px_#0f172a] border-4 border-slate-900 rounded-[32px] overflow-hidden bg-white">
                <div className="bg-amber-300 border-b-4 border-slate-900 p-10 text-slate-900 text-center relative overflow-hidden">
                    <Trophy className="h-24 w-24 mx-auto mb-6 text-slate-900 drop-shadow-md transform hover:rotate-12 transition-all duration-300" />
                    <h1 className="text-4xl md:text-5xl font-black mb-3 uppercase tracking-tighter drop-shadow-sm leading-tight relative z-10">{quiz.title}</h1>
                    <p className="font-bold text-slate-800 bg-white/60 inline-block px-4 py-1.5 rounded-xl border-2 border-slate-900 relative z-10">Uji seberapa sakti akal sehatmu.</p>
                </div>
                <CardContent className="p-8 md:p-10 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                        <div className="bg-slate-100 border-4 border-slate-900 rounded-2xl p-6 shadow-[4px_4px_0px_#0f172a] transform -rotate-1">
                            <div className="text-4xl font-black text-slate-900 mb-1">{questions.length}</div>
                            <div className="text-xs font-black uppercase text-slate-500 tracking-widest">Rintangan</div>
                        </div>
                        <div className="bg-slate-100 border-4 border-slate-900 rounded-2xl p-6 shadow-[4px_4px_0px_#0f172a] transform rotate-1">
                            <div className="text-4xl font-black text-slate-900 mb-1">{formatTime(quiz.time_limit_seconds)}</div>
                            <div className="text-xs font-black uppercase text-slate-500 tracking-widest">Waktu</div>
                        </div>
                        <div className="bg-emerald-300 border-4 border-slate-900 rounded-2xl p-6 shadow-[4px_4px_0px_#0f172a]">
                            <div className="text-4xl font-black text-slate-900 mb-1">+{quiz.xp_reward}</div>
                            <div className="text-xs font-black uppercase text-slate-800 tracking-widest">Kekuatan (XP)</div>
                        </div>
                    </div>

                    <div className="bg-blue-100 border-4 border-slate-900 rounded-2xl p-4 md:p-6 text-base font-bold text-slate-900 flex items-start gap-4 shadow-[4px_4px_0px_#0f172a]">
                        <AlertTriangle className="h-8 w-8 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xl font-black uppercase mb-1 underline decoration-blue-400 decoration-4">Sistem Aturan Ujian</p>
                            Nilai Lulus Minimal: <span className="bg-blue-300 px-2 py-0.5 border-2 border-slate-900 rounded mx-1">{quiz.kkm || 70}</span><br />
                            Batas Kesempatan: {
                                (quiz.max_attempts || 1) === 0 ? <span className="text-emerald-600 ml-1">Tak Terbatas (Unlimited)</span> : 
                                <span className="text-red-500 ml-1">Maksimal {quiz.max_attempts || 1} Kali</span>
                            }<br />
                            Kamu sudah mencoba: <span className="font-black text-xl">{attemptsCount}</span> kali.<br />
                            <span className="text-sm text-slate-500 bg-white/60 px-2 py-1 border-2 border-slate-300 rounded inline-block mt-2">CATATAN: Hadiah XP hanya dicairkan pada penyelesaian pertama.</span>
                        </div>
                    </div>

                    <div className="flex flex-col-reverse md:flex-row gap-4 pt-4 border-t-4 border-slate-900">
                        <Link href={`/dashboard/classes/${classId}`} className="w-full md:w-auto">
                            <Button className="w-full h-16 bg-white hover:bg-slate-100 text-slate-900 font-black text-lg border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_#0f172a] hover:-translate-y-1 transition-all uppercase">
                                <ArrowLeft className="h-6 w-6 mr-3" /> Kabur
                            </Button>
                        </Link>
                        <Button
                            className="w-full flex-1 h-16 bg-slate-900 hover:bg-slate-800 text-emerald-400 font-black text-xl md:text-2xl border-4 border-transparent hover:border-slate-900 shadow-[6px_6px_0px_#34d399] rounded-xl hover:-translate-y-1 transition-all uppercase tracking-widest"
                            onClick={() => setPhase('playing')}
                            disabled={questions.length === 0}
                        >
                            Hadapi Sekarang <Play className="h-6 w-6 ml-3 fill-emerald-400" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )

    // --- RESULT SCREEN ---
    if (phase === 'result' && result) {
        const passed = result.score >= (quiz.kkm || 70)
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]">
                <Card className="max-w-xl w-full shadow-[12px_12px_0px_#0f172a] border-4 border-slate-900 rounded-[32px] overflow-hidden bg-white">
                    <div className={cn(
                        "p-10 border-b-4 border-slate-900 text-center relative",
                        passed ? "bg-emerald-400 text-slate-900" : "bg-red-400 text-slate-900"
                    )}>
                        {passed
                            ? <CheckCircle2 className="h-24 w-24 mx-auto mb-4 drop-shadow-md" />
                            : <XCircle className="h-24 w-24 mx-auto mb-4 drop-shadow-md" />
                        }
                        <h1 className="text-5xl md:text-7xl font-black mb-2 tracking-tighter drop-shadow-sm">{result.score} / 100</h1>
                        <p className="font-bold text-lg md:text-xl bg-white/40 inline-flex items-center gap-2 px-4 py-1.5 border-2 border-slate-900 rounded-xl mt-2">
                            {passed ? <><Trophy className="h-5 w-5" /> Lulus KKM dengan Gemilang!</> : <><AlertTriangle className="h-5 w-5" /> Gagal Mencapai Target KKM — Jangan Nyerah!</>}
                        </p>
                    </div>
                    <CardContent className="p-8 md:p-10 space-y-8">
                        {!alreadyAttempted && (
                            <div className="grid grid-cols-2 gap-6 text-center">
                                <div className="bg-white border-4 border-slate-900 rounded-2xl p-6 shadow-[4px_4px_0px_#0f172a] transform -rotate-2">
                                    <div className="text-4xl font-black text-slate-900 mb-1">
                                        {result.correct}<span className="text-xl text-slate-400">/{result.total}</span>
                                    </div>
                                    <div className="text-xs font-black uppercase tracking-widest text-slate-500">Hit Tepat Sasaran</div>
                                </div>
                                <div className="bg-yellow-300 border-4 border-slate-900 rounded-2xl p-6 shadow-[4px_4px_0px_#0f172a] transform rotate-1">
                                    <div className="text-4xl font-black text-slate-900 mb-1">
                                        +{Math.round((result.score / 100) * (quiz.xp_reward || 100))}
                                    </div>
                                    <div className="text-xs font-black uppercase tracking-widest text-slate-800">XP Baru Didapat</div>
                                </div>
                            </div>
                        )}
                        {alreadyAttempted && (
                            <div className="bg-amber-100 border-4 border-slate-900 rounded-2xl p-6 text-center shadow-[4px_4px_0px_#0f172a]">
                                <h3 className="font-black text-slate-900 text-xl uppercase mb-2">Batas Kesempatan Habis</h3>
                                <p className="font-bold text-slate-600">Terima kasih atas perjuangan abadimu.<br />Sistem mencatat skor terbaikmu demi integritas nilai.</p>
                            </div>
                        )}
                        <Link href={`/dashboard/classes/${classId}`} className="block pt-4 border-t-4 border-slate-900">
                            <Button className="w-full h-16 bg-violet-500 hover:bg-violet-400 text-slate-900 font-black text-xl border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] uppercase tracking-wider rounded-xl transition-all hover:translate-y-1 hover:shadow-none">
                                Kembali Ke Markas Utama
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // --- PLAYING SCREEN ---
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">

            {/* Quiz Header */}
            <header className="bg-amber-300 text-slate-900 border-b-4 border-slate-900 px-4 md:px-8 py-4 flex items-center justify-between shrink-0 shadow-[0_4px_0_#0f172a] z-10 relative">
                <div className="flex items-center gap-3 bg-white px-4 py-2 border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_#0f172a] transform -rotate-1">
                    <span className="text-xs font-black text-slate-500 uppercase">Soal</span>
                    <span className="font-black text-xl text-slate-900">{currentIdx + 1} <span className="text-sm text-slate-400">/ {questions.length}</span></span>
                </div>

                <h2 className="font-black text-xl line-clamp-1 max-w-sm hidden lg:block uppercase bg-white/50 px-4 py-1.5 border-2 border-slate-900 rounded-lg">{quiz.title}</h2>

                <div className={cn(
                    "flex items-center gap-3 font-black text-xl lg:text-3xl tabular-nums bg-slate-900 px-5 py-2 border-4 border-transparent rounded-xl shadow-[4px_4px_0px_#0f172a] transform rotate-1",
                    timeLeft < 60 ? "text-red-400 border-red-400 animate-pulse bg-slate-900" : "text-emerald-400"
                )}>
                    <Clock className="h-6 w-6 lg:h-8 lg:w-8" />
                    {formatTime(timeLeft)}
                </div>
            </header>

            {/* Progress Bar */}
            <div className="bg-slate-900 p-2">
                <Progress value={progress} className="h-4 bg-slate-700 rounded-full [&>div]:bg-pink-500" />
            </div>

            {/* Question */}
            <main className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col">
                <div className="flex-1 mt-6">
                    <Card className="shadow-[8px_8px_0px_#0f172a] border-4 border-slate-900 rounded-[32px] overflow-hidden bg-white">
                        <CardContent className="p-6 md:p-10">
                            <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-8 leading-relaxed uppercase bg-slate-100 p-6 rounded-2xl border-4 border-slate-900 shadow-inner">
                                {currentQuestion?.question}
                            </h3>

                            <div className="grid gap-4">
                                {currentQuestion?.options.map((opt, idx) => {
                                    const isSelected = answers[currentQuestion.id] === idx
                                    const Alphabet = String.fromCharCode(65 + idx)
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleSelectOption(currentQuestion.id, idx)}
                                            className={cn(
                                                "w-full text-left p-4 md:p-5 rounded-2xl border-4 font-bold text-lg md:text-xl transition-all flex items-center shadow-sm",
                                                isSelected
                                                    ? "border-emerald-500 bg-emerald-100 text-slate-900 shadow-[4px_4px_0px_#10b981] transform translate-x-2"
                                                    : "border-slate-300 bg-white hover:border-slate-900 hover:bg-slate-50 text-slate-700 hover:shadow-[4px_4px_0px_#0f172a]"
                                            )}
                                        >
                                            <span className={cn(
                                                "shrink-0 flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl text-lg md:text-xl font-black mr-4 border-2 border-slate-900",
                                                isSelected ? "bg-emerald-500 text-slate-900" : "bg-slate-100 text-slate-400"
                                            )}>
                                                {Alphabet}
                                            </span>
                                            <span className="flex-1">{opt.text}</span>

                                            {isSelected && (
                                                <CheckCircle2 className="h-8 w-8 text-emerald-600 shrink-0 ml-4 hidden sm:block" />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Navigation Controls */}
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 py-6 px-2">
                    <Button
                        disabled={currentIdx === 0}
                        onClick={() => setCurrentIdx(i => i - 1)}
                        className="w-full sm:w-auto h-16 px-8 bg-white text-slate-900 font-black border-4 border-slate-900 rounded-2xl uppercase tracking-widest text-lg disabled:opacity-50 disabled:shadow-none hover:-translate-y-1 shadow-[4px_4px_0px_#0f172a] transition-all"
                    >
                        <ChevronLeft className="h-6 w-6 mr-2" /> Mundur
                    </Button>

                    <div className="hidden md:flex bg-slate-900 text-white font-black px-6 py-2 rounded-xl border-4 border-slate-900 shadow-[4px_4px_0px_#cbd5e1] transform rotate-1 uppercase">
                        {answeredCount} Terjawab
                    </div>

                    {currentIdx < questions.length - 1 ? (
                        <Button
                            onClick={() => setCurrentIdx(i => i + 1)}
                            className="w-full sm:w-auto h-16 px-8 bg-violet-400 hover:bg-violet-300 text-slate-900 font-black border-4 border-slate-900 rounded-2xl uppercase tracking-widest text-lg hover:-translate-y-1 shadow-[6px_6px_0px_#0f172a] transition-all"
                        >
                            Gas Maju <ChevronRight className="h-6 w-6 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={() => handleSubmit(false)}
                            disabled={submitting}
                            className="w-full sm:w-auto h-16 px-10 bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-black border-4 border-slate-900 rounded-2xl uppercase tracking-widest text-lg md:text-xl hover:-translate-y-1 shadow-[6px_6px_0px_#0f172a] transition-all animate-pulse hover:animate-none"
                        >
                            {submitting ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <CheckCircle2 className="h-6 w-6 mr-3" />}
                            Akhiri & Lapor
                        </Button>
                    )}
                </div>
            </main>
        </div>
    )
}
