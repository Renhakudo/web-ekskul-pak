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

  if (loading) return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <Skeleton className="h-40 w-full rounded-[32px] border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a]" />
      <Skeleton className="h-64 w-full rounded-[32px] border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a]" />
    </div>
  )

  if (!userId) return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center font-bold text-slate-500">Akses ditolak. Silakan login kembali.</div>
    </div>
  )

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-10 min-h-screen font-sans">

      <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between bg-emerald-300 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] p-8 relative overflow-hidden mt-2">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400 rounded-full blur-[40px] opacity-60"></div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 flex items-center gap-4">
            <div className="bg-white p-3 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] transform -rotate-3">
              <CalendarCheck className="h-8 w-8 text-emerald-600" />
            </div>
            Absensi
          </h1>
          <p className="text-emerald-900 font-bold mt-4 text-lg">
            Cek in harian dapat <span className="bg-yellow-300 border-2 border-slate-900 px-2 py-0.5 rounded-lg shadow-sm">+10 XP</span> dan jaga streak kerenmu!
          </p>
        </div>

        {/* Streak Badge */}
        <div className={`relative z-10 flex items-center gap-3 px-6 py-4 rounded-2xl border-4 font-black shadow-[4px_4px_0px_#0f172a] self-start md:self-auto transform rotate-2 ${currentStreak > 0
          ? 'bg-orange-400 border-slate-900 text-slate-900'
          : 'bg-slate-100 border-slate-900 text-slate-400 shadow-none rotate-0'
          }`}>
          <Flame className={`h-6 w-6 ${currentStreak > 0 ? 'text-yellow-200 fill-yellow-300' : 'text-slate-400'}`} />
          <span className="text-xl">{currentStreak > 0 ? `${currentStreak} Hari Streak!` : 'Belum Mulai'}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">

        {/* KARTU ABSEN */}
        <Card className={`md:col-span-1 shadow-[8px_8px_0px_#0f172a] border-4 border-slate-900 rounded-[32px] overflow-hidden relative ${isAttendanceOpen ? 'bg-white' : 'bg-slate-50'}`}>
          <div className={`absolute top-0 left-0 w-full h-4 border-b-4 border-slate-900 ${isAttendanceOpen ? 'bg-emerald-400' : 'bg-slate-300'}`} />
          <CardHeader className="pt-8 text-center pb-2">
            <CardTitle className="text-xl font-black text-slate-900">Status Hari Ini</CardTitle>
            <CardDescription className="font-bold text-slate-500">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center text-center p-6">

            {hasAttendedToday ? (
              <div className="space-y-4 animate-in zoom-in duration-300 w-full flex flex-col items-center pt-2">
                <div className="h-24 w-24 bg-emerald-400 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-full flex items-center justify-center transform hover:rotate-6 transition-transform">
                  <CheckCircle2 className="h-12 w-12 text-slate-900" />
                </div>
                <h3 className="font-black text-2xl text-slate-900 mt-2">Sudah Check-In!</h3>
                <p className="text-base font-bold text-slate-500">Mantap, kamu sudah aman hari ini.</p>
                {currentStreak > 1 && (
                  <div className="flex items-center gap-2 justify-center bg-orange-400 border-2 border-slate-900 rounded-xl px-5 py-2 shadow-[2px_2px_0px_#0f172a] rotate-1">
                    <Flame className="h-5 w-5 text-yellow-300 fill-yellow-300" />
                    <span className="text-sm font-black text-slate-900">{currentStreak} Hari Berturut-turut!</span>
                  </div>
                )}
                <Badge className="bg-yellow-300 text-slate-900 px-4 py-2 text-base font-black border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] hover:bg-yellow-400 cursor-default">
                  <Star className="h-5 w-5 mr-1 fill-slate-900 text-slate-900" /> +10 XP Diamankan
                </Badge>
              </div>
            ) : !isAttendanceOpen ? (
              <div className="space-y-4 w-full flex flex-col items-center pt-2">
                <div className="h-24 w-24 bg-slate-200 border-4 border-slate-900 rounded-full flex items-center justify-center mb-2 shadow-[4px_4px_0px_#0f172a]">
                  <Lock className="h-12 w-12 text-slate-500" />
                </div>
                <h3 className="font-black text-2xl text-slate-900">Portal Ditutup</h3>
                <p className="text-base font-bold text-slate-500">Tunggu instruksi kak mentor untuk membuka portal check-in.</p>
              </div>
            ) : (
              <div className="space-y-6 w-full flex flex-col items-center pt-2">
                <div className="h-24 w-24 bg-yellow-300 border-4 border-slate-900 rounded-full flex items-center justify-center mb-2 shadow-[4px_4px_0px_#0f172a] animate-pulse">
                  <Clock className="h-12 w-12 text-slate-900" />
                </div>
                <div>
                  <h3 className="font-black text-2xl text-slate-900">Belum Check-In</h3>
                  <p className="text-base font-bold text-slate-500 mt-2 leading-relaxed">
                    {currentStreak > 0
                      ? `Jangan sampai streak ${currentStreak} harimu hangus! Segera klik jam di bawah.`
                      : 'Mulai petualanganmu hari ini dengan mencatat kehadiran.'}
                  </p>
                </div>
                {successMessage && (
                  <p className="text-sm font-black text-emerald-700 bg-emerald-200 border-2 border-slate-900 rounded-xl p-3 shadow-[2px_2px_0px_#0f172a]">{successMessage}</p>
                )}
                <Button
                  onClick={handleCheckIn}
                  disabled={isSubmitting}
                  className="w-full h-14 text-xl font-black bg-emerald-400 hover:bg-emerald-300 text-slate-900 border-4 border-slate-900 rounded-2xl shadow-[6px_6px_0px_#0f172a] hover:translate-y-1 hover:shadow-[2px_2px_0px_#0f172a] transition-all"
                >
                  {isSubmitting ? <Loader2 className="animate-spin h-6 w-6 mr-2" /> : (
                    <span className="flex items-center gap-2"><CheckCircle2 className="h-6 w-6" /> Hadir!</span>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* RIWAYAT ABSENSI */}
        <Card className="md:col-span-2 shadow-[8px_8px_0px_#0f172a] border-4 border-slate-900 rounded-[32px] overflow-hidden bg-white flex flex-col">
          <CardHeader className="border-b-4 border-slate-900 bg-slate-50 flex flex-row items-center justify-between p-6">
            <CardTitle className="text-xl font-black flex items-center gap-3">
              <Clock className="h-6 w-6 text-violet-600" /> Riwayat Portal
            </CardTitle>
            <Badge className="bg-violet-300 text-slate-900 font-bold border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] text-base hover:bg-violet-300">
              {attendances.length}x Hadir
            </Badge>
          </CardHeader>
          <CardContent className="p-0 flex-1 relative bg-white">
            {attendances.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center w-full">
                <div className="w-20 h-20 bg-slate-100 rounded-full border-2 border-slate-300 border-dashed flex items-center justify-center mb-4">
                  <AlertCircle className="h-10 w-10 text-slate-400" />
                </div>
                <p className="font-bold text-slate-500 text-lg">Jejak petualanganmu belum tercatat.</p>
              </div>
            ) : (
              <div className="divide-y-2 divide-slate-100 max-h-[400px] overflow-y-auto w-full p-2">
                {attendances.map((record, idx) => (
                  <div key={record.id} className="p-4 mx-2 my-2 rounded-2xl border-2 border-slate-900 bg-white shadow-sm flex items-center justify-between hover:bg-emerald-50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-emerald-300 border-2 border-slate-900 flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#0f172a] group-hover:rotate-6 transition-transform">
                        <CheckCircle2 className="h-6 w-6 text-slate-900" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-lg leading-none mb-1">
                          {new Date(record.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-sm font-bold text-slate-500 flex items-center gap-1.5 pt-1">
                          <Clock className="h-4 w-4" />
                          {new Date(record.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {idx === 0 && (
                        <Badge className="hidden sm:inline-flex bg-yellow-300 text-slate-900 uppercase font-black tracking-wider border-2 border-slate-900">Baru</Badge>
                      )}
                      <Badge className="bg-emerald-400 text-slate-900 border-2 border-slate-900 px-3 py-1 font-black shadow-[2px_2px_0px_#0f172a]">Hadir</Badge>
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