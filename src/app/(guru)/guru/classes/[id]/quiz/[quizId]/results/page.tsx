'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, Trophy, Clock, Target, Users, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function AdminQuizResultsPage({
  params
}: {
  params: Promise<{ id: string, quizId: string }>
}) {
  const { id: classId, quizId } = use(params)
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [quiz, setQuiz] = useState<any>(null)
  const [results, setResults] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true)

      // Fetch Quiz Data
      const { data: qz } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single()

      if (qz) setQuiz(qz)

      // Fetch Submissions + Profiles
      const { data: subs } = await supabase
        .from('quiz_submissions')
        .select(`
          id,
          score,
          xp_earned,
          time_taken_seconds,
          completed_at,
          user_id,
          profiles (
            id,
            first_name,
            last_name,
            username,
            avatar_url,
            points
          )
        `)
        .eq('quiz_id', quizId)
        .order('score', { ascending: false })
        .order('time_taken_seconds', { ascending: true }) // Tie-breaker: waktu tercepat

      if (subs) {
        setResults(subs)
      }

      setLoading(false)
    }

    fetchResults()
  }, [quizId])

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4 bg-slate-50 min-h-screen">
      <Loader2 className="animate-spin h-14 w-14 text-slate-900" />
      <p className="font-black text-2xl text-slate-900 uppercase tracking-widest animate-pulse">Menghitung Skor Penderitaan...</p>
    </div>
  )

  if (!quiz) return <div className="p-8 text-center font-black text-2xl">Quiz Tidak Ditemukan!</div>

  const filteredResults = results.filter(r => {
    const name = `${r.profiles?.first_name} ${r.profiles?.last_name}`.toLowerCase()
    return name.includes(searchQuery.toLowerCase()) || r.profiles?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Calculate stats
  const averageScore = results.length > 0 ? Math.round(results.reduce((acc, curr) => acc + curr.score, 0) / results.length) : 0
  const kkm = quiz.kkm || 70
  const passCount = results.filter(r => r.score >= kkm).length

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-100 font-sans">
      <header className="h-20 bg-amber-400 flex items-center justify-between px-6 lg:px-10 border-b-4 border-slate-900 shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link href={`/guru/classes/${classId}`}>
            <Button size="icon" className="bg-white hover:bg-slate-200 text-slate-900 border-4 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-black text-xl lg:text-2xl text-slate-900 uppercase flex items-center gap-2">
             Papan Klasemen <span className="hidden md:inline text-slate-700 bg-amber-200 px-2 py-1 rounded-md text-sm border-2 border-slate-900 rotate-2">{quiz.title}</span>
          </h1>
        </div>
      </header>

      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-slate-900 rounded-[24px] p-6 shadow-[6px_6px_0px_#0f172a] flex items-center gap-4 transform hover:-translate-y-1 transition-all">
            <div className="h-14 w-14 rounded-2xl bg-blue-300 border-4 border-slate-900 flex items-center justify-center -rotate-6 shrink-0">
              <Users className="h-6 w-6 text-slate-900" />
            </div>
            <div>
              <p className="font-black text-slate-500 uppercase tracking-widest text-xs">Total Partisipan</p>
              <h3 className="font-black text-3xl text-slate-900">{results.length} <span className="text-base text-slate-500">Siswa</span></h3>
            </div>
          </div>
          
          <div className="bg-white border-4 border-slate-900 rounded-[24px] p-6 shadow-[6px_6px_0px_#0f172a] flex items-center gap-4 transform hover:-translate-y-1 transition-all">
            <div className="h-14 w-14 rounded-2xl bg-emerald-300 border-4 border-slate-900 flex items-center justify-center rotate-3 shrink-0">
              <Target className="h-6 w-6 text-slate-900" />
            </div>
            <div>
              <p className="font-black text-slate-500 uppercase tracking-widest text-xs">Rata-rata Nilai</p>
              <h3 className="font-black text-3xl text-emerald-600">{averageScore}</h3>
            </div>
          </div>

          <div className="bg-white border-4 border-slate-900 rounded-[24px] p-6 shadow-[6px_6px_0px_#0f172a] flex items-center gap-4 transform hover:-translate-y-1 transition-all">
            <div className="h-14 w-14 rounded-2xl bg-pink-300 border-4 border-slate-900 flex items-center justify-center rotate-6 shrink-0">
              <Trophy className="h-6 w-6 text-slate-900" />
            </div>
            <div>
              <p className="font-black text-slate-500 uppercase tracking-widest text-xs">Lulus KKM (≥{kkm})</p>
              <h3 className="font-black text-3xl text-pink-600">{passCount} <span className="text-base text-slate-500">Siswa</span></h3>
            </div>
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="bg-white border-4 border-slate-900 rounded-[32px] overflow-hidden shadow-[8px_8px_0px_#0f172a]">
          <div className="p-6 border-b-4 border-slate-900 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="font-black text-2xl text-slate-900 uppercase">Daftar Pertumpahan Darah</h2>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <Input 
                className="pl-10 h-12 border-4 border-slate-900 font-bold focus:shadow-[4px_4px_0px_#0f172a] rounded-xl bg-white" 
                placeholder="Cari Agen..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="p-0">
            {filteredResults.length === 0 ? (
              <div className="text-center p-12">
                <p className="font-bold text-slate-400 text-lg">Belum ada korban yang ditemukan.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-slate-100 border-b-4 border-slate-900">
                        <th className="p-4 font-black text-slate-900 uppercase tracking-wider w-16 text-center">Rank</th>
                        <th className="p-4 font-black text-slate-900 uppercase tracking-wider">Identitas Agen</th>
                        <th className="p-4 font-black text-slate-900 uppercase tracking-wider text-center">Skor Akhir</th>
                        <th className="p-4 font-black text-slate-900 uppercase tracking-wider text-center">Waktu Eksekusi</th>
                        <th className="p-4 font-black text-slate-900 uppercase tracking-wider text-right hidden md:table-cell">Tanggal Misi</th>
                     </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((result, index) => {
                      const isTop3 = index < 3;
                      const profile = result.profiles;
                      return (
                        <tr key={result.id} className="border-b-2 border-slate-200 hover:bg-slate-50 transition-colors">
                          <td className="p-4 text-center">
                            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border-2 border-slate-900 font-black text-lg
                              ${index === 0 ? 'bg-yellow-400 rotate-[-10deg] scale-110 shadow-[2px_2px_0px_#0f172a]' : 
                                index === 1 ? 'bg-slate-300 rotate-[5deg] shadow-[2px_2px_0px_#0f172a]' : 
                                index === 2 ? 'bg-amber-600/40 text-amber-900 rotate-[-5deg] shadow-[2px_2px_0px_#0f172a]' : 'bg-white'}`}>
                              {index + 1}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 border-2 border-slate-900">
                                <AvatarImage src={profile?.avatar_url || ''} />
                                <AvatarFallback className="bg-emerald-200 font-black text-slate-900">{profile?.first_name?.[0]}{profile?.last_name?.[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-black text-slate-900">{profile?.first_name} {profile?.last_name}</p>
                                <p className="text-sm font-bold text-slate-500">@{profile?.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <span className={`inline-block px-3 py-1 rounded-lg border-2 border-slate-900 font-black text-lg transform ${index % 2 === 0 ? 'rotate-1' : '-rotate-1'} 
                                ${result.score >= kkm ? 'bg-emerald-300 text-slate-900' : 'bg-red-300 text-slate-900'}`}>
                                {result.score}
                              </span>
                              <div className={`mt-1 text-[10px] font-black tracking-widest uppercase ${result.score >= kkm ? 'text-emerald-600' : 'text-red-500'}`}>
                                {result.score >= kkm ? 'LULUS' : 'GAGAL'}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="inline-flex items-center gap-1 font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg border-2 border-slate-200">
                               <Clock className="h-4 w-4" />
                               {Math.floor(result.time_taken_seconds / 60)}m {result.time_taken_seconds % 60}s
                            </div>
                          </td>
                          <td className="p-4 text-right hidden md:table-cell font-bold text-slate-500 text-sm">
                            {new Date(result.completed_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
