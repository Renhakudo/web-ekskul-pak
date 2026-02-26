'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarCheck, Clock, CheckCircle2, AlertCircle, Loader2, Star, Lock, Flame } from 'lucide-react'

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
          .select('streak, last_attended_at')
          .eq('id', authUser.id)
          .single(),
      ])

      if (attendRes.data) {
        setAttendances(attendRes.data)
        setHasAttendedToday(attendRes.data.some(a => a.date_only === todayString))
      }

      // Streak — graceful: jika kolom belum ada, default 0
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

    // 1. Insert attendance — UNIQUE constraint (user_id, date_only) mencegah double absen di DB level
    const { error: attendError } = await supabase
      .from('attendances')
      .insert({ user_id: userId, status: 'hadir', date_only: todayString })

    if (attendError) {
      if (attendError.code === '23505') setHasAttendedToday(true)
      setIsSubmitting(false)
      return
    }

    // 2. Hitung streak baru berdasarkan last_attended_at
    const { data: profile } = await supabase
      .from('profiles')
      .select('points, streak, last_attended_at')
      .eq('id', userId)
      .single()

    const currentPoints = profile?.points || 0
    const oldStreak = profile?.streak || 0
    const lastAttendedAt = profile?.last_attended_at

    // Streak logic:
    // - Jika last_attended_at adalah kemarin → streak + 1
    // - Jika null atau lebih dari kemarin → reset ke 1
    let newStreak = 1
    if (lastAttendedAt === yesterdayString) {
      newStreak = oldStreak + 1
    }

    // 3. Update profil: XP + streak + last_attended_at
    const updatePayload: any = {
      points: currentPoints + 10,
      last_attended_at: todayString,
    }

    // Hanya update streak jika kolom ada (toleransi DB yang belum di-migrate)
    if ('streak' in (profile || {})) {
      updatePayload.streak = newStreak
    }

    await supabase.from('profiles').update(updatePayload).eq('id', userId)

    // 4. Update state lokal
    setCurrentStreak(newStreak)
    setSuccessMessage(`+10 XP diterima! 🌟 Streak kamu: ${newStreak} hari berturut-turut 🔥`)
    await fetchAttendances()
    setIsSubmitting(false)
  }

  if (loading) return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  )

  if (!userId) return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center text-slate-500">Sesi kamu telah habis, silakan login kembali.</div>
    </div>
  )

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 min-h-screen">

      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <CalendarCheck className="h-8 w-8 text-emerald-500" /> Absensi Ekskul
          </h1>
          <p className="text-slate-500 mt-1">
            Hadir = <span className="font-semibold text-violet-600">+10 XP</span> dan mempertahankan streak harianmu!
          </p>
        </div>

        {/* Streak Badge */}
        <div className={`flex items-center gap-2 px-5 py-3 rounded-2xl border font-bold text-base self-start md:self-auto ${currentStreak > 0
            ? 'bg-orange-50 border-orange-200 text-orange-700'
            : 'bg-slate-100 border-slate-200 text-slate-500'
          }`}>
          <Flame className={`h-5 w-5 ${currentStreak > 0 ? 'text-orange-500 fill-orange-500' : 'text-slate-400'}`} />
          {currentStreak > 0 ? `${currentStreak} Hari Streak!` : 'Belum ada streak'}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">

        {/* KARTU ABSEN */}
        <Card className={`md:col-span-1 shadow-lg overflow-hidden relative ${isAttendanceOpen ? 'border-emerald-200' : 'border-slate-300 bg-slate-50'}`}>
          <div className={`absolute top-0 left-0 w-full h-2 ${isAttendanceOpen ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-slate-300'}`} />
          <CardHeader>
            <CardTitle className="text-lg">Status Hari Ini</CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center text-center py-6">

            {hasAttendedToday ? (
              <div className="space-y-4 animate-in zoom-in duration-300">
                <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h3 className="font-bold text-xl text-slate-900">Sudah Absen!</h3>
                <p className="text-sm text-slate-500">Terima kasih sudah hadir hari ini.</p>
                {currentStreak > 1 && (
                  <div className="flex items-center gap-1.5 justify-center bg-orange-50 border border-orange-100 rounded-full px-4 py-2">
                    <Flame className="h-4 w-4 text-orange-500 fill-orange-500" />
                    <span className="text-sm font-bold text-orange-700">{currentStreak} Hari Berturut-turut!</span>
                  </div>
                )}
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 mt-2 px-3 py-1 text-sm font-bold border border-yellow-200">
                  <Star className="h-4 w-4 mr-1 fill-yellow-500 text-yellow-500" /> +10 XP Didapatkan
                </Badge>
              </div>
            ) : !isAttendanceOpen ? (
              <div className="space-y-4 w-full">
                <div className="h-20 w-20 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-10 w-10" />
                </div>
                <h3 className="font-bold text-xl text-slate-900">Absensi Ditutup</h3>
                <p className="text-sm text-slate-500 mt-1">Sesi absensi belum dibuka. Silakan tunggu instruksi.</p>
              </div>
            ) : (
              <div className="space-y-6 w-full">
                <div className="h-20 w-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-10 w-10" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-slate-900">Belum Absen</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {currentStreak > 0
                      ? `Pertahankan streak ${currentStreak} harimu! Absen sekarang.`
                      : 'Klik tombol di bawah untuk mencatat kehadiranmu.'}
                  </p>
                </div>
                {successMessage && (
                  <p className="text-sm font-semibold text-emerald-600 bg-emerald-50 rounded-lg p-2">{successMessage}</p>
                )}
                <Button
                  onClick={handleCheckIn}
                  disabled={isSubmitting}
                  className="w-full h-12 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20"
                >
                  {isSubmitting ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : 'Isi Daftar Hadir ✅'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* RIWAYAT ABSENSI */}
        <Card className="md:col-span-2 shadow-sm border-slate-200">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-500" /> Riwayat Kehadiran
              <Badge variant="secondary" className="ml-auto">{attendances.length}× Hadir</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {attendances.length === 0 ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                <AlertCircle className="h-10 w-10 text-slate-300 mb-3" />
                <p>Belum ada riwayat absensi.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                {attendances.map((record, idx) => (
                  <div key={record.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">
                          {new Date(record.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          Pukul {new Date(record.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {idx === 0 && (
                        <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border border-emerald-200">Terbaru</Badge>
                      )}
                      <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200">Hadir</Badge>
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