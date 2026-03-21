'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Loader2, Terminal, AlertCircle, Mail, Lock, User, 
  Sparkles, ArrowLeft, Eye, EyeOff, CheckCircle2, XCircle, KeyRound 
} from "lucide-react"
import { toast } from 'sonner'

export default function AuthPage() {
  const [loading, setLoading] = useState(false)
  const [registrationOpen, setRegistrationOpen] = useState<boolean | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Form State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')

  // UI State: Toggle Show Password
  const [showLoginPass, setShowLoginPass] = useState(false)
  const [showRegPass, setShowRegPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  // Cek apakah pendaftaran dibuka oleh admin
  useEffect(() => {
    const checkSettings = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('is_registration_open')
        .eq('id', 1)
        .single()
      setRegistrationOpen(data?.is_registration_open ?? true)
    }
    checkSettings()
  }, [])

  // Helper: redirect berdasarkan role
  const redirectByRole = async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    const role = profile?.role
    if (role === 'admin' || role === 'guru') {
      router.push('/admin')
    } else {
      router.push('/dashboard')
    }
    router.refresh()
  }

  // --- LOGIC PASSWORD STRENGTH ---
  const getPasswordStrength = (pass: string) => {
    let score = 0
    if (!pass) return score
    if (pass.length > 5) score += 1
    if (pass.length > 7) score += 1
    if (/[A-Z]/.test(pass) || /[0-9]/.test(pass)) score += 1
    if (/[^A-Za-z0-9]/.test(pass)) score += 1
    return Math.min(score, 4)
  }

  const strengthScore = getPasswordStrength(password)
  const strengthColors = ['bg-slate-200', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-400']
  const strengthWidths = ['w-0', 'w-1/4', 'w-2/4', 'w-3/4', 'w-full']
  const strengthLabels = ['Minimal 6 Karakter', 'Lemah', 'Lumayan', 'Kuat', 'Super Kuat!']

  // --- LOGIC LOGIN ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError) {
      setError('Email atau sandi salah. Silakan coba lagi.')
    } else if (data.user) {
      await redirectByRole(data.user.id)
    }
    setLoading(false)
  }

  // --- LOGIC REGISTER ---
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!registrationOpen) {
      setError('Pendaftaran akun sedang ditutup. Hubungi Admin.')
      return
    }

    if (password !== confirmPassword) {
      setError('Wah, kata sandi dan konfirmasi sandi tidak cocok. Cek lagi ya!')
      return
    }

    if (password.length < 6) {
      setError('Kata sandi harus minimal 6 karakter.')
      return
    }

    setLoading(true)
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'siswa',
        }
      }
    })

    if (signUpError) {
      if (signUpError.status === 429 || signUpError.message.toLowerCase().includes('rate limit')) {
        setError('Pendaftaran tidak dapat dilanjutkan karena batas server sedang penuh. Cobalah gunakan login Google.')
      } else {
        setError('Gagal mendaftar: ' + signUpError.message)
      }
    } else {
      setError('')
      toast.success('Pendaftaran Berhasil! Akun Anda sudah aktif, silakan langsung masuk (login).', { duration: 5000 })
      // Reset form on success
      setFullName('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      // Pindah ke tab login
      const loginTab = document.querySelector('[value="login"]') as HTMLElement
      if (loginTab) loginTab.click()
    }
    setLoading(false)
  }

  // --- LOGIC FORGOT PASSWORD ---
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!email) {
      toast.error('Masukkan emailmu dulu!')
      return
    }

    toast.info('Mohon maaf, fitur Lupa Sandi saat ini sedang dinonaktifkan sementara waktu. Silakan hubungi Admin atau coba masuk menggunakan akun Google Anda.', { duration: 6000 })
    setShowForgotPassword(false)
  }

  // --- LOGIC GOOGLE ---
  const handleGoogleLogin = async () => {
    setLoading(true)
    const origin = typeof window !== 'undefined' ? window.location.origin : ''

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    })

    if (oauthError) {
      setError(oauthError.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] font-sans p-4 py-12 relative overflow-hidden z-0">

      {/* ====== BACKGROUND ELEMENTS (NEOBRUTALISM) ====== */}
      <div className="absolute inset-0 z-[-2] bg-[radial-gradient(#94a3b8_2px,transparent_2px)] [background-size:32px_32px] opacity-30"></div>

      <div className="absolute top-[30%] -left-[10%] w-[120%] h-16 md:h-20 bg-yellow-400 border-y-4 border-slate-900 transform -rotate-3 z-[-1] shadow-[0_8px_0px_rgba(15,23,42,0.1)] flex items-center overflow-hidden">
        <div className="animate-[marquee_15s_linear_infinite] whitespace-nowrap flex gap-6 text-slate-900 font-black text-xl md:text-3xl tracking-widest uppercase">
          <span>WELCOME TO BASECAMP</span> <Sparkles className="w-6 h-6 md:w-8 md:h-8 inline" />
          <span>WELCOME TO BASECAMP</span> <Sparkles className="w-6 h-6 md:w-8 md:h-8 inline" />
          <span>WELCOME TO BASECAMP</span> <Sparkles className="w-6 h-6 md:w-8 md:h-8 inline" />
          <span>WELCOME TO BASECAMP</span> <Sparkles className="w-6 h-6 md:w-8 md:h-8 inline" />
          <span>WELCOME TO BASECAMP</span> <Sparkles className="w-6 h-6 md:w-8 md:h-8 inline" />
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
        `}} />
      </div>

      <div className="absolute top-[15%] left-[5%] lg:left-[15%] w-24 h-24 bg-pink-400 rounded-full border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] animate-[bounce_4s_infinite] hidden md:block z-[-1]"></div>
      <div className="absolute bottom-[15%] right-[5%] lg:right-[15%] w-28 h-28 bg-emerald-400 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] transform rotate-12 animate-[bounce_5s_infinite_0.5s] hidden md:block z-[-1]"></div>

      {/* ====== KARTU UTAMA ====== */}
      <div className="w-full max-w-[480px] bg-white border-4 border-slate-900 shadow-[10px_10px_0px_#0f172a] md:shadow-[16px_16px_0px_#0f172a] rounded-[2rem] relative z-10 flex flex-col overflow-hidden transition-all">
        
        {/* HEADER KARTU */}
        <div className="bg-violet-400 border-b-4 border-slate-900 p-8 sm:p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] z-0"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-yellow-300 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] flex items-center justify-center transform -rotate-3 hover:rotate-6 transition-transform mb-5">
              <Terminal className="h-8 w-8 text-slate-900" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-slate-900 drop-shadow-sm">
              Basecamp
            </h1>
            <p className="text-sm sm:text-base font-bold text-violet-950 mt-1 bg-white/50 px-4 py-1 rounded-full border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] inline-block">
              Tunjukkan ID Card-mu!
            </p>
          </div>
        </div>

        {/* BODY KARTU */}
        <div className="p-6 sm:p-10 bg-white">
          
          {error && (
            <div className="flex items-start gap-3 bg-red-100 border-2 border-red-900 p-4 rounded-xl text-sm font-bold text-red-900 mb-6 shadow-sm">
              <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {showForgotPassword ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-blue-100 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] p-6 rounded-2xl text-center mb-6 transform rotate-1">
                <div className="w-12 h-12 bg-white border-2 border-slate-900 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <KeyRound className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-black text-xl text-slate-900 uppercase">Lupa Sandi?</h3>
                <p className="text-sm font-bold text-slate-700 mt-2">
                  Tenang, masukkan emailmu di bawah dan kami akan mengirimkan mantra ajaib untuk membuat sandi baru.
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div className="space-y-2 relative">
                  <Label htmlFor="forgot-email" className="font-black text-slate-900 uppercase text-xs ml-1">Email Sekolahmu</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="forgot-email"
                      placeholder="nama@sekolah.sch.id"
                      type="email"
                      required
                      className="h-12 sm:h-14 pl-12 pr-4 border-2 border-slate-900 font-bold focus:shadow-[4px_4px_0px_#0f172a] focus-visible:ring-0 rounded-xl text-base transition-shadow bg-slate-50 focus:bg-white"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError('') }}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowForgotPassword(false)}
                    className="h-14 bg-white hover:bg-slate-100 text-slate-900 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-xl uppercase px-4 w-1/3"
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit"
                    disabled={loading}
                    className="h-14 flex-1 bg-blue-500 hover:bg-blue-400 text-white font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-[0px_0px_0px_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0f172a] rounded-xl uppercase transition-all"
                  >
                    {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "Kirim Link!"}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="flex w-full mb-8 bg-slate-100 p-0 rounded-2xl border-4 border-slate-900 h-14 sm:h-16 shadow-[4px_4px_0px_#0f172a] overflow-hidden">
              <TabsTrigger 
                value="login" 
                onClick={() => setError('')}
                className="flex-1 h-full rounded-none border-r-4 border-slate-900 font-black text-sm sm:text-base uppercase transition-colors data-[state=active]:bg-violet-400 data-[state=active]:text-slate-900 data-[state=active]:shadow-none text-slate-500 data-[state=inactive]:hover:bg-slate-200 outline-none m-0"
              >
                Masuk
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                onClick={() => setError('')}
                className="flex-1 h-full rounded-none font-black text-sm sm:text-base uppercase transition-colors data-[state=active]:bg-emerald-400 data-[state=active]:text-slate-900 data-[state=active]:shadow-none text-slate-500 data-[state=inactive]:hover:bg-slate-200 outline-none m-0"
              >
                Daftar
              </TabsTrigger>
            </TabsList>

            {/* ====== TAB LOGIN ====== */}
            <TabsContent value="login" className="space-y-6 focus:outline-none mt-0">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2 relative">
                  <Label htmlFor="email" className="font-black text-slate-900 uppercase text-xs ml-1">Email Sekolah</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="email"
                      placeholder="nama@sekolah.sch.id"
                      type="email"
                      required
                      autoComplete="email"
                      className="h-12 sm:h-14 pl-12 pr-4 border-2 border-slate-900 font-bold focus:shadow-[4px_4px_0px_#0f172a] focus-visible:ring-0 rounded-xl text-base transition-shadow bg-slate-50 focus:bg-white"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError('') }}
                    />
                  </div>
                </div>
                <div className="space-y-2 relative">
                  <Label htmlFor="password" className="font-black text-slate-900 uppercase text-xs ml-1">Kata Sandi</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="password"
                      type={showLoginPass ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="h-12 sm:h-14 pl-12 pr-12 border-2 border-slate-900 font-bold focus:shadow-[4px_4px_0px_#0f172a] focus-visible:ring-0 rounded-xl text-base transition-shadow bg-slate-50 focus:bg-white tracking-widest placeholder:tracking-normal"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError('') }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPass(!showLoginPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 focus:outline-none transition-colors"
                    >
                      {showLoginPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => { setShowForgotPassword(true); setError('') }}
                      className="text-xs font-bold text-slate-500 hover:text-violet-600 transition-colors uppercase tracking-wider underline decoration-2 underline-offset-4"
                    >
                      Lupa Sandi?
                    </button>
                  </div>
                </div>
                <Button className="w-full h-14 sm:h-16 mt-6 bg-violet-500 hover:bg-violet-400 text-white font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-[0px_0px_0px_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0f172a] rounded-xl text-lg sm:text-xl uppercase transition-all" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "Trobos Masuk!"}
                </Button>
              </form>
            </TabsContent>

            {/* ====== TAB REGISTER ====== */}
            <TabsContent value="register" className="focus:outline-none mt-0">
              {registrationOpen === false ? (
                <div className="bg-orange-100 p-6 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] text-center space-y-3 transform -rotate-1 mt-2">
                  <div className="w-12 h-12 bg-white border-2 border-slate-900 rounded-full flex items-center justify-center mx-auto text-xl shadow-sm">🔒</div>
                  <h3 className="font-black text-xl text-slate-900 uppercase">Pintu Ditutup!</h3>
                  <p className="text-sm font-bold text-slate-700">
                    Pendaftaran sedang ditutup dari pusat komando. Tanyakan ke Admin jika butuh akses.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-4 sm:space-y-5">
                  <div className="space-y-1.5 relative">
                    <Label htmlFor="fullname" className="font-black text-slate-900 uppercase text-xs ml-1">Nama Panggilan</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        id="fullname"
                        placeholder="Contoh: Budi Santoso"
                        required
                        autoComplete="name"
                        className="h-12 sm:h-14 pl-12 pr-4 border-2 border-slate-900 font-bold focus:shadow-[4px_4px_0px_#0f172a] focus-visible:ring-0 rounded-xl text-base transition-shadow bg-slate-50 focus:bg-white"
                        value={fullName}
                        onChange={(e) => { setFullName(e.target.value); setError('') }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 relative">
                    <Label htmlFor="email-reg" className="font-black text-slate-900 uppercase text-xs ml-1">Email Resmi</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        id="email-reg"
                        placeholder="nama@sekolah.sch.id"
                        type="email"
                        required
                        autoComplete="email"
                        className="h-12 sm:h-14 pl-12 pr-4 border-2 border-slate-900 font-bold focus:shadow-[4px_4px_0px_#0f172a] focus-visible:ring-0 rounded-xl text-base transition-shadow bg-slate-50 focus:bg-white"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError('') }}
                      />
                    </div>
                  </div>
                  
                  {/* Kata Sandi Baru */}
                  <div className="space-y-1.5 relative">
                    <Label htmlFor="password-reg" className="font-black text-slate-900 uppercase text-xs ml-1">Sandi Rahasia</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        id="password-reg"
                        type={showRegPass ? "text" : "password"}
                        required
                        minLength={6}
                        autoComplete="new-password"
                        placeholder="Minimal 6 abjad/angka"
                        className="h-12 sm:h-14 pl-12 pr-12 border-2 border-slate-900 font-bold focus:shadow-[4px_4px_0px_#0f172a] focus-visible:ring-0 rounded-xl text-base transition-shadow bg-slate-50 focus:bg-white tracking-widest placeholder:tracking-normal"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError('') }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPass(!showRegPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 focus:outline-none transition-colors"
                      >
                        {showRegPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {/* Password Strength Bar (Health Bar) */}
                    <div className="pt-1">
                      <div className="h-2.5 w-full bg-slate-100 border-2 border-slate-900 rounded-full overflow-hidden flex">
                        <div className={`h-full ${strengthColors[strengthScore]} ${strengthWidths[strengthScore]} transition-all duration-500 ease-out border-r-2 border-slate-900 ${strengthScore === 0 ? 'border-none' : ''}`}></div>
                      </div>
                      <div className="flex justify-end mt-1">
                        <span className={`text-[10px] font-black uppercase tracking-wider ${strengthScore > 0 ? strengthColors[strengthScore].replace('bg-', 'text-') : 'text-slate-400'}`}>
                          {strengthLabels[strengthScore]}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Konfirmasi Kata Sandi */}
                  <div className="space-y-1.5 relative">
                    <Label htmlFor="confirm-password" className="font-black text-slate-900 uppercase text-xs ml-1">Ketik Ulang Sandi</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        id="confirm-password"
                        type={showConfirmPass ? "text" : "password"}
                        required
                        minLength={6}
                        autoComplete="new-password"
                        placeholder="Harus sama persis"
                        className="h-12 sm:h-14 pl-12 pr-12 border-2 border-slate-900 font-bold focus:shadow-[4px_4px_0px_#0f172a] focus-visible:ring-0 rounded-xl text-base transition-shadow bg-slate-50 focus:bg-white tracking-widest placeholder:tracking-normal"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError('') }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 focus:outline-none transition-colors"
                      >
                        {showConfirmPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {/* Live Feedback: Indikator Kecocokan Sandi */}
                    {confirmPassword.length > 0 && (
                      <div className="flex justify-end mt-1">
                        <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider ${password === confirmPassword ? 'text-emerald-600' : 'text-red-500'}`}>
                          {password === confirmPassword ? (
                            <><CheckCircle2 className="h-3 w-3" /> Sandi Cocok!</>
                          ) : (
                            <><XCircle className="h-3 w-3" /> Belum Sama</>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button className="w-full h-14 sm:h-16 mt-8 bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-[0px_0px_0px_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0f172a] rounded-xl text-lg sm:text-xl uppercase transition-all" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "Rakit ID Card!"}
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>
          )}

          {/* OAUTH GOOGLE AREA */}
          <div className="relative mt-8 mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t-2 border-slate-300 border-dashed" />
            </div>
            <div className="relative flex justify-center text-xs uppercase font-black tracking-widest">
              <span className="bg-white px-4 text-slate-400">Atau</span>
            </div>
          </div>

          <Button
            variant="outline"
            type="button"
            disabled={loading}
            onClick={handleGoogleLogin}
            className="w-full h-12 sm:h-14 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-black border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] active:translate-y-[3px] active:translate-x-[3px] active:shadow-[0px_0px_0px_#0f172a] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#0f172a] rounded-xl text-sm sm:text-base transition-all"
          >
            <svg className="mr-3 h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" viewBox="0 0 488 512" xmlns="http://www.w3.org/2000/svg">
              <path fill="#ea4335" d="M124.9 220.6l-67.5-52.2c-15.6 31.2-24.4 66.1-24.4 102.6 0 35.8 8.5 70.1 23.6 100.8l67.8-52.6C118.4 290 115 263.7 115 256c0-12.2 2-24 5.7-35.4H124.9z" />
              <path fill="#4285f4" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c47.5 0 88 16.5 120 44l-67.5 64.9C279.7 99.4 252 89.2 248 89.2 163 89.2 87.5 145 56.6 220.6l-67.5-52.2C46.8 62.4 139 0 248 0c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C314 102 284 89.2 248 89.2c-84.6 0-153.7 70.1-153.7 156.6s69.1 156.6 153.7 156.6c38 0 71.3-13.8 97.4-36.4v-48.4H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
              <path fill="#34a853" d="M248 504c66.8 0 123-24.5 166.3-64.9l-67.5-52.2c-26 22.5-59.3 36.4-97.4 36.4-84.6 0-153.7-70.1-153.7-156.6 0-7.7 1-15 2.7-22.1l-67.8-52.6C15.5 222.8 0 256 0 256c0 137.2 110.8 248 248 248z" />
              <path fill="#fbbc04" d="M120.4 168.4L52.9 116.2C16.8 181.7 0 256 0 256c0 36.5 8.8 71.4 24.4 102.6l67.5-52.2C85.5 291 80 274.2 80 256c0-18.7 5.8-36.1 16-51h24.4z" />
            </svg>
            Lanjut dengan Google
          </Button>
        </div>

        {/* FOOTER KARTU (Link Kembali) */}
        <div className="bg-slate-100 border-t-4 border-slate-900 p-5 text-center">
          <Link href="/" className="inline-flex items-center text-sm font-black text-slate-500 hover:text-violet-600 transition-colors uppercase tracking-wider group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Kabur ke Beranda
          </Link>
        </div>

      </div>
    </div>
  )
}