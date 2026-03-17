'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Trophy, Star, Crown, Loader2, Award, Zap, Sparkles } from "lucide-react"
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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-yellow-600" /></div>

  const topThree = users.slice(0, 3)
  const restUsers = users.slice(3)

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-10 min-h-screen font-sans">

      {/* Header */}
      <div className="bg-yellow-300 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] p-10 text-center relative overflow-hidden mt-2">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-400 rounded-full blur-[40px] opacity-50"></div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 flex items-center justify-center gap-4 mb-4">
            <Trophy className="h-10 w-10 text-slate-900" />
            Papan Skor
          </h1>
          <p className="text-xl font-bold text-yellow-900">Koleksi XP terbanyak. Siapa penguasa kelas minggu ini?</p>
        </div>
        <Sparkles className="absolute top-10 left-10 text-yellow-500 w-8 h-8 opacity-60" />
      </div>

      {/* 🥇 PODIUM TOP 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end mb-16 pt-8">

        {/* JUARA 2 */}
        {topThree[1] && (
          <Card className="order-2 md:order-1 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] bg-slate-100 rounded-[32px] hover:-translate-y-2 transition-transform transform -rotate-1 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-8 bg-slate-300 border-b-4 border-slate-900" />
            <CardContent className="p-8 pt-12 flex flex-col items-center text-center">
              <div className="relative mb-6">
                <Avatar className="h-24 w-24 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a]">
                  <AvatarImage src={topThree[1].avatar_url} />
                  <AvatarFallback className="font-black text-2xl">{topThree[1].full_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-4 -right-2 bg-slate-200 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-full w-10 h-10 flex items-center justify-center text-slate-900 font-black text-xl rotate-12">
                  2
                </div>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-1 line-clamp-1">{topThree[1].full_name}</h3>
              <p className="text-slate-500 font-bold text-sm mb-4">@{topThree[1].username}</p>
              <Badge className="bg-slate-800 text-white font-black px-4 py-2 rounded-xl text-base border-2 border-transparent hover:bg-slate-700">
                {topThree[1].points} XP
              </Badge>
            </CardContent>
          </Card>
        )}

        {/* JUARA 1 */}
        {topThree[0] && (
          <Card className="order-1 md:order-2 border-4 border-slate-900 shadow-[10px_10px_0px_#0f172a] bg-yellow-100 rounded-[40px] hover:-translate-y-4 transition-transform z-10 relative overflow-hidden pb-4">
            <div className="absolute top-0 left-0 w-full h-10 bg-yellow-400 border-b-4 border-slate-900 flex justify-center items-center">
              <Crown className="w-8 h-8 text-slate-900 -mt-8 drop-shadow-md" />
            </div>
            <CardContent className="p-10 pt-16 flex flex-col items-center text-center">
              <div className="relative mb-6">
                <Avatar className="h-32 w-32 border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a]">
                  <AvatarImage src={topThree[0].avatar_url} />
                  <AvatarFallback className="font-black text-4xl">{topThree[0].full_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-4 -right-2 bg-yellow-400 border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-full w-12 h-12 flex items-center justify-center text-slate-900 font-black text-2xl -rotate-12">
                  1
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-1 line-clamp-1">{topThree[0].full_name}</h3>
              <p className="text-slate-600 font-bold text-base mb-6">@{topThree[0].username}</p>
              <div className="flex items-center gap-2 bg-slate-900 px-6 py-2 rounded-2xl shadow-[4px_4px_0px_#facc15] border-2 border-slate-900 -rotate-2">
                <Zap className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                <span className="font-black text-yellow-400 text-xl">{topThree[0].points} XP</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* JUARA 3 */}
        {topThree[2] && (
          <Card className="order-3 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] bg-orange-100 rounded-[32px] hover:-translate-y-2 transition-transform transform rotate-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-8 bg-orange-300 border-b-4 border-slate-900" />
            <CardContent className="p-8 pt-12 flex flex-col items-center text-center">
              <div className="relative mb-6">
                <Avatar className="h-24 w-24 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a]">
                  <AvatarImage src={topThree[2].avatar_url} />
                  <AvatarFallback className="font-black text-2xl">{topThree[2].full_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-4 -right-2 bg-orange-300 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-full w-10 h-10 flex items-center justify-center text-slate-900 font-black text-xl -rotate-6">
                  3
                </div>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-1 line-clamp-1">{topThree[2].full_name}</h3>
              <p className="text-orange-900 font-bold text-sm mb-4">@{topThree[2].username}</p>
              <Badge className="bg-orange-500 text-slate-900 font-black px-4 py-2 rounded-xl text-base border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] hover:bg-orange-400">
                {topThree[2].points} XP
              </Badge>
            </CardContent>
          </Card>
        )}
      </div>

      {/* DAFTAR PERINGKAT SISANYA */}
      <h3 className="text-3xl font-black text-slate-900 mb-6 flex items-center gap-3 pl-4">
        <Award className="w-8 h-8 text-violet-600" /> Peserta Lainnya
      </h3>
      <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="divide-y-2 divide-slate-100">
            {restUsers.length === 0 ? (
              <div className="p-12 text-center text-slate-500 font-bold text-xl">Masih sunyi, belum ada lawannya.</div>
            ) : (
              restUsers.map((user, idx) => {
                const isMe = currentUser?.id === user.id
                return (
                  <div
                    key={user.id}
                    className={cn(
                      "flex items-center justify-between p-6 hover:bg-slate-50 transition-colors",
                      isMe && "bg-violet-100 hover:bg-violet-200"
                    )}
                  >
                    <div className="flex items-center gap-4 md:gap-6">
                      <div className="w-10 h-10 bg-slate-100 border-2 border-slate-300 rounded-xl flex items-center justify-center font-black text-slate-500 text-lg">
                        {idx + 4}
                      </div>
                      <Avatar className="h-12 w-12 border-2 border-slate-900 shadow-sm">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback className="font-bold">{user.full_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-black text-slate-900 text-lg flex items-center gap-3">
                          {user.full_name}
                          {isMe && <Badge className="bg-violet-600 text-white border-0 font-bold rounded-lg px-2">Kamu</Badge>}
                        </div>
                        <div className="text-sm font-bold text-slate-500">@{user.username}</div>
                      </div>
                    </div>

                    <div className="font-black text-xl text-slate-900 flex items-center gap-2">
                      {user.points} <span className="text-slate-400 text-sm">XP</span>
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