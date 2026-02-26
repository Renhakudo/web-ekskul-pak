'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Settings, CalendarCheck, UserPlus, Loader2 } from 'lucide-react'

export default function AdminSettingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // State Saklar
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
    
    // Update UI instan biar terasa responsif
    if (field === 'is_attendance_open') setAttendanceOpen(newValue)
    if (field === 'is_registration_open') setRegistrationOpen(newValue)

    // Update ke Database
    const { error } = await supabase
      .from('app_settings')
      .update({ [field]: newValue, updated_at: new Date().toISOString() })
      .eq('id', 1)

    if (error) {
      alert("Gagal menyimpan pengaturan. Pastikan akun ini adalah Admin/Guru. Error: " + error.message)
      // Kalau error, kembalikan saklar ke posisi semula
      if (field === 'is_attendance_open') setAttendanceOpen(currentValue)
      if (field === 'is_registration_open') setRegistrationOpen(currentValue)
    }
    setSaving(false)
  }

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-violet-600 h-8 w-8" /></div>

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Settings className="h-8 w-8 text-slate-700" /> Pengaturan Sistem
        </h1>
        <p className="text-slate-500 mt-2">Pusat kendali untuk membuka atau menutup fitur aplikasi ekskul.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* SAKLAR ABSENSI */}
        <Card className={attendanceOpen ? "border-emerald-300 shadow-emerald-100" : "border-slate-200 opacity-80"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarCheck className="h-5 w-5 text-emerald-600" /> Absensi Kelas</CardTitle>
            <CardDescription>Buka akses agar siswa bisa mengisi daftar hadir hari ini.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <Label className={`font-bold ${attendanceOpen ? 'text-emerald-600' : 'text-slate-500'}`}>
              {attendanceOpen ? 'STATUS: DIBUKA' : 'STATUS: DITUTUP'}
            </Label>
            
            {/* TOMBOL TOGGLE CUSTOM TAILWIND */}
            <button 
              type="button"
              onClick={() => handleToggle('is_attendance_open', attendanceOpen)}
              disabled={saving}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${attendanceOpen ? 'bg-emerald-600' : 'bg-slate-300'} ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className="sr-only">Toggle Absensi</span>
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-md ${attendanceOpen ? 'translate-x-9' : 'translate-x-1'}`} />
            </button>
          </CardContent>
        </Card>

        {/* SAKLAR PENDAFTARAN */}
        <Card className={registrationOpen ? "border-blue-300 shadow-blue-100" : "border-slate-200 opacity-80"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-blue-600" /> Pendaftaran Akun</CardTitle>
            <CardDescription>Buka form register agar siswa baru bisa membuat akun.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <Label className={`font-bold ${registrationOpen ? 'text-blue-600' : 'text-slate-500'}`}>
              {registrationOpen ? 'STATUS: DIBUKA' : 'STATUS: DITUTUP'}
            </Label>
            
            {/* TOMBOL TOGGLE CUSTOM TAILWIND */}
            <button 
              type="button"
              onClick={() => handleToggle('is_registration_open', registrationOpen)}
              disabled={saving}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${registrationOpen ? 'bg-blue-600' : 'bg-slate-300'} ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className="sr-only">Toggle Pendaftaran</span>
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-md ${registrationOpen ? 'translate-x-9' : 'translate-x-1'}`} />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}