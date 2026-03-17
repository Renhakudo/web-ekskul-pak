'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Terminal, AlertCircle } from "lucide-react"

export default function AuthPage() {
  const [loading, setLoading] = useState(false)
  const [registrationOpen, setRegistrationOpen] = useState<boolean | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Form State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')

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
      setError('Email atau password salah. Silakan coba lagi.')
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
      setError('Pendaftaran akun sedang ditutup oleh Admin. Silakan hubungi Admin.')
      return
    }

    setLoading(true)
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          // FIXED Bug #6: gunakan 'siswa' (bukan 'student') agar sesuai dengan sistem RBAC
          role: 'siswa',
        }
      }
    })

    if (signUpError) {
      setError('Gagal mendaftar: ' + signUpError.message)
    } else {
      setError('')
      alert('Pendaftaran Berhasil! ✅ Silakan cek email untuk verifikasi, lalu login.')
    }
    setLoading(false)
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
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#FDFBF7] font-sans">

      {/* BAGIAN KIRI: ARTISTIC SIDE (NEO-BRUTALISM) */}
      <div className="relative hidden h-full flex-col lg:flex border-r-4 border-slate-900 bg-violet-400 p-12 overflow-hidden justify-between">
        <div className="absolute inset-0 pattern-grid-lg text-slate-900/10" />

        {/* Decorative elements */}
        <div className="absolute top-20 right-10 w-32 h-32 bg-yellow-300 border-4 border-slate-900 rounded-full shadow-[6px_6px_0px_#0f172a] transform rotate-12" />
        <div className="absolute bottom-32 left-10 w-40 h-40 bg-emerald-300 border-4 border-slate-900 rounded-[32px] shadow-[6px_6px_0px_#0f172a] transform -rotate-12" />

        <div className="relative z-20 flex items-center text-3xl font-black gap-3 text-slate-900 bg-white inline-flex w-max px-6 py-3 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-2xl transform -rotate-2">
          <Terminal className="h-8 w-8 text-violet-600" />
          <span className="tracking-tight uppercase">EkskulDev</span>
        </div>

        <div className="relative z-20 mt-auto bg-white p-8 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] transform rotate-1">
          <div className="mb-6 space-y-4">
            <div className="flex items-center gap-4 text-slate-900 font-bold">
              <div className="w-10 h-10 rounded-xl border-4 border-slate-900 bg-emerald-300 shadow-[2px_2px_0px_#0f172a] flex items-center justify-center">
                <span className="text-slate-900 font-black">✓</span>
              </div>
              <span className="text-lg">Belajar interaktif dengan sistem XP & Level</span>
            </div>
            <div className="flex items-center gap-4 text-slate-900 font-bold">
              <div className="w-10 h-10 rounded-xl border-4 border-slate-900 bg-yellow-300 shadow-[2px_2px_0px_#0f172a] flex items-center justify-center">
                <span className="text-slate-900 font-black">✓</span>
              </div>
              <span className="text-lg">Forum diskusi per kelas secara real-time</span>
            </div>
            <div className="flex items-center gap-4 text-slate-900 font-bold">
              <div className="w-10 h-10 rounded-xl border-4 border-slate-900 bg-pink-300 shadow-[2px_2px_0px_#0f172a] flex items-center justify-center">
                <span className="text-slate-900 font-black">✓</span>
              </div>
              <span className="text-lg">Leaderboard & kompetisi antar siswa</span>
            </div>
          </div>
          <div className="bg-slate-100 p-6 rounded-2xl border-4 border-slate-900 border-dashed relative">
            <p className="text-lg font-bold text-slate-900 italic">
              "Platform ini ngebantu banget! Belajar *coding* nggak pusing lagi karena serasa main *game*!"
            </p>
            <footer className="text-base font-black text-violet-600 mt-2 uppercase tracking-wide">— Dimas, Siswa Kelas 12</footer>
          </div>
        </div>
      </div>

      {/* BAGIAN KANAN: FORM SIDE */}
      <div className="flex items-center justify-center p-6 md:p-12 relative overflow-hidden bg-[#FDFBF7]">
        {/* Floating background shapes for mobile */}
        <div className="absolute top-10 right-10 w-24 h-24 bg-pink-300 border-4 border-slate-900 rounded-full shadow-[4px_4px_0px_#0f172a] lg:hidden -z-10" />
        <div className="absolute bottom-10 left-10 w-32 h-32 bg-violet-300 border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_#0f172a] lg:hidden -z-10 transform -rotate-12" />

        <div className="w-full max-w-[440px] bg-white p-8 md:p-10 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] relative z-10">

          <div className="flex flex-col space-y-2 text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="bg-yellow-300 p-3 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] transform -rotate-3">
                <Terminal className="h-8 w-8 text-slate-900" />
              </div>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Gerbang Logika</h1>
            <p className="text-base font-bold text-slate-500">
              Silakan bawa ID Card Anda untuk masuk.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-3 bg-red-100 border-4 border-red-900 shadow-[4px_4px_0px_#7f1d1d] p-4 rounded-xl text-sm font-bold text-red-900 mb-6 transform rotate-1">
              <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-red-900" />
              <span>{error}</span>
            </div>
          )}

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100 p-2 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a]">
              <TabsTrigger value="login" className="font-black text-base uppercase data-[state=active]:bg-violet-400 data-[state=active]:text-slate-900 data-[state=active]:border-2 data-[state=active]:border-slate-900 data-[state=active]:shadow-[2px_2px_0px_#0f172a] rounded-xl transition-all h-10">Masuk</TabsTrigger>
              <TabsTrigger value="register" className="font-black text-base uppercase data-[state=active]:bg-emerald-400 data-[state=active]:text-slate-900 data-[state=active]:border-2 data-[state=active]:border-slate-900 data-[state=active]:shadow-[2px_2px_0px_#0f172a] rounded-xl transition-all h-10">Daftar</TabsTrigger>
            </TabsList>

            {/* TAB LOGIN */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-black text-slate-900 uppercase">Email Terdaftar</Label>
                  <Input
                    id="email"
                    placeholder="nama@sekolah.sch.id"
                    type="email"
                    required
                    autoComplete="email"
                    className="h-12 border-4 border-slate-900 font-bold focus:shadow-[4px_4px_0px_#0f172a] focus-visible:ring-0 rounded-xl text-lg"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="font-black text-slate-900 uppercase">Kata Sandi Rahasia</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="h-12 border-4 border-slate-900 font-bold focus:shadow-[4px_4px_0px_#0f172a] focus-visible:ring-0 rounded-xl text-lg"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError('') }}
                  />
                </div>
                <Button className="w-full h-14 bg-violet-500 hover:bg-violet-400 text-slate-900 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:translate-y-1 hover:shadow-[2px_2px_0px_#0f172a] rounded-xl text-lg uppercase transition-all mt-2" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "Trobos Masuk!"}
                </Button>
              </form>
            </TabsContent>

            {/* TAB REGISTER */}
            <TabsContent value="register">
              {registrationOpen === false ? (
                <div className="bg-orange-100 p-8 rounded-[24px] border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] text-center space-y-4 transform -rotate-1 mt-4">
                  <div className="w-16 h-16 bg-white border-4 border-slate-900 shadow-sm rounded-full flex items-center justify-center mx-auto text-3xl">🔒</div>
                  <h3 className="font-black text-2xl text-slate-900 uppercase">Pintu Ditutup!</h3>
                  <p className="text-base font-bold text-slate-700">
                    Sistem pendaftaran ditutup dari pusat komando. Tanyakan ke Admin jika kamu merasa ini kekeliruan.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="fullname" className="font-black text-slate-900 uppercase">Nama Lengkap</Label>
                    <Input
                      id="fullname"
                      placeholder="Contoh: Budi Santoso"
                      required
                      autoComplete="name"
                      className="h-12 border-4 border-slate-900 font-bold focus:shadow-[4px_4px_0px_#0f172a] focus-visible:ring-0 rounded-xl text-lg"
                      value={fullName}
                      onChange={(e) => { setFullName(e.target.value); setError('') }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-reg" className="font-black text-slate-900 uppercase">Email Resmi</Label>
                    <Input
                      id="email-reg"
                      placeholder="nama@sekolah.sch.id"
                      type="email"
                      required
                      autoComplete="email"
                      className="h-12 border-4 border-slate-900 font-bold focus:shadow-[4px_4px_0px_#0f172a] focus-visible:ring-0 rounded-xl text-lg"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError('') }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-reg" className="font-black text-slate-900 uppercase">Kata Sandi Kuat</Label>
                    <Input
                      id="password-reg"
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      placeholder="Minimal 6 abjad rahasia"
                      className="h-12 border-4 border-slate-900 font-bold focus:shadow-[4px_4px_0px_#0f172a] focus-visible:ring-0 rounded-xl text-lg"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError('') }}
                    />
                  </div>
                  <Button className="w-full h-14 bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:translate-y-1 hover:shadow-[2px_2px_0px_#0f172a] rounded-xl text-lg uppercase transition-all mt-2" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "Rakit ID Card!"}
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>

          {/* GOOGLE AUTH BUTTON */}
          <div className="relative mt-8 mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t-4 border-slate-900 border-dashed" />
            </div>
            <div className="relative flex justify-center text-xs uppercase font-black tracking-widest">
              <span className="bg-white px-4 text-slate-500 rounded-full border-4 border-slate-900 border-dashed">Alternatif</span>
            </div>
          </div>

          <Button
            variant="outline"
            type="button"
            disabled={loading}
            onClick={handleGoogleLogin}
            className="w-full h-14 bg-white hover:bg-yellow-200 text-slate-900 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:translate-y-1 hover:shadow-[2px_2px_0px_#0f172a] rounded-xl text-base uppercase transition-all"
          >
            <svg className="mr-3 h-6 w-6" aria-hidden="true" viewBox="0 0 488 512" xmlns="http://www.w3.org/2000/svg">
              <path fill="#ea4335" d="M124.9 220.6l-67.5-52.2c-15.6 31.2-24.4 66.1-24.4 102.6 0 35.8 8.5 70.1 23.6 100.8l67.8-52.6C118.4 290 115 263.7 115 256c0-12.2 2-24 5.7-35.4H124.9z" />
              <path fill="#4285f4" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c47.5 0 88 16.5 120 44l-67.5 64.9C279.7 99.4 252 89.2 248 89.2 163 89.2 87.5 145 56.6 220.6l-67.5-52.2C46.8 62.4 139 0 248 0c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C314 102 284 89.2 248 89.2c-84.6 0-153.7 70.1-153.7 156.6s69.1 156.6 153.7 156.6c38 0 71.3-13.8 97.4-36.4v-48.4H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
              <path fill="#34a853" d="M248 504c66.8 0 123-24.5 166.3-64.9l-67.5-52.2c-26 22.5-59.3 36.4-97.4 36.4-84.6 0-153.7-70.1-153.7-156.6 0-7.7 1-15 2.7-22.1l-67.8-52.6C15.5 222.8 0 256 0 256c0 137.2 110.8 248 248 248z" />
              <path fill="#fbbc04" d="M120.4 168.4L52.9 116.2C16.8 181.7 0 256 0 256c0 36.5 8.8 71.4 24.4 102.6l67.5-52.2C85.5 291 80 274.2 80 256c0-18.7 5.8-36.1 16-51h24.4z" />
            </svg>
            Jalur Cepat Google
          </Button>

          <p className="mt-8 text-center text-sm font-black text-slate-500 uppercase">
            <Link href="/" className="hover:text-violet-600 outline-none transition-colors border-b-2 border-transparent hover:border-violet-600 inline-block">
              ← Kembali ke Zona Aman
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}