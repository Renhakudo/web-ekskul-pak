'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Trophy, Star, Crown, Loader2, Award, Zap, Sparkles, Medal } from "lucide-react"
import { cn } from "@/lib/utils"

export default function LeaderboardPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'siswa')
        .order('points', { ascending: false })
        .limit(50)

      setUsers(data || [])
      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7]">
      <Loader2 className="animate-spin h-12 w-12 text-yellow-500 mb-4" />
      <p className="font-black text-slate-500 uppercase tracking-widest text-sm md:text-base">Menyusun Klasemen...</p>
    </div>
  )

  const topThree = users.slice(0, 3)
  const restUsers = users.slice(3)

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 md:space-y-10 min-h-screen font-sans relative z-0 overflow-x-hidden pb-24">
      
      {/* ====== BACKGROUND DOT PATTERN ====== */}
      <div className="absolute inset-0 z-[-1] bg-[radial-gradient(#cbd5e1_2px,transparent_2px)] [background-size:32px_32px] opacity-40 fixed"></div>

      {/* ====== HEADER ====== */}
      <div className="bg-yellow-300 border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] md:shadow-[8px_8px_0px_#0f172a] rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 text-center relative overflow-hidden mt-2">
        <div className="absolute -top-10 -right-10 w-24 h-24 md:w-32 md:h-32 bg-yellow-400 rounded-full blur-[30px] md:blur-[40px] opacity-50"></div>
        <div className="relative z-10 flex flex-col items-center">
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 flex items-center justify-center gap-3 md:gap-4 mb-2 md:mb-4 uppercase tracking-tight">
            <Trophy className="h-8 w-8 md:h-12 md:w-12 text-slate-900" />
            Papan Skor
          </h1>
          <p className="text-sm md:text-xl font-bold text-yellow-900 bg-white/40 px-4 py-1.5 rounded-xl border-2 border-yellow-500 border-dashed inline-block">
            Koleksi XP terbanyak. Siapa penguasa kelas minggu ini?
          </p>
        </div>
        <Sparkles className="absolute top-6 left-6 text-yellow-500 w-6 h-6 md:w-8 md:h-8 opacity-60" />
      </div>

      {/* ====== 🥇 PODIUM TOP 3 ====== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-end mb-8 md:mb-16 pt-4 md:pt-8">

        {/* JUARA 2 */}
        {topThree[1] && (
          <Card className="order-2 md:order-1 border-2 md:border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] md:shadow-[8px_8px_0px_#0f172a] bg-slate-100 rounded-[1.5rem] md:rounded-[2rem] hover:-translate-y-2 transition-transform transform md:-rotate-1 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-6 md:h-8 bg-slate-300 border-b-2 md:border-b-4 border-slate-900" />
            <CardContent className="p-6 md:p-8 pt-10 md:pt-12 flex flex-col items-center text-center">
              <div className="relative mb-4 md:mb-6">
                <Avatar className="h-20 w-20 md:h-24 md:w-24 border-2 md:border-4 border-slate-900 shadow-[2px_2px_0px_#0f172a] md:shadow-[4px_4px_0px_#0f172a] bg-white">
                  <AvatarImage src={topThree[1].avatar_url} />
                  <AvatarFallback className="font-black text-xl md:text-2xl bg-slate-300 text-slate-800">{topThree[1].full_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-3 -right-2 bg-slate-200 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-slate-900 font-black text-base md:text-xl rotate-12">
                  2
                </div>
              </div>
              <h3 className="text-lg md:text-xl font-black text-slate-900 mb-1 line-clamp-1 px-2">{topThree[1].full_name}</h3>
              <p className="text-slate-500 font-bold text-xs md:text-sm mb-3 md:mb-4">@{topThree[1].username}</p>
              <Badge className="bg-slate-800 text-white font-black px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-sm md:text-base border-2 border-transparent hover:bg-slate-700 shadow-sm">
                {topThree[1].points} XP
              </Badge>
            </CardContent>
          </Card>
        )}

        {/* JUARA 1 */}
        {topThree[0] && (
          <Card className="order-1 md:order-2 border-2 md:border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] md:shadow-[10px_10px_0px_#0f172a] bg-yellow-100 rounded-[1.5rem] md:rounded-[2.5rem] hover:-translate-y-2 md:hover:-translate-y-4 transition-transform z-10 relative overflow-hidden pb-2 md:pb-4">
            <div className="absolute top-0 left-0 w-full h-8 md:h-10 bg-yellow-400 border-b-2 md:border-b-4 border-slate-900 flex justify-center items-center">
              <Crown className="w-6 h-6 md:w-8 md:h-8 text-slate-900 -mt-6 md:-mt-8 drop-shadow-md" />
            </div>
            <CardContent className="p-6 md:p-10 pt-12 md:pt-16 flex flex-col items-center text-center">
              <div className="relative mb-4 md:mb-6">
                <Avatar className="h-24 w-24 md:h-32 md:w-32 border-2 md:border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] md:shadow-[6px_6px_0px_#0f172a] bg-white">
                  <AvatarImage src={topThree[0].avatar_url} />
                  <AvatarFallback className="font-black text-3xl md:text-4xl bg-yellow-300 text-yellow-900">{topThree[0].full_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-3 -right-2 md:-bottom-4 md:-right-2 bg-yellow-400 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] md:shadow-[4px_4px_0px_#0f172a] rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-slate-900 font-black text-xl md:text-2xl -rotate-12">
                  1
                </div>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-1 line-clamp-1 px-2">{topThree[0].full_name}</h3>
              <p className="text-slate-600 font-bold text-xs md:text-base mb-4 md:mb-6">@{topThree[0].username}</p>
              <div className="flex items-center gap-1.5 md:gap-2 bg-slate-900 px-4 md:px-6 py-1.5 md:py-2 rounded-xl md:rounded-2xl shadow-[2px_2px_0px_#facc15] md:shadow-[4px_4px_0px_#facc15] border-2 border-slate-900 -rotate-2">
                <Zap className="h-4 w-4 md:h-5 md:w-5 text-yellow-400 fill-yellow-400" />
                <span className="font-black text-yellow-400 text-base md:text-xl">{topThree[0].points} XP</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* JUARA 3 */}
        {topThree[2] && (
          <Card className="order-3 border-2 md:border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] md:shadow-[8px_8px_0px_#0f172a] bg-orange-100 rounded-[1.5rem] md:rounded-[2rem] hover:-translate-y-2 transition-transform transform md:rotate-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-6 md:h-8 bg-orange-300 border-b-2 md:border-b-4 border-slate-900" />
            <CardContent className="p-6 md:p-8 pt-10 md:pt-12 flex flex-col items-center text-center">
              <div className="relative mb-4 md:mb-6">
                <Avatar className="h-20 w-20 md:h-24 md:w-24 border-2 md:border-4 border-slate-900 shadow-[2px_2px_0px_#0f172a] md:shadow-[4px_4px_0px_#0f172a] bg-white">
                  <AvatarImage src={topThree[2].avatar_url} />
                  <AvatarFallback className="font-black text-xl md:text-2xl bg-orange-300 text-orange-900">{topThree[2].full_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-3 -right-2 bg-orange-300 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-slate-900 font-black text-base md:text-xl -rotate-6">
                  3
                </div>
              </div>
              <h3 className="text-lg md:text-xl font-black text-slate-900 mb-1 line-clamp-1 px-2">{topThree[2].full_name}</h3>
              <p className="text-orange-900 font-bold text-xs md:text-sm mb-3 md:mb-4">@{topThree[2].username}</p>
              <Badge className="bg-orange-500 text-slate-900 font-black px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-sm md:text-base border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] hover:bg-orange-400">
                {topThree[2].points} XP
              </Badge>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ====== DAFTAR PERINGKAT SISANYA ====== */}
      <div className="flex items-center gap-3 pl-2 md:pl-4 mb-4 md:mb-6">
        <div className="bg-violet-200 p-1.5 md:p-2 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]">
          <Award className="w-5 h-5 md:w-7 md:h-7 text-violet-700" /> 
        </div>
        <h3 className="text-xl md:text-3xl font-black text-slate-900 uppercase">Peserta Lainnya</h3>
      </div>

      <Card className="border-2 md:border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] md:shadow-[8px_8px_0px_#0f172a] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="divide-y-2 divide-slate-100">
            {restUsers.length === 0 ? (
              <div className="p-10 md:p-12 text-center text-slate-400 font-black text-lg md:text-xl uppercase tracking-widest">
                Masih sunyi, belum ada lawan yang terlihat.
              </div>
            ) : (
              restUsers.map((user, idx) => {
                const isMe = currentUser?.id === user.id
                return (
                  <div
                    key={user.id}
                    className={cn(
                      "flex items-center justify-between p-4 md:p-6 hover:bg-slate-50 transition-colors group",
                      isMe && "bg-violet-100 hover:bg-violet-200"
                    )}
                  >
                    <div className="flex items-center gap-3 md:gap-6 min-w-0">
                      <div className={cn("w-8 h-8 md:w-10 md:h-10 shrink-0 border-2 border-slate-300 rounded-lg md:rounded-xl flex items-center justify-center font-black text-slate-500 text-sm md:text-lg", isMe && "bg-violet-300 border-slate-900 text-slate-900 shadow-[2px_2px_0px_#0f172a]")}>
                        {idx + 4}
                      </div>
                      <Avatar className="h-10 w-10 md:h-12 md:w-12 border-2 border-slate-900 shadow-sm shrink-0 bg-white">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback className="font-bold bg-slate-200 text-slate-800">{user.full_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 pr-2">
                        <div className="font-black text-slate-900 text-sm md:text-lg flex flex-wrap items-center gap-1.5 md:gap-3 truncate">
                          <span className="truncate">{user.full_name}</span>
                          {isMe && <Badge className="bg-violet-600 text-white border-2 border-slate-900 shadow-sm font-black rounded-md md:rounded-lg px-1.5 md:px-2 py-0 md:py-0.5 text-[9px] md:text-xs tracking-wider uppercase shrink-0">Kamu</Badge>}
                        </div>
                        <div className="text-xs md:text-sm font-bold text-slate-500 truncate">@{user.username}</div>
                      </div>
                    </div>

                    <div className={cn("font-black text-sm md:text-xl text-slate-900 flex items-center gap-1 md:gap-2 shrink-0", isMe && "text-violet-900")}>
                      {user.points} <span className={cn("text-slate-400 text-xs md:text-sm", isMe && "text-violet-600")}>XP</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}