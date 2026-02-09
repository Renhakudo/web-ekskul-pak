'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Flame, Trophy, Star, BookOpen, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"

export default function StudentDashboard() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [classes, setClasses] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      
      // 1. Get User
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 2. Get Profile (Points, Streak)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profileData)

      // 3. Get Classes (All active classes)
      // Nanti bisa difilter hanya kelas yang diikuti siswa
      const { data: classData } = await supabase
        .from('classes')
        .select(`
          *,
          materials (count)
        `)
        .order('created_at', { ascending: false })
      
      setClasses(classData || [])
      setLoading(false)
    }

    fetchData()
  }, [])

  // Gamification Logic
  const currentPoints = profile?.points || 0
  const level = Math.floor(currentPoints / 100) + 1
  const xpProgress = currentPoints % 100

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-violet-600 h-8 w-8" /></div>
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Halo, {profile?.full_name?.split(' ')[0] || 'Siswa'}! 👋
          </h1>
          <p className="text-slate-500">Siap mencetak prestasi hari ini?</p>
        </div>
        <div className="flex items-center gap-2 bg-orange-50 text-orange-700 px-4 py-2 rounded-full border border-orange-100 shadow-sm">
          <Flame className="h-5 w-5 fill-orange-500 text-orange-500" />
          <span className="font-bold">{profile?.streak || 0} Day Streak</span>
        </div>
      </div>

      {/* Gamification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Level Card */}
        <Card className="border-violet-100 bg-gradient-to-br from-violet-50 to-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-violet-600 uppercase tracking-wider flex items-center gap-2">
              <Star className="h-4 w-4" /> Current Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-slate-900 mb-2">{level}</div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Progress</span>
                <span>{xpProgress}/100 XP</span>
              </div>
              <Progress value={xpProgress} className="h-2 bg-violet-100" indicatorClassName="bg-violet-600" />
            </div>
          </CardContent>
        </Card>

        {/* Total Points Card */}
        <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white shadow-sm">
           <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 uppercase tracking-wider flex items-center gap-2">
              <Trophy className="h-4 w-4" /> Total XP
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-4xl font-extrabold text-slate-900">{currentPoints}</div>
             <p className="text-xs text-slate-500 mt-2">Kumpulkan XP dari materi & kuis.</p>
          </CardContent>
        </Card>

        {/* Info Card (Placeholder) */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-slate-600 uppercase tracking-wider">
               Status Belajar
             </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-lg font-medium text-slate-900">3 Kelas Aktif</div>
             <p className="text-xs text-slate-500 mt-1">Rajin pangkal pandai!</p>
          </CardContent>
        </Card>
      </div>

      {/* ... Bagian Header & Stats biarkan sama ... */}

      {/* GANTI BAGIAN DAFTAR KELAS DENGAN INI */}
      <div className="grid md:grid-cols-2 gap-6 mt-8">
        
        {/* Widget 1: Pintasan ke Materi */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white relative overflow-hidden shadow-lg">
           <div className="relative z-10">
             <h2 className="text-2xl font-bold mb-2">Lanjutkan Belajar 🚀</h2>
             <p className="text-violet-100 mb-6 max-w-md">
               Kamu punya beberapa kelas yang aktif. Lanjutkan progresmu dan raih lebih banyak XP hari ini!
             </p>
             <Link href="/dashboard/courses">
               <Button className="bg-white text-violet-700 hover:bg-violet-50 font-bold border-0">
                 Lihat Semua Materi & Tugas
               </Button>
             </Link>
           </div>
           {/* Hiasan background */}
           <BookOpen className="absolute -bottom-6 -right-6 h-40 w-40 text-white opacity-10 rotate-12" />
        </div>

        {/* Widget 2: Pengumuman / Info Ekskul (Opsional) */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
           <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
             📢 Info Ekskul Terbaru
           </h3>
           <div className="space-y-4">
             <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600 border border-slate-100">
               <span className="font-bold text-violet-600 block mb-1">Jadwal Minggu Ini</span>
               Jangan lupa pertemuan rutin hari Rabu jam 15:00 di Lab Komputer.
             </div>
             <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600 border border-slate-100">
               <span className="font-bold text-pink-600 block mb-1">Event Mendatang</span>
               Persiapan lomba LKS Web Design bulan depan.
             </div>
           </div>
        </div>

      </div>

    </div>
  )
}