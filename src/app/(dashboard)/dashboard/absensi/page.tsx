'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarCheck, Clock, CheckCircle2, AlertCircle, Loader2, Star, KeyRound, Flame, Terminal } from 'lucide-react'
import { awardEligibleBadges } from '@/lib/badge-utils'
import { updateLearningStreak } from '@/lib/streak-utils'
import { toast } from 'sonner'

export default function AbsensiPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attendances, setAttendances] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [attendanceCode, setAttendanceCode] = useState('')

  const fetchAttendances = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      setUserId(user.id)

      const [attendRes, profileRes] = await Promise.all([
        supabase
          .from('attendances')
          .select('*, class_sessions(unique_code), classes(title)')
          .eq('user_id', user.id)
          .not('session_id', 'is', null) // Hanya tampilkan absensi berbasis sesi kelas
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('profiles')
          .select('streak, points')
          .eq('id', user.id)
          .single(),
      ])

      if (attendRes.data) {
        setAttendances(attendRes.data)
      }

      if (profileRes.data) {
        setCurrentStreak(profileRes.data.streak || 0)
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAttendances()
  }, [fetchAttendances])

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !attendanceCode || attendanceCode.length !== 6) {
      toast.error('Masukkan 6 digit kode unik!')
      return
    }

    setIsSubmitting(true)
    const upperCode = attendanceCode.toUpperCase()

    try {
      // 1. Cari sesi yang valid
      const { data: session, error: sessionErr } = await supabase
        .from('class_sessions')
        .select('id, class_id, expires_at')
        .eq('unique_code', upperCode)
        .single()

      if (sessionErr || !session) {
        toast.error('Kode tidak ditemukan atau salah.')
        setIsSubmitting(false)
        return
      }

      // 2. Cek waktu kedaluwarsa
      if (new Date(session.expires_at) < new Date()) {
        toast.error('Waktu sesi sudah habis!')
        setIsSubmitting(false)
        return
      }

      // 3. Catat kehadiran
      const todayString = new Date().toISOString().split('T')[0]
      const { error: attendError } = await supabase
        .from('attendances')
        .insert({ 
          user_id: userId, 
          session_id: session.id,
          class_id: session.class_id,
          status: 'hadir', 
          date_only: todayString,
          xp_awarded: 50
        })

      if (attendError) {
        if (attendError.code === '23505') {
          toast.info('Kamu sudah absen di kelas ini.')
        } else {
          toast.error('Gagal mencatat absensi: ' + attendError.message)
        }
        setIsSubmitting(false)
        return
      }

      // 4. Update XP user
      const { data: profile } = await supabase.from('profiles').select('points').eq('id', userId).single()
      
      await supabase.from('profiles').update({
        points: (profile?.points || 0) + 50,
        last_activity: todayString,
      }).eq('id', userId)

      // 5. Catat log points (opsional tapi disarankan)
      await supabase.from('points_logs').insert({
        user_id: userId,
        activity_type: 'attendance',
        points: 50,
        description: `Absensi kelas (${upperCode})`
      })

      // 6. Update Streak & Badges
      const newStreak = await updateLearningStreak(userId, supabase)
      setCurrentStreak(newStreak ?? currentStreak)
      
      toast.success('+50 XP Berhasil Diamankan!')
      setAttendanceCode('')
      await fetchAttendances()
      
      awardEligibleBadges(userId, supabase).catch(() => {})

    } catch (err: any) {
      toast.error('Terjadi kesalahan sistem.')
    }

    setIsSubmitting(false)
  }

  // --- RENDER LOADER ---
  if (loading) return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-4 md:space-y-6 mt-10">
      <Skeleton className="h-40 w-full rounded-[2rem] border-4 border-slate-900" />
      <Skeleton className="h-64 w-full rounded-[2rem] border-4 border-slate-900" />
    </div>
  )

  if (!userId) return (
    <div className="flex h-screen items-center justify-center bg-[#FDFBF7]">
      <div className="text-center font-black text-slate-500 text-lg md:text-xl uppercase tracking-widest">Akses ditolak. Silakan login kembali.</div>
    </div>
  )

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 min-h-screen font-sans relative z-0 pb-24">
      {/* Background pattern */}
      <div className="absolute inset-0 z-[-1] bg-[radial-gradient(#cbd5e1_2px,transparent_2px)] [background-size:32px_32px] opacity-40 fixed"></div>

      {/* ====== HEADER ====== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-cyan-300 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 relative overflow-hidden mt-4">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 10px)' }}></div>
        <div className="relative z-10 flex-1">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 flex flex-wrap items-center gap-4 uppercase tracking-tight">
            <div className="bg-white p-3 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] transform -rotate-3 hover:rotate-3 transition-transform shrink-0">
              <Terminal className="h-8 w-8 text-cyan-600" />
            </div>
            Terminal Absensi
          </h1>
          <p className="text-cyan-950 font-bold mt-4 text-base md:text-lg bg-white/60 px-4 py-2 rounded-xl border-2 border-slate-900 shadow-sm inline-block">
            Input kode dari instruktur untuk mengklaim <span className="bg-yellow-300 border-2 border-slate-900 px-2 py-0.5 rounded shadow-sm mx-1">+50 XP</span>
          </p>
        </div>

        {/* Streak Badge */}
        <div className={`relative z-10 flex items-center gap-3 px-6 py-4 rounded-2xl border-4 font-black shadow-[4px_4px_0px_#0f172a] transform md:rotate-2 shrink-0 ${
          currentStreak > 0
          ? 'bg-orange-400 border-slate-900 text-slate-900'
          : 'bg-slate-100 border-slate-900 text-slate-400 shadow-[2px_2px_0px_#0f172a] md:rotate-0'
        }`}>
          <Flame className={`h-6 w-6 ${currentStreak > 0 ? 'text-yellow-200 fill-yellow-300 animate-pulse' : 'text-slate-400'}`} />
          <span className="text-xl uppercase">{currentStreak > 0 ? `${currentStreak} Hari Streak!` : 'Belum Mulai'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ====== FORM ABSENSI ====== */}
        <div className="lg:col-span-5">
          <Card className="border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-[2rem] bg-white transform hover:-translate-y-1 transition-transform h-full">
            <div className="h-4 w-full bg-cyan-400 border-b-4 border-slate-900" />
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-20 h-20 bg-slate-100 border-4 border-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0px_#0f172a]">
                  <KeyRound className="h-10 w-10 text-slate-400" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-wide">Punya Kode Rahasia?</h2>
                <p className="font-bold text-slate-500 text-sm">Minta kode absensi 6 digit dari instrukturmu sebelum waktunya habis.</p>
              </div>

              <form onSubmit={handleCheckIn} className="space-y-4 pt-4 border-t-4 border-slate-100">
                <div className="space-y-2">
                  <Input 
                    type="text" 
                    value={attendanceCode} 
                    onChange={e => setAttendanceCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    placeholder="Contoh: A1B2C3"
                    className="h-16 text-center text-3xl tracking-[0.2em] font-black uppercase border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-2xl focus-visible:ring-0 focus:translate-y-1 focus:shadow-[2px_2px_0px_#0f172a] transition-all bg-slate-50"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting || attendanceCode.length !== 6}
                  className="w-full h-16 text-xl font-black bg-emerald-400 hover:bg-emerald-300 text-slate-900 border-4 border-slate-900 rounded-2xl shadow-[6px_6px_0px_#0f172a] active:shadow-none active:translate-y-1 hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_#0f172a] transition-all uppercase tracking-wider"
                >
                  {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : <><CheckCircle2 className="h-6 w-6 mr-2" /> Klaim Kehadiran</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* ====== RIWAYAT ABSENSI ====== */}
        <div className="lg:col-span-7">
          <Card className="border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-[2rem] bg-white h-full max-h-[600px] flex flex-col overflow-hidden">
            <CardHeader className="bg-slate-900 text-white flex flex-row items-center justify-between p-6">
              <CardTitle className="text-xl font-black flex items-center gap-3 uppercase tracking-wider">
                <Clock className="h-6 w-6 text-emerald-400" /> Riwayat Terminal
              </CardTitle>
              <Badge className="bg-white/20 text-white border-0 hover:bg-white/30 text-sm">{attendances.length} Catatan</Badge>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative bg-slate-50 overflow-hidden flex flex-col">
              {attendances.length === 0 ? (
                <div className="p-10 flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-white border-2 border-slate-300 border-dashed rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="font-bold text-slate-500 text-lg">Jejak terminalmu masih kosong.</p>
                </div>
              ) : (
                <div className="overflow-y-auto p-4 space-y-3 h-full">
                  {attendances.map((record, idx) => (
                    <div key={record.id} className="p-4 rounded-xl border-2 border-slate-900 bg-white shadow-[2px_2px_0px_#0f172a] flex items-center justify-between hover:-translate-y-1 hover:shadow-[4px_4px_0px_#0f172a] transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-emerald-100 border-2 border-slate-900 flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform">
                          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-base md:text-lg uppercase">
                            {record.classes?.title || 'Kelas Sistem'}
                          </p>
                          <p className="text-sm font-bold text-slate-500 mt-1 flex items-center gap-2">
                            <CalendarCheck className="h-4 w-4" /> 
                            {new Date(record.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} • {new Date(record.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-400 text-slate-900 border-2 border-slate-900 px-3 py-1 font-black shadow-sm uppercase shrink-0">
                        +{record.xp_awarded || 50} XP
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}