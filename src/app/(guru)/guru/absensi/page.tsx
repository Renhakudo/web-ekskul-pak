'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Fingerprint, Calendar, Copy, RefreshCw, CheckCircle2, History, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export default function GuruAbsensiPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState<any[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  
  // Generator
  const [sessionDuration, setSessionDuration] = useState(5)
  const [activeSession, setActiveSession] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // History
  const [history, setHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: cls } = await supabase
      .from('classes')
      .select('id, title')
      .eq('created_by', user.id)
      .order('title')
      
    if (cls) {
      setClasses(cls)
      if (cls.length > 0) setSelectedClassId(cls[0].id)
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    if (selectedClassId) {
      fetchActiveSession(selectedClassId)
      fetchHistory(selectedClassId)
    }
  }, [selectedClassId])

  const fetchActiveSession = async (classId: string) => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('class_sessions')
      .select('*')
      .eq('class_id', classId)
      .eq('session_date', today)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    setActiveSession(data)
  }

  const fetchHistory = async (classId: string) => {
    setHistoryLoading(true)
    const { data } = await supabase.from('attendances')
      .select(`
        id, created_at, status, xp_awarded,
        profiles ( full_name, email ),
        class_sessions ( session_date )
      `)
      .eq('class_id', classId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setHistory(data)
    setHistoryLoading(false)
  }

  const generateAttendanceCode = async () => {
    if (!selectedClassId) return
    setIsGenerating(true)
    
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const expiresAt = new Date(Date.now() + sessionDuration * 60 * 1000).toISOString()
    const today = new Date().toISOString().split('T')[0]
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase.from('class_sessions')
      .insert({ 
        class_id: selectedClassId, 
        session_date: today, 
        unique_code: code, 
        expires_at: expiresAt, 
        created_by: user?.id 
      })
      .select().single()

    if (error) {
      toast.error('Gagal generate kode: ' + error.message)
    } else {
      setActiveSession(data)
      toast.success(`Kode "${code}" berhasil dibuat! Berlaku ${sessionDuration} menit.`)
    }
    setIsGenerating(false)
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto min-h-screen font-sans relative z-0 pb-24">
      {/* Background pattern */}
      <div className="absolute inset-0 z-[-1] bg-[radial-gradient(#cbd5e1_2px,transparent_2px)] [background-size:32px_32px] opacity-40 fixed" />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-center gap-6 bg-cyan-300 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[2rem] p-6 md:p-10 relative overflow-hidden mt-4">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 10px)' }} />
        <div className="bg-white p-4 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] transform -rotate-3 relative z-10 shrink-0">
          <Fingerprint className="h-10 w-10 text-cyan-600" />
        </div>
        <div className="relative z-10 text-center md:text-left flex-1">
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight uppercase drop-shadow-sm">
            Pusat Absensi
          </h1>
          <p className="text-slate-800 font-bold mt-2 bg-white/70 inline-block px-4 py-1.5 border-2 border-slate-900 rounded-xl shadow-sm rotate-1">
            Generate kode & pantau riwayat kehadiran siswa
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
        {/* KOLOM KIRI: GENERATOR */}
        <div className="md:col-span-5 space-y-6">
          <Card className="border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-[2rem] overflow-hidden">
            <div className="bg-slate-900 p-4 text-white">
              <h3 className="font-black text-xl flex items-center gap-2 uppercase tracking-wider">
                <Calendar className="w-5 h-5 text-cyan-400" /> Sesi Kelas
              </h3>
            </div>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label className="font-black uppercase text-xs">Pilih Kelas</Label>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger className="h-14 border-4 border-slate-900 font-bold bg-white text-base rounded-2xl focus:ring-0">
                    <SelectValue placeholder={loading ? "Memuat kelas..." : classes.length === 0 ? "Tidak ada kelas" : "Pilih kelas"} />
                  </SelectTrigger>
                  <SelectContent className="border-4 border-slate-900 rounded-xl">
                    {classes.map(c => (
                      <SelectItem key={c.id} value={c.id} className="font-bold py-3 text-base">
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {activeSession && new Date(activeSession.expires_at) > new Date() ? (
                <div className="bg-cyan-100 border-4 border-slate-900 rounded-2xl p-6 text-center shadow-[4px_4px_0px_#0f172a] transform hover:-rotate-1 transition-transform">
                  <p className="font-black text-slate-500 text-xs uppercase mb-2">KODE HARI INI</p>
                  <div className="text-5xl font-black text-slate-900 tracking-widest bg-white border-4 border-slate-900 rounded-xl py-3 px-2 shadow-inner inline-block">
                    {activeSession.unique_code}
                  </div>
                  <p className="font-bold text-slate-600 mt-3 text-sm">
                    Berlaku sampai: {new Date(activeSession.expires_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <Button 
                    onClick={() => { navigator.clipboard.writeText(activeSession.unique_code); toast.success('Disalin!') }}
                    className="mt-4 w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-wider rounded-xl border-2 border-transparent"
                  >
                    <Copy className="w-4 h-4 mr-2" /> Salin Kode
                  </Button>
                </div>
              ) : (
                <div className="bg-slate-50 border-4 border-dashed border-slate-300 rounded-2xl p-6 text-center">
                  <p className="font-bold text-slate-500">Belum ada kode aktif hari ini untuk kelas ini.</p>
                </div>
              )}

              <div className="space-y-4 pt-4 border-t-4 border-slate-100">
                <div className="space-y-2">
                  <Label className="font-black uppercase text-xs">Durasi Sesi Baru</Label>
                  <Select value={String(sessionDuration)} onValueChange={(v) => setSessionDuration(Number(v))}>
                    <SelectTrigger className="h-12 border-4 border-slate-900 font-bold bg-white rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-4 border-slate-900 rounded-xl">
                      {[5, 10, 15, 30, 60].map(d => (
                        <SelectItem key={d} value={String(d)} className="font-bold py-2">{d} Menit</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={generateAttendanceCode} disabled={isGenerating || !selectedClassId}
                  className="w-full h-14 bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-black text-lg uppercase tracking-wider border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] active:shadow-none active:translate-y-1 rounded-2xl transition-all"
                >
                  {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <><RefreshCw className="w-5 h-5 mr-2" /> {activeSession ? 'Perbarui Kode' : 'Buat Kode'}</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KOLOM KANAN: HISTORY */}
        <div className="md:col-span-7">
          <Card className="border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-[2rem] overflow-hidden h-full">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
              <h3 className="font-black text-xl flex items-center gap-2 uppercase tracking-wider">
                <History className="w-5 h-5 text-emerald-400" /> Riwayat Kehadiran
              </h3>
              <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">{history.length} Data</Badge>
            </div>
            <CardContent className="p-0">
              {historyLoading ? (
                <div className="p-10 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-slate-400" /></div>
              ) : history.length === 0 ? (
                <div className="p-10 text-center space-y-3">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto"><X className="w-8 h-8 text-slate-300" /></div>
                  <p className="font-bold text-slate-500">Belum ada riwayat absensi untuk kelas ini.</p>
                </div>
              ) : (
                <div className="max-h-[600px] overflow-y-auto p-4 space-y-3 bg-slate-50">
                  {history.map((h, i) => (
                    <div key={h.id} className="bg-white border-2 border-slate-900 rounded-xl p-4 flex items-center justify-between shadow-[2px_2px_0px_#0f172a] hover:shadow-[4px_4px_0px_#0f172a] hover:-translate-y-0.5 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 border-2 border-slate-900 rounded-full flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm">{h.profiles?.full_name || 'User Tidak Diketahui'}</p>
                          <p className="font-bold text-slate-500 text-xs">
                            {new Date(h.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year:'numeric'})} • {new Date(h.created_at).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-400 text-slate-900 border-2 border-slate-900 uppercase font-black px-2 shadow-sm">
                        +{h.xp_awarded} XP
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
