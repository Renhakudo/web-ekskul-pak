'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarCheck, Clock, CheckCircle2, AlertCircle, Loader2, Star, Lock } from 'lucide-react'

const getTodayDateString = () => {
  const today = new Date()
  const offset = today.getTimezoneOffset()
  today.setMinutes(today.getMinutes() - offset)
  return today.toISOString().split('T')[0]
}

export default function AbsensiPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attendances, setAttendances] = useState<any[]>([])
  const [hasAttendedToday, setHasAttendedToday] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  // STATE BARU: Cek saklar admin
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false)

  const todayString = getTodayDateString()

  const fetchAttendances = async () => {
    setLoading(true)
    
    // 1. Cek Saklar Pusat
    const { data: settings } = await supabase.from('app_settings').select('is_attendance_open').eq('id', 1).single()
    if (settings) {
      setIsAttendanceOpen(settings.is_attendance_open)
    }

    // 2. Ambil data absensi siswa
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    if (authUser) {
      setUser(authUser)
      const { data } = await supabase
        .from('attendances')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })

      if (data) {
        setAttendances(data)
        const todayAttendance = data.find(a => a.date_only === todayString)
        setHasAttendedToday(!!todayAttendance)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchAttendances()
  }, [])

  const handleCheckIn = async () => {
    if (!user?.id) return
    setIsSubmitting(true)
    
    const { error: attendError } = await supabase.from('attendances').insert({ user_id: user.id, status: 'hadir', date_only: todayString })

    if (attendError) {
      alert("Gagal melakukan absensi: " + attendError.message)
      setIsSubmitting(false)
      return
    }

    const { data: profile } = await supabase.from('profiles').select('points').eq('id', user.id).single()
    if (profile) {
      await supabase.from('profiles').update({ points: (profile.points || 0) + 10 }).eq('id', user.id)
    }

    await fetchAttendances()
    setIsSubmitting(false)
    alert("Berhasil Absen! Kamu mendapatkan +10 XP 🌟")
  }

  if (loading) return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <Skeleton className="h-40 w-full rounded-2xl" /><Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  )

  if (!user) return <div className="flex h-screen items-center justify-center"><div className="text-center text-slate-500">Sesi kamu telah habis, silakan login kembali.</div></div>

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 min-h-screen">
      
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3"><CalendarCheck className="h-8 w-8 text-emerald-500" /> Absensi Ekskul</h1>
        <p className="text-slate-500">Jangan lupa isi daftar hadir saat sesi ekskul berlangsung untuk mendapatkan +10 XP!</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* KARTU ABSEN */}
        <Card className={`md:col-span-1 shadow-lg overflow-hidden relative ${isAttendanceOpen ? 'border-emerald-200' : 'border-slate-300 bg-slate-50'}`}>
          <div className={`absolute top-0 left-0 w-full h-2 ${isAttendanceOpen ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-slate-300'}`} />
          <CardHeader>
            <CardTitle className="text-lg">Status Hari Ini</CardTitle>
            <CardDescription>{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center text-center py-6">
            
            {hasAttendedToday ? (
              // KONDISI 1: SUDAH ABSEN
              <div className="space-y-4 animate-in zoom-in duration-300">
                <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="h-10 w-10" /></div>
                <h3 className="font-bold text-xl text-slate-900">Sudah Absen!</h3>
                <p className="text-sm text-slate-500">Terima kasih sudah hadir hari ini.</p>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 mt-2 px-3 py-1 text-sm font-bold border border-yellow-200"><Star className="h-4 w-4 mr-1 fill-yellow-500 text-yellow-500" /> +10 XP Didapatkan</Badge>
              </div>
            ) : !isAttendanceOpen ? (
              // KONDISI 2: BELUM ABSEN, TAPI SAKLAR DITUTUP ADMIN
              <div className="space-y-4 w-full">
                <div className="h-20 w-20 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-4"><Lock className="h-10 w-10" /></div>
                <h3 className="font-bold text-xl text-slate-900">Absensi Ditutup</h3>
                <p className="text-sm text-slate-500 mt-1">Sesi absensi belum dibuka oleh Admin atau Guru. Silakan tunggu instruksi.</p>
              </div>
            ) : (
              // KONDISI 3: BELUM ABSEN & SAKLAR DIBUKA
              <div className="space-y-6 w-full">
                <div className="h-20 w-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4"><Clock className="h-10 w-10" /></div>
                <div><h3 className="font-bold text-xl text-slate-900">Belum Absen</h3><p className="text-sm text-slate-500 mt-1">Silakan klik tombol di bawah untuk mencatat kehadiranmu.</p></div>
                <Button onClick={handleCheckIn} disabled={isSubmitting} className="w-full h-12 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20">
                  {isSubmitting ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "Isi Daftar Hadir"}
                </Button>
              </div>
            )}

          </CardContent>
        </Card>

        {/* RIWAYAT */}
        <Card className="md:col-span-2 shadow-sm border-slate-200">
          <CardHeader className="border-b bg-slate-50/50"><CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5 text-slate-500" /> Riwayat Kehadiran</CardTitle></CardHeader>
          <CardContent className="p-0">
            {attendances.length === 0 ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center"><AlertCircle className="h-10 w-10 text-slate-300 mb-3" /><p>Belum ada riwayat absensi.</p></div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                {attendances.map((record) => (
                  <div key={record.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center"><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div>
                      <div>
                        <p className="font-bold text-slate-900">{new Date(record.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3" /> Pukul {new Date(record.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200">Hadir</Badge>
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