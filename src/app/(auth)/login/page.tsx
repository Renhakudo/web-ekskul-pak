'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Terminal } from "lucide-react"

export default function AuthPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // State Form
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('') // Khusus Register

  // --- LOGIC LOGIN ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert("Gagal Masuk: " + error.message)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  // --- LOGIC REGISTER ---
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // 1. Daftar ke Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: "student" // Default role
        }
      }
    })

    if (error) {
      alert("Gagal Daftar: " + error.message)
    } else {
      // 2. Karena trigger database kita sudah otomatis, kita tinggal kasih notif
      alert('Pendaftaran Berhasil! Silakan cek email untuk verifikasi.')
    }
    setLoading(false)
  }

  // --- LOGIC GOOGLE ---
  const handleGoogleLogin = async () => {
    setLoading(true)
    // Gunakan window.location.origin hanya jika di browser
    const origin = (typeof window !== 'undefined' && window.location.origin) 
      ? window.location.origin 
      : ''
      
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    })
    
    if (error) {
      alert(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0 bg-slate-50">
      
      {/* BAGIAN KIRI: ARTISTIC SIDE (Hanya muncul di Laptop/Desktop) */}
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-slate-900" />
        <div className="absolute inset-0 bg-gradient-to-t from-violet-900/50 to-slate-900/10" />
        
        <div className="relative z-20 flex items-center text-lg font-medium gap-2">
          <Terminal className="h-6 w-6 text-violet-400" />
          EkskulDev LMS
        </div>
        
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Platform ini membantu saya memahami React lebih cepat daripada belajar sendiri. Fitur leaderboard-nya bikin semangat ngerjain tugas!&rdquo;
            </p>
            <footer className="text-sm text-slate-400">Dimas, Siswa Kelas 12 (Alumni)</footer>
          </blockquote>
        </div>
      </div>

      {/* BAGIAN KANAN: FORM SIDE */}
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] p-8 lg:p-0">
          
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Selamat Datang</h1>
            <p className="text-sm text-muted-foreground">
              Masuk atau buat akun baru untuk mulai belajar.
            </p>
          </div>

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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button className="w-full bg-violet-600 hover:bg-violet-700" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Masuk Sekarang
                </Button>
              </form>
            </TabsContent>

            {/* TAB REGISTER */}
            <TabsContent value="register">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullname">Nama Lengkap</Label>
                  <Input 
                    id="fullname" 
                    placeholder="Contoh: Budi Santoso" 
                    required 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-reg">Email</Label>
                  <Input 
                    id="email-reg" 
                    placeholder="nama@sekolah.sch.id" 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-reg">Password</Label>
                  <Input 
                    id="password-reg" 
                    type="password" 
                    required 
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button className="w-full bg-violet-600 hover:bg-violet-700" disabled={loading}>
                   {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Buat Akun Baru
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* GOOGLE AUTH BUTTON */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-50 px-2 text-muted-foreground">
                Atau lanjutkan dengan
              </span>
            </div>
          </div>
          
          <Button variant="outline" type="button" disabled={loading} onClick={handleGoogleLogin} className="w-full">
            {/* Ikon Google SVG */}
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
            </svg>
            Google
          </Button>

          <p className="px-8 text-center text-sm text-muted-foreground">
            <Link href="/" className="hover:text-violet-600 underline underline-offset-4">
              Kembali ke Halaman Depan
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}