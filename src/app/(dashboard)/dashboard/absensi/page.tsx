'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarCheck, Clock, CheckCircle2, AlertCircle, Loader2, Star, Lock, Flame } from 'lucide-react'
import { awardEligibleBadges } from '@/lib/badge-utils'
import { updateLearningStreak } from '@/lib/streak-utils'

const getTodayDateString = () => {
  const today = new Date()
  const offset = today.getTimezoneOffset()
  today.setMinutes(today.getMinutes() - offset)
  return today.toISOString().split('T')[0]
}

const getYesterdayDateString = () => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const offset = yesterday.getTimezoneOffset()
  yesterday.setMinutes(yesterday.getMinutes() - offset)
  return yesterday.toISOString().split('T')[0]
}

export default function AbsensiPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attendances, setAttendances] = useState<any[]>([])
  const [hasAttendedToday, setHasAttendedToday] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [currentStreak, setCurrentStreak] = useState(0)

  const todayString = getTodayDateString()
  const yesterdayString = getYesterdayDateString()

  const fetchAttendances = useCallback(async () => {
    setLoading(true)

    const [settingsRes, userRes] = await Promise.all([
      supabase.from('app_settings').select('is_attendance_open').eq('id', 1).single(),
      supabase.auth.getUser(),
    ])

    if (settingsRes.data) setIsAttendanceOpen(settingsRes.data.is_attendance_open)

    const authUser = userRes.data.user
    if (authUser) {
      setUserId(authUser.id)

      const [attendRes, profileRes] = await Promise.all([
        supabase
          .from('attendances')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          // Baca last_activity_date (kolom baru) untuk cek streak lintas event
          .select('streak, last_activity_date')
          .eq('id', authUser.id)
          .single(),
      ])

      if (attendRes.data) {
        setAttendances(attendRes.data)
        setHasAttendedToday(attendRes.data.some(a => a.date_only === todayString))
      }

      if (profileRes.data) {
        setCurrentStreak(profileRes.data.streak || 0)
      }
    }
    setLoading(false)
  }, [todayString])

  useEffect(() => {
    fetchAttendances()
  }, [fetchAttendances])

  const handleCheckIn = async () => {
    if (!userId) return
    setIsSubmitting(true)
    setSuccessMessage('')

    // 1. Catat kehadiran ke tabel attendances
    const { error: attendError } = await supabase
      .from('attendances')
      .insert({ user_id: userId, status: 'hadir', date_only: todayString })

    if (attendError) {
      if (attendError.code === '23505') setHasAttendedToday(true)
      setIsSubmitting(false)
      return
    }

    // 2. Hitung & update XP (+10 dari absensi)
    const { data: profile } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', userId)
      .single()

    await supabase.from('profiles').update({
      points: (profile?.points || 0) + 10,
      last_activity: todayString, // update kolom last_activity sebagai riwayat absensi
    }).eq('id', userId)

    // 3. Update learning streak via helper terpusat
    //    Helper akan cek last_activity_date dan hitung streak baru
    const newStreak = await updateLearningStreak(userId, supabase)

    const displayStreak = newStreak ?? currentStreak
    setCurrentStreak(displayStreak)
    setSuccessMessage(`+10 XP diterima! Streak belajarmu: ${displayStreak} hari!`)
    await fetchAttendances()

    // 4. Cek badge yang layak diterima
    awardEligibleBadges(userId, supabase).catch(() => { })

    setIsSubmitting(false)
  }

  // --- RENDER LOADER ---
  if (loading) return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-4 md:space-y-6 mt-10">
      <Skeleton className="h-32 md:h-40 w-full rounded-[1.5rem] md:rounded-[2rem] border-2 md:border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] md:shadow-[8px_8px_0px_#0f172a]" />
      <Skeleton className="h-48 md:h-64 w-full rounded-[1.5rem] md:rounded-[2rem] border-2 md:border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] md:shadow-[8px_8px_0px_#0f172a]" />
    </div>
  )

  if (!userId) return (
    <div className="flex h-screen items-center justify-center bg-[#FDFBF7]">
      <div className="text-center font-black text-slate-500 text-lg md:text-xl uppercase tracking-widest">Akses ditolak. Silakan login kembali.</div>
    </div>
  )

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 md:space-y-10 min-h-screen font-sans relative z-0 overflow-x-hidden pb-24">

      {/* ====== BACKGROUND DOT PATTERN ====== */}
      <div className="absolute inset-0 z-[-1] bg-[radial-gradient(#cbd5e1_2px,transparent_2px)] [background-size:32px_32px] opacity-40 fixed"></div>

      {/* ====== HEADER ====== */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 justify-between bg-emerald-300 border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] md:shadow-[8px_8px_0px_#0f172a] rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 relative overflow-hidden mt-2 md:mt-4">
        <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-emerald-400 rounded-full blur-[30px] md:blur-[40px] opacity-60"></div>
        <div className="relative z-10 flex-1">
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 flex items-center gap-3 md:gap-4 uppercase tracking-tight">
            <div className="bg-white p-2 md:p-3 rounded-xl md:rounded-2xl border-2 md:border-4 border-slate-900 shadow-[2px_2px_0px_#0f172a] md:shadow-[4px_4px_0px_#0f172a] transform -rotate-3 hover:rotate-3 transition-transform shrink-0">
              <CalendarCheck className="h-6 w-6 md:h-8 md:w-8 text-emerald-600" />
            </div>
            Absensi
          </h1>
          <p className="text-emerald-950 font-bold mt-3 md:mt-4 text-sm md:text-lg bg-white/40 px-3 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-2xl border-2 border-slate-900 border-dashed inline-block shadow-sm">
            Cek in harian dapat <span className="bg-yellow-300 border-2 border-slate-900 px-1.5 py-0.5 rounded-md shadow-sm ml-1">+10 XP</span> dan jaga streak kerenmu!
          </p>
        </div>

        {/* Streak Badge */}
        <div className={`relative z-10 flex items-center gap-2 md:gap-3 px-4 py-2 md:px-6 md:py-4 rounded-xl md:rounded-2xl border-2 md:border-4 font-black shadow-[2px_2px_0px_#0f172a] md:shadow-[4px_4px_0px_#0f172a] self-start md:self-auto transform md:rotate-2 shrink-0 ${
          currentStreak > 0
          ? 'bg-orange-400 border-slate-900 text-slate-900'
          : 'bg-slate-100 border-slate-900 text-slate-400 shadow-none md:rotate-0'
        }`}>
          <Flame className={`h-5 w-5 md:h-6 md:w-6 ${currentStreak > 0 ? 'text-yellow-200 fill-yellow-300 animate-pulse' : 'text-slate-400'}`} />
          <span className="text-base md:text-xl uppercase">{currentStreak > 0 ? `${currentStreak} Hari Streak!` : 'Belum Mulai'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

        {/* ====== KARTU ABSEN ====== */}
        <Card className={`lg:col-span-1 shadow-[6px_6px_0px_#0f172a] md:shadow-[8px_8px_0px_#0f172a] border-2 md:border-4 border-slate-900 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden relative ${isAttendanceOpen ? 'bg-white' : 'bg-slate-50'}`}>
          <div className={`absolute top-0 left-0 w-full h-3 md:h-4 border-b-2 md:border-b-4 border-slate-900 ${isAttendanceOpen ? 'bg-emerald-400' : 'bg-slate-300'}`} />
          <CardHeader className="pt-6 md:pt-8 text-center pb-2">
            <CardTitle className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-widest">Status Hari Ini</CardTitle>
            <CardDescription className="font-bold text-slate-500 text-xs md:text-sm">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center text-center p-4 md:p-6">

            {hasAttendedToday ? (
              <div className="space-y-3 md:space-y-4 animate-in zoom-in duration-300 w-full flex flex-col items-center pt-2">
                <div className="h-16 w-16 md:h-24 md:w-24 bg-emerald-400 border-2 md:border-4 border-slate-900 shadow-[2px_2px_0px_#0f172a] md:shadow-[4px_4px_0px_#0f172a] rounded-full flex items-center justify-center transform hover:rotate-6 transition-transform">
                  <CheckCircle2 className="h-8 w-8 md:h-12 md:w-12 text-slate-900" />
                </div>
                <h3 className="font-black text-xl md:text-2xl text-slate-900 mt-1 md:mt-2 uppercase">Sudah Check-In!</h3>
                <p className="text-xs md:text-base font-bold text-slate-500">Mantap, kamu sudah aman hari ini.</p>
                {currentStreak > 1 && (
                  <div className="flex items-center gap-1.5 md:gap-2 justify-center bg-orange-400 border-2 border-slate-900 rounded-lg md:rounded-xl px-3 py-1.5 md:px-5 md:py-2 shadow-[2px_2px_0px_#0f172a] rotate-1">
                    <Flame className="h-4 w-4 md:h-5 md:w-5 text-yellow-300 fill-yellow-300" />
                    <span className="text-xs md:text-sm font-black text-slate-900 uppercase">{currentStreak} Hari Beruntun!</span>
                  </div>
                )}
                <Badge className="bg-yellow-300 text-slate-900 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-base font-black border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] hover:bg-yellow-400 cursor-default uppercase">
                  <Star className="h-3 w-3 md:h-5 md:w-5 mr-1 fill-slate-900 text-slate-900" /> +10 XP Diamankan
                </Badge>
              </div>
            ) : !isAttendanceOpen ? (
              <div className="space-y-3 md:space-y-4 w-full flex flex-col items-center pt-2">
                <div className="h-16 w-16 md:h-24 md:w-24 bg-slate-200 border-2 md:border-4 border-slate-900 rounded-full flex items-center justify-center mb-1 md:mb-2 shadow-[2px_2px_0px_#0f172a] md:shadow-[4px_4px_0px_#0f172a]">
                  <Lock className="h-8 w-8 md:h-12 md:w-12 text-slate-500" />
                </div>
                <h3 className="font-black text-xl md:text-2xl text-slate-900 uppercase">Portal Ditutup</h3>
                <p className="text-xs md:text-base font-bold text-slate-500">Tunggu instruksi kak mentor untuk membuka portal check-in.</p>
              </div>
            ) : (
              <div className="space-y-4 md:space-y-6 w-full flex flex-col items-center pt-2">
                <div className="h-16 w-16 md:h-24 md:w-24 bg-yellow-300 border-2 md:border-4 border-slate-900 rounded-full flex items-center justify-center mb-1 md:mb-2 shadow-[2px_2px_0px_#0f172a] md:shadow-[4px_4px_0px_#0f172a] animate-pulse">
                  <Clock className="h-8 w-8 md:h-12 md:w-12 text-slate-900" />
                </div>
                <div>
                  <h3 className="font-black text-xl md:text-2xl text-slate-900 uppercase">Belum Check-In</h3>
                  <p className="text-xs md:text-base font-bold text-slate-500 mt-1 md:mt-2 leading-relaxed">
                    {currentStreak > 0
                      ? `Jangan sampai streak ${currentStreak} harimu hangus! Segera klik tombol di bawah.`
                      : 'Mulai petualanganmu hari ini dengan mencatat kehadiran.'}
                  </p>
                </div>
                {successMessage && (
                  <p className="text-[10px] md:text-sm font-black text-emerald-700 bg-emerald-200 border-2 border-slate-900 rounded-lg md:rounded-xl p-2 md:p-3 shadow-[2px_2px_0px_#0f172a]">{successMessage}</p>
                )}
                <Button
                  onClick={handleCheckIn}
                  disabled={isSubmitting}
                  className="w-full h-12 md:h-14 text-sm md:text-xl font-black bg-emerald-400 hover:bg-emerald-300 text-slate-900 border-2 md:border-4 border-slate-900 rounded-xl md:rounded-2xl shadow-[4px_4px_0px_#0f172a] md:shadow-[6px_6px_0px_#0f172a] hover:translate-y-1 hover:shadow-[2px_2px_0px_#0f172a] md:hover:shadow-[2px_2px_0px_#0f172a] transition-all uppercase tracking-wider"
                >
                  {isSubmitting ? <Loader2 className="animate-spin h-5 w-5 md:h-6 md:w-6 mr-2" /> : (
                    <span className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 md:h-6 md:w-6" /> Hadir!</span>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ====== RIWAYAT ABSENSI ====== */}
        <Card className="lg:col-span-2 shadow-[6px_6px_0px_#0f172a] md:shadow-[8px_8px_0px_#0f172a] border-2 md:border-4 border-slate-900 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden bg-white flex flex-col h-[500px] md:h-auto">
          <CardHeader className="border-b-2 md:border-b-4 border-slate-900 bg-slate-50 flex flex-row items-center justify-between p-4 md:p-6 gap-2">
            <CardTitle className="text-lg md:text-xl font-black flex items-center gap-2 md:gap-3 uppercase">
              <div className="bg-violet-200 p-1.5 md:p-2 rounded-lg border-2 border-slate-900 shadow-sm">
                <Clock className="h-4 w-4 md:h-6 md:w-6 text-violet-700" /> 
              </div>
              Riwayat Portal
            </CardTitle>
            <Badge className="bg-violet-300 text-slate-900 font-bold border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] text-xs md:text-base hover:bg-violet-300 px-2 md:px-3 py-0.5 md:py-1">
              {attendances.length}x Hadir
            </Badge>
          </CardHeader>
          <CardContent className="p-0 flex-1 relative bg-white overflow-hidden flex flex-col">
            {attendances.length === 0 ? (
              <div className="p-10 md:p-16 text-center flex flex-col items-center justify-center w-full h-full bg-slate-50/50">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full border-2 border-slate-300 border-dashed flex items-center justify-center mb-3 md:mb-4 shadow-sm">
                  <AlertCircle className="h-8 w-8 md:h-10 md:w-10 text-slate-400" />
                </div>
                <p className="font-bold text-slate-500 text-sm md:text-lg">Jejak petualanganmu belum tercatat.</p>
              </div>
            ) : (
              <div className="divide-y-2 divide-slate-100 overflow-y-auto w-full p-2 md:p-3 h-full max-h-[350px] md:max-h-[450px] hide-scrollbar">
                {attendances.map((record, idx) => (
                  <div key={record.id} className="p-3 md:p-4 mx-1 md:mx-2 my-2 rounded-xl md:rounded-2xl border-2 border-slate-900 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between hover:bg-emerald-50 transition-colors group gap-3 sm:gap-0">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg md:rounded-xl bg-emerald-300 border-2 border-slate-900 flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#0f172a] group-hover:rotate-6 transition-transform">
                        <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-slate-900" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 text-sm md:text-lg leading-tight md:leading-none mb-0.5 md:mb-1 truncate">
                          {new Date(record.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-xs md:text-sm font-bold text-slate-500 flex items-center gap-1 md:gap-1.5 pt-0.5 md:pt-1">
                          <Clock className="h-3 w-3 md:h-4 md:w-4" />
                          {new Date(record.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto pl-14 sm:pl-0">
                      {idx === 0 && (
                        <Badge className="bg-yellow-300 text-slate-900 uppercase font-black tracking-wider border-2 border-slate-900 text-[9px] md:text-xs px-2 py-0.5 shadow-sm">Baru</Badge>
                      )}
                      <Badge className="bg-emerald-400 text-slate-900 border-2 border-slate-900 px-2 md:px-3 py-0.5 md:py-1 font-black shadow-[2px_2px_0px_#0f172a] text-[10px] md:text-xs uppercase">Hadir</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}