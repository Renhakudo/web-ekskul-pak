'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Settings, CalendarCheck, UserPlus, Loader2, AlertTriangle, Power } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminSettingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [attendanceOpen, setAttendanceOpen] = useState(false)
  const [registrationOpen, setRegistrationOpen] = useState(true)

  const fetchSettings = async () => {
    const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).single()
    if (data) {
      setAttendanceOpen(data.is_attendance_open)
      setRegistrationOpen(data.is_registration_open)
    } else if (error) {
      console.error("Gagal ambil setting:", error)
      toast.error("Sistem gagal membaca panel pengaturan.")
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchSettings()

    // 🪄 MAGIC: Real-Time Sync antar Admin
    const channel = supabase
      .channel('public:app_settings')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_settings', filter: 'id=eq.1' }, (payload) => {
        setAttendanceOpen(payload.new.is_attendance_open)
        setRegistrationOpen(payload.new.is_registration_open)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleToggle = async (field: 'is_attendance_open' | 'is_registration_open', currentValue: boolean) => {
    setSaving(true)
    const newValue = !currentValue

    // Optimistic UI Update (biar terasa instan)
    if (field === 'is_attendance_open') setAttendanceOpen(newValue)
    if (field === 'is_registration_open') setRegistrationOpen(newValue)

    const { error } = await supabase
      .from('app_settings')
      .update({ [field]: newValue, updated_at: new Date().toISOString() })
      .eq('id', 1)

    if (error) {
      toast.error("Gagal memutar saklar! Pastikan pangkatmu mencukupi. (" + error.message + ")")
      // Revert jika gagal
      if (field === 'is_attendance_open') setAttendanceOpen(currentValue)
      if (field === 'is_registration_open') setRegistrationOpen(currentValue)
    } else {
      toast.success(`Saklar ${field === 'is_attendance_open' ? 'Absensi' : 'Pendaftaran'} berhasil diputar! ⚡`)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7]">
        <Loader2 className="animate-spin h-14 w-14 text-slate-900 mb-4" />
        <p className="font-black text-slate-500 uppercase tracking-widest">Membuka Ruang Mesin...</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-10 max-w-7xl mx-auto min-h-screen font-sans relative z-0 overflow-x-hidden pb-24">

      {/* ====== BACKGROUND DOT PATTERN ====== */}
      <div className="absolute inset-0 z-[-1] bg-[radial-gradient(#cbd5e1_2px,transparent_2px)] [background-size:32px_32px] opacity-40 fixed"></div>

      {/* ====== HEADER ====== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-200 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] md:shadow-[12px_12px_0px_#0f172a] rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 relative mt-4 overflow-hidden">
        {/* Dekorasi Garis Neobrutalism */}
        <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 10px)' }}></div>
        
        <div className="relative z-10 flex-1">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4 uppercase drop-shadow-sm">
            <div className="bg-white p-3 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] transform rotate-3 hover:-rotate-3 transition-transform shrink-0">
              <Settings className="h-8 w-8 md:h-10 md:w-10 text-slate-900" />
            </div>
            Pengaturan Inti
          </h1>
          <p className="text-slate-800 font-bold text-base md:text-lg mt-4 md:mt-5 bg-white/70 inline-block px-4 py-1.5 border-2 border-slate-900 rounded-xl shadow-sm -rotate-1 hover:rotate-1 transition-transform backdrop-blur-sm">
            Pusat kendali master. Hati-hati saat memutar tuas utamanya komandan.
          </p>
        </div>
      </div>

      {/* ====== CONTROL PANELS ====== */}
      <div className="grid gap-6 md:gap-8 lg:grid-cols-2">
        
        {/* SAKLAR 1: ABSENSI */}
        <Card className={`border-4 border-slate-900 rounded-[2rem] overflow-hidden transition-all duration-500 flex flex-col ${attendanceOpen ? "bg-emerald-300 shadow-[8px_8px_0px_#0f172a] transform -rotate-1" : "bg-slate-100 shadow-[4px_4px_0px_#0f172a]"}`}>
          <CardHeader className="p-6 md:p-8 pb-4 bg-white/40 border-b-4 border-slate-900">
            <CardTitle className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-3 uppercase">
              <div className={`p-2 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] ${attendanceOpen ? 'bg-emerald-400' : 'bg-white'}`}>
                <CalendarCheck className="h-6 w-6 md:h-8 md:w-8 text-slate-900" />
              </div>
              Portal Absensi
            </CardTitle>
            <CardDescription className="text-base font-bold text-slate-700 mt-3 h-12 line-clamp-2">
              Buka gerbang kehadiran hari ini agar siswa dapat melakukan presensi mandiri.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-8 flex flex-col gap-6 mt-auto">
            <div className={`p-4 rounded-2xl border-4 border-slate-900 font-black text-center text-2xl flex flex-col items-center justify-center h-24 shadow-inner transition-colors ${attendanceOpen ? 'bg-white text-slate-900' : 'bg-slate-300 text-slate-500'}`}>
              STATUS: {attendanceOpen ? <span className="text-emerald-600 animate-pulse mt-1">AKTIF (ON)</span> : <span className="text-slate-500 mt-1">TERKUNCI (OFF)</span>}
            </div>

            <button
              type="button"
              onClick={() => handleToggle('is_attendance_open', attendanceOpen)}
              disabled={saving}
              className={`relative w-full h-16 md:h-20 rounded-[1.5rem] border-4 border-slate-900 transition-all font-black text-xl md:text-2xl flex items-center justify-center uppercase tracking-widest shadow-[6px_6px_0px_#0f172a] hover:translate-y-1 hover:shadow-[2px_2px_0px_#0f172a] active:translate-y-[6px] active:translate-x-[6px] active:shadow-none focus:outline-none ${
                attendanceOpen 
                  ? 'bg-red-400 text-slate-900 hover:bg-red-500' 
                  : 'bg-emerald-400 text-slate-900 hover:bg-emerald-300'
              } ${saving ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {saving ? <Loader2 className="animate-spin h-8 w-8" /> : (
                <>
                  <Power className="mr-3 h-6 w-6 md:h-8 md:w-8" />
                  {attendanceOpen ? "Tutup Portal" : "Buka Portal"}
                </>
              )}
            </button>
          </CardContent>
        </Card>

        {/* SAKLAR 2: PENDAFTARAN */}
        <Card className={`border-4 border-slate-900 rounded-[2rem] overflow-hidden transition-all duration-500 flex flex-col ${registrationOpen ? "bg-blue-300 shadow-[8px_8px_0px_#0f172a] transform rotate-1" : "bg-slate-100 shadow-[4px_4px_0px_#0f172a]"}`}>
          <CardHeader className="p-6 md:p-8 pb-4 bg-white/40 border-b-4 border-slate-900">
            <CardTitle className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-3 uppercase">
              <div className={`p-2 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] ${registrationOpen ? 'bg-blue-400' : 'bg-white'}`}>
                <UserPlus className="h-6 w-6 md:h-8 md:w-8 text-slate-900" />
              </div>
              Penerimaan Siswa
            </CardTitle>
            <CardDescription className="text-base font-bold text-slate-700 mt-3 h-12 line-clamp-2">
              Izinkan calon anggota baru untuk membuat akun dan mendaftar ke dalam sistem ekskul.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-8 flex flex-col gap-6 mt-auto">
            <div className={`p-4 rounded-2xl border-4 border-slate-900 font-black text-center text-2xl flex flex-col items-center justify-center h-24 shadow-inner transition-colors ${registrationOpen ? 'bg-white text-slate-900' : 'bg-slate-300 text-slate-500'}`}>
              AKSES: {registrationOpen ? <span className="text-blue-600 animate-pulse mt-1">DIBUKA (ON)</span> : <span className="text-slate-500 mt-1">DITUTUP (OFF)</span>}
            </div>

            <button
              type="button"
              onClick={() => handleToggle('is_registration_open', registrationOpen)}
              disabled={saving}
              className={`relative w-full h-16 md:h-20 rounded-[1.5rem] border-4 border-slate-900 transition-all font-black text-xl md:text-2xl flex items-center justify-center uppercase tracking-widest shadow-[6px_6px_0px_#0f172a] hover:translate-y-1 hover:shadow-[2px_2px_0px_#0f172a] active:translate-y-[6px] active:translate-x-[6px] active:shadow-none focus:outline-none ${
                registrationOpen 
                  ? 'bg-red-400 text-slate-900 hover:bg-red-500' 
                  : 'bg-blue-400 text-slate-900 hover:bg-blue-300'
              } ${saving ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {saving ? <Loader2 className="animate-spin h-8 w-8" /> : (
                <>
                  <Power className="mr-3 h-6 w-6 md:h-8 md:w-8" />
                  {registrationOpen ? "Blokir Akses" : "Buka Akses"}
                </>
              )}
            </button>
          </CardContent>
        </Card>
      </div>

      {/* ====== INFO NOTICE ====== */}
      <div className="bg-yellow-300 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] p-6 md:p-8 rounded-[2rem] flex flex-col sm:flex-row items-start sm:items-center gap-6 transform -rotate-1 mt-12 transition-transform hover:rotate-0">
        <div className="bg-white p-3 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] shrink-0">
          <AlertTriangle className="h-8 w-8 md:h-10 md:w-10 text-red-600" />
        </div>
        <div>
          <h4 className="font-black text-slate-900 text-2xl uppercase">Peringatan Keras!</h4>
          <p className="font-bold text-slate-800 mt-2 text-base md:text-lg leading-relaxed">
            Pastikan untuk <span className="underline decoration-wavy decoration-red-500 underline-offset-4">tidak sembarangan memainkan saklar ini</span>. Efeknya langsung berjalan secara global pada seluruh pendaftaran dan absensi siswa di server.
          </p>
        </div>
      </div>
    </div>
  )
}