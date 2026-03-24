'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Settings, CalendarCheck, UserPlus, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminSettingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [attendanceOpen, setAttendanceOpen] = useState(false)
  const [registrationOpen, setRegistrationOpen] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).single()
      if (data) {
        setAttendanceOpen(data.is_attendance_open)
        setRegistrationOpen(data.is_registration_open)
      } else if (error) {
        console.error("Gagal ambil setting:", error)
      }
      setLoading(false)
    }
    fetchSettings()
  }, [])

  const handleToggle = async (field: 'is_attendance_open' | 'is_registration_open', currentValue: boolean) => {
    setSaving(true)
    const newValue = !currentValue

    if (field === 'is_attendance_open') setAttendanceOpen(newValue)
    if (field === 'is_registration_open') setRegistrationOpen(newValue)

    const { error } = await supabase
      .from('app_settings')
      .update({ [field]: newValue, updated_at: new Date().toISOString() })
      .eq('id', 1)

    if (error) {
      toast.error("Gagal menyimpan pengaturan. Pastikan akun ini adalah Admin/Guru. Error: " + error.message)
      if (field === 'is_attendance_open') setAttendanceOpen(currentValue)
      if (field === 'is_registration_open') setRegistrationOpen(currentValue)
    } else {
      toast.success("Pengaturan situs berhasil diperbarui!")
    }
    setSaving(false)
  }

  if (loading) return <div className="p-12 flex justify-center mt-20"><Loader2 className="animate-spin text-slate-900 h-12 w-12" /></div>

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-10 min-h-screen font-sans">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-200 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] p-8 md:p-10 relative mt-2 overflow-hidden">
        {/* Dekorasi Garis */}
        <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 8px)' }}></div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 flex items-center gap-4">
            <div className="bg-white p-3 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] transform rotate-3">
              <Settings className="h-10 w-10 text-slate-900" />
            </div>
            Pengaturan Inti
          </h1>
          <p className="text-slate-800 font-bold text-lg mt-4 bg-white inline-block px-4 py-1.5 border-2 border-slate-900 rounded-xl shadow-sm -rotate-1">
            Pusat kendali master. Hat-hati saat memutar saklar utamanya.
          </p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* SAKLAR ABSENSI */}
        <Card className={`border-4 border-slate-900 rounded-[32px] overflow-hidden transition-all ${attendanceOpen ? "bg-emerald-300 shadow-[8px_8px_0px_#0f172a] transform -rotate-1" : "bg-white shadow-[4px_4px_0px_#0f172a]"}`}>
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <div className="bg-white p-2 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]">
                <CalendarCheck className="h-6 w-6 text-slate-900" />
              </div>
              Portal Absensi
            </CardTitle>
            <CardDescription className="text-base font-bold text-slate-700 mt-2 h-12 line-clamp-2">Buka gerbang kehadiran hari ini agar siswa dapat absen.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-4 flex flex-col gap-6">
            <div className={`p-4 rounded-2xl border-4 border-slate-900 font-black text-center text-xl flex flex-col items-center justify-center h-24 shadow-[2px_2px_0px_#0f172a] bg-white text-slate-900`}>
              STATUS: {attendanceOpen ? <span className="text-emerald-600 animate-pulse">AKTIF ON</span> : <span className="text-red-500">TERKUNCI OFF</span>}
            </div>

            <button
              type="button"
              onClick={() => handleToggle('is_attendance_open', attendanceOpen)}
              disabled={saving}
              className={`relative w-full h-16 rounded-2xl border-4 border-slate-900 transition-all font-black text-xl flex items-center justify-center uppercase tracking-widest shadow-[4px_4px_0px_#0f172a] hover:translate-y-1 hover:shadow-none focus:outline-none ${attendanceOpen ? 'bg-red-400 text-slate-900 hover:bg-red-500' : 'bg-emerald-400 text-slate-900 hover:bg-emerald-500'} ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {saving ? <Loader2 className="animate-spin h-6 w-6" /> : (attendanceOpen ? "Tutup Portal" : "Buka Portal")}
            </button>
          </CardContent>
        </Card>

        {/* SAKLAR PENDAFTARAN */}
        <Card className={`border-4 border-slate-900 rounded-[32px] overflow-hidden transition-all ${registrationOpen ? "bg-blue-300 shadow-[8px_8px_0px_#0f172a] transform rotate-1" : "bg-white shadow-[4px_4px_0px_#0f172a]"}`}>
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <div className="bg-white p-2 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]">
                <UserPlus className="h-6 w-6 text-slate-900" />
              </div>
              Penerimaan Siswa
            </CardTitle>
            <CardDescription className="text-base font-bold text-slate-700 mt-2 h-12 line-clamp-2">Izinkan calon siswa baru untuk mendaftar akun di ekskul.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-4 flex flex-col gap-6">
            <div className={`p-4 rounded-2xl border-4 border-slate-900 font-black text-center text-xl flex flex-col items-center justify-center h-24 shadow-[2px_2px_0px_#0f172a] bg-white text-slate-900`}>
              RAPOR: {registrationOpen ? <span className="text-blue-600 animate-pulse">BERJALAN ON</span> : <span className="text-red-500">TERTUTUP OFF</span>}
            </div>

            <button
              type="button"
              onClick={() => handleToggle('is_registration_open', registrationOpen)}
              disabled={saving}
              className={`relative w-full h-16 rounded-2xl border-4 border-slate-900 transition-all font-black text-xl flex items-center justify-center uppercase tracking-widest shadow-[4px_4px_0px_#0f172a] hover:translate-y-1 hover:shadow-none focus:outline-none ${registrationOpen ? 'bg-red-400 text-slate-900 hover:bg-red-500' : 'bg-blue-400 text-slate-900 hover:bg-blue-500'} ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {saving ? <Loader2 className="animate-spin h-6 w-6" /> : (registrationOpen ? "Hentikan Pendaftaran" : "Terima Pendaftaran")}
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Info Notice */}
      <div className="bg-yellow-200 border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] p-6 rounded-2xl flex items-start gap-4 transform -rotate-1 mt-8">
        <AlertTriangle className="h-8 w-8 text-slate-900 shrink-0 mt-1" />
        <div>
          <h4 className="font-black text-slate-900 text-xl">Perhatian!</h4>
          <p className="font-bold text-slate-700 mt-1">
            Pastikan untuk tidak sembarangan memainkan saklar ini karena akan berefek langsung pada proses pendaftaran dan absensi semua siswa di server.
          </p>
        </div>
      </div>
    </div>
  )
}