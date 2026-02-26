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
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0 bg-slate-50">

      {/* BAGIAN KIRI: ARTISTIC SIDE */}
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-slate-900" />
        <div className="absolute inset-0 bg-gradient-to-t from-violet-900/50 to-slate-900/10" />
        {/* Decorative circles */}
        <div className="absolute top-20 right-10 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-48 h-48 bg-emerald-600/10 rounded-full blur-3xl" />

        <div className="relative z-20 flex items-center text-lg font-medium gap-2">
          <Terminal className="h-6 w-6 text-violet-400" />
          <span className="font-bold tracking-tight">EkskulDev LMS</span>
        </div>

        <div className="relative z-20 mt-auto">
          <div className="mb-6 space-y-2">
            <div className="flex items-center gap-3 text-slate-300">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <span className="text-emerald-400 text-sm">✓</span>
              </div>
              <span className="text-sm">Belajar interaktif dengan sistem XP & Level</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                <span className="text-violet-400 text-sm">✓</span>
              </div>
              <span className="text-sm">Forum diskusi per kelas secara real-time</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="text-blue-400 text-sm">✓</span>
              </div>
              <span className="text-sm">Leaderboard & kompetisi antar siswa</span>
            </div>
          </div>
          <blockquote className="space-y-2 border-l-2 border-violet-500 pl-4">
            <p className="text-base text-slate-300">
              &ldquo;Platform ini membantu saya memahami materi lebih cepat. Fitur leaderboard-nya bikin semangat!&rdquo;
            </p>
            <footer className="text-sm text-slate-400">Dimas, Siswa Kelas 12</footer>
          </blockquote>
        </div>
      </div>

      {/* BAGIAN KANAN: FORM SIDE */}
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[380px] p-8 lg:p-0">

          <div className="flex flex-col space-y-2 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Terminal className="h-7 w-7 text-violet-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Selamat Datang</h1>
            <p className="text-sm text-slate-500">
              Masuk atau buat akun untuk mulai belajar bersama.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Masuk</TabsTrigger>
              <TabsTrigger value="register">Daftar</TabsTrigger>
            </TabsList>

            {/* TAB LOGIN */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    placeholder="nama@sekolah.sch.id"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError('') }}
                  />
                </div>
                <Button className="w-full bg-violet-600 hover:bg-violet-700 font-semibold" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Masuk Sekarang
                </Button>
              </form>
            </TabsContent>

            {/* TAB REGISTER */}
            <TabsContent value="register">
              {registrationOpen === false ? (
                <div className="rounded-xl border border-orange-200 bg-orange-50 p-6 text-center space-y-2">
                  <div className="text-2xl">🔒</div>
                  <h3 className="font-semibold text-slate-900">Pendaftaran Ditutup</h3>
                  <p className="text-sm text-slate-600">
                    Pendaftaran akun baru sedang ditutup oleh Admin. Silakan hubungi Guru/Admin untuk informasi lebih lanjut.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullname">Nama Lengkap</Label>
                    <Input
                      id="fullname"
                      placeholder="Contoh: Budi Santoso"
                      required
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => { setFullName(e.target.value); setError('') }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-reg">Email</Label>
                    <Input
                      id="email-reg"
                      placeholder="nama@sekolah.sch.id"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError('') }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-reg">Password</Label>
                    <Input
                      id="password-reg"
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      placeholder="Minimal 6 karakter"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError('') }}
                    />
                  </div>
                  <Button className="w-full bg-violet-600 hover:bg-violet-700 font-semibold" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Buat Akun Baru
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>

          {/* GOOGLE AUTH BUTTON */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-50 px-2 text-slate-400">Atau lanjutkan dengan</span>
            </div>
          </div>

          <Button
            variant="outline"
            type="button"
            disabled={loading}
            onClick={handleGoogleLogin}
            className="w-full border-slate-200 hover:bg-slate-50"
          >
            <svg className="mr-2 h-4 w-4" aria-hidden="true" viewBox="0 0 488 512" xmlns="http://www.w3.org/2000/svg">
              <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
            </svg>
            Masuk dengan Google
          </Button>

          <p className="px-8 text-center text-sm text-slate-500">
            <Link href="/" className="hover:text-violet-600 underline underline-offset-4 transition-colors">
              ← Kembali ke Halaman Depan
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}