'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Crown, Star, Loader2, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

export default function LeaderboardPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      
      // 1. Ambil User yang sedang login
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      // 2. Ambil Top 50 Siswa dengan XP tertinggi
      // Kita filter role 'siswa' biar guru gak ikut saingan hehe
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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-violet-600"/></div>

  // Pisahkan Top 3 dengan sisa user
  const topThree = users.slice(0, 3)
  const restUsers = users.slice(3)

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 min-h-screen bg-slate-50/50">
      
      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 flex items-center justify-center gap-3">
          <Trophy className="h-8 w-8 text-yellow-500 fill-yellow-500 animate-bounce" /> 
          Papan Peringkat
        </h1>
        <p className="text-slate-500">Siswa dengan XP tertinggi minggu ini.</p>
      </div>

      {/* 🥇 PODIUM TOP 3 (Desktop View) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mb-12">
        
        {/* JUARA 2 (Kiri) */}
        {topThree[1] && (
          <Card className="order-2 md:order-1 border-slate-200 shadow-lg relative overflow-hidden transform hover:-translate-y-1 transition-all">
             <div className="absolute top-0 left-0 w-full h-1 bg-slate-400" />
             <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <Avatar className="h-20 w-20 border-4 border-slate-300">
                    <AvatarImage src={topThree[1].avatar_url} />
                    <AvatarFallback>{topThree[1].full_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 bg-slate-200 rounded-full p-1 border border-white">
                    <div className="bg-slate-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  </div>
                </div>
                <h3 className="font-bold text-slate-800 line-clamp-1">{topThree[1].full_name}</h3>
                <p className="text-slate-500 text-sm">@{topThree[1].username}</p>
                <Badge variant="secondary" className="mt-3 bg-slate-100 text-slate-700 font-bold">
                  {topThree[1].points} XP
                </Badge>
             </CardContent>
          </Card>
        )}

        {/* JUARA 1 (Tengah - Lebih Besar) */}
        {topThree[0] && (
          <Card className="order-1 md:order-2 border-yellow-200 shadow-xl relative overflow-hidden transform hover:-translate-y-2 transition-all scale-105 z-10">
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 to-amber-500" />
             <div className="absolute top-0 right-0 p-2">
               <Crown className="h-6 w-6 text-yellow-500 fill-yellow-500 rotate-12" />
             </div>
             <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-yellow-200 blur-xl opacity-50 rounded-full"></div>
                  <Avatar className="h-24 w-24 border-4 border-yellow-400 relative z-10">
                    <AvatarImage src={topThree[0].avatar_url} />
                    <AvatarFallback>{topThree[0].full_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-3 -right-3 bg-yellow-100 rounded-full p-1.5 border-2 border-white z-20">
                    <div className="bg-yellow-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold">1</div>
                  </div>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 line-clamp-1">{topThree[0].full_name}</h3>
                <p className="text-slate-500">@{topThree[0].username}</p>
                <div className="mt-4 flex items-center gap-2 bg-yellow-50 px-4 py-1.5 rounded-full border border-yellow-100">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-bold text-yellow-700 text-lg">{topThree[0].points} XP</span>
                </div>
             </CardContent>
          </Card>
        )}

        {/* JUARA 3 (Kanan) */}
        {topThree[2] && (
          <Card className="order-3 border-orange-200 shadow-lg relative overflow-hidden transform hover:-translate-y-1 transition-all">
             <div className="absolute top-0 left-0 w-full h-1 bg-orange-400" />
             <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <Avatar className="h-20 w-20 border-4 border-orange-300">
                    <AvatarImage src={topThree[2].avatar_url} />
                    <AvatarFallback>{topThree[2].full_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 bg-orange-100 rounded-full p-1 border border-white">
                    <div className="bg-orange-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                  </div>
                </div>
                <h3 className="font-bold text-slate-800 line-clamp-1">{topThree[2].full_name}</h3>
                <p className="text-slate-500 text-sm">@{topThree[2].username}</p>
                <Badge variant="secondary" className="mt-3 bg-orange-50 text-orange-800 font-bold border border-orange-100">
                  {topThree[2].points} XP
                </Badge>
             </CardContent>
          </Card>
        )}
      </div>

      {/* DAFTAR PERINGKAT SISANYA */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-white border-b">
          <CardTitle className="text-lg">Peringkat Lainnya</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {restUsers.length === 0 ? (
              <div className="p-8 text-center text-slate-500">Belum ada siswa lain.</div>
            ) : (
              restUsers.map((user, idx) => {
                const isMe = currentUser?.id === user.id
                return (
                  <div 
                    key={user.id} 
                    className={cn(
                      "flex items-center justify-between p-4 hover:bg-slate-50 transition-colors",
                      isMe && "bg-violet-50 hover:bg-violet-100 border-l-4 border-l-violet-600"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 text-center font-bold text-slate-400">
                        {idx + 4}
                      </div>
                      <Avatar className="h-10 w-10 border border-slate-200">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>{user.full_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-slate-900 flex items-center gap-2">
                          {user.full_name}
                          {isMe && <Badge className="text-[10px] h-5 px-1.5 bg-violet-600">Kamu</Badge>}
                        </div>
                        <div className="text-xs text-slate-500">@{user.username}</div>
                      </div>
                    </div>
                    
                    <div className="font-bold text-slate-700 tabular-nums">
                      {user.points} XP
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