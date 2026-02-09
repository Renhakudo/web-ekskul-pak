'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Loader2, 
  User, 
  Save, 
  Shield, 
  Trophy, 
  BookOpen, 
  CheckCircle,
  CalendarDays
} from 'lucide-react'

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null) // Simpan data user auth
  const [profile, setProfile] = useState<any>(null)
  
  // Stats State
  const [stats, setStats] = useState({
    joinedClasses: 0,
    completedAssignments: 0
  })

  // Form State
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')

  useEffect(() => {
    const initData = async () => {
      setLoading(true)
      
      // 1. Cek User Auth
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/login')
        return
      }
      setUser(authUser)

      // 2. Ambil Profile Database
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()
      
      if (profileData) {
        setProfile(profileData)
        setFullName(profileData.full_name || '')
        setUsername(profileData.username || '')
        setBio(profileData.bio || '')

        // 3. Ambil Statistik (Hanya jika profil ada)
        try {
          const classesPromise = supabase
            .from('class_members')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', authUser.id)

          const assignmentsPromise = supabase
            .from('submissions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', authUser.id)

          const [classesRes, assignRes] = await Promise.all([classesPromise, assignmentsPromise])
          
          setStats({
            joinedClasses: classesRes.count || 0,
            completedAssignments: assignRes.count || 0
          })
        } catch (err) {
          console.error("Gagal ambil statistik:", err)
        }
      } else {
        // Jika profil belum ada (User Baru), isi default dari metadata Google/Email jika ada
        setFullName(authUser.user_metadata?.full_name || '')
      }
      
      setLoading(false)
    }

    initData()
  }, [])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    if (!user) return

    const payload = {
        id: user.id, // Pastikan ID selalu terisi dari Auth User
        full_name: fullName,
        username: username,
        bio: bio, 
        updated_at: new Date().toISOString(),
    }

    // LOGIKA UPSERT: Insert jika belum ada, Update jika sudah ada
    const { error } = await supabase
      .from('profiles')
      .upsert(payload) // upsert akan menangani insert/update otomatis berdasarkan ID
      .select()
      .single()

    if (error) {
      alert('Gagal simpan profil: ' + error.message)
    } else {
      alert('Profil berhasil diperbarui! 🎉')
      // Reload halaman untuk refresh data
      window.location.reload()
    }
    setSaving(false)
  }

  // Hitung Level (Rumus: 100 XP = 1 Level)
  const calculateLevel = (xp: number) => Math.floor(xp / 100) + 1
  const calculateProgress = (xp: number) => xp % 100

  if (loading) return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
       <div className="flex gap-4">
         <Skeleton className="h-32 w-32 rounded-full" />
         <div className="space-y-2">
           <Skeleton className="h-8 w-64" />
           <Skeleton className="h-4 w-32" />
         </div>
       </div>
    </div>
  )

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 min-h-screen bg-slate-50/50">
      
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Profil Saya</h1>
        <div className="text-xs text-slate-400 flex items-center gap-1">
          <CalendarDays className="h-3 w-3" />
          {/* Gunakan Optional Chaining (?.) untuk mencegah error null */}
          Bergabung sejak: {new Date(profile?.created_at || user?.created_at || Date.now()).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* KOLOM KIRI: KARTU IDENTITAS & STATS */}
        <div className="md:col-span-1 space-y-6">
          
          {/* 1. Identity Card */}
          <Card className="border-violet-200 shadow-lg overflow-hidden relative">
            <div className="h-24 bg-gradient-to-r from-violet-600 to-indigo-600"></div>
            <CardContent className="pt-0 relative flex flex-col items-center text-center -mt-12">
              <Avatar className="h-24 w-24 border-4 border-white shadow-sm bg-white">
                <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
                <AvatarFallback className="text-2xl font-bold bg-slate-100 text-slate-400">
                  {fullName?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="mt-3">
                <h2 className="text-xl font-bold text-slate-900">{fullName || "User Baru"}</h2>
                <p className="text-slate-500 text-sm mb-2">@{username || "username"}</p>
                {bio && <p className="text-slate-600 text-xs italic px-4 line-clamp-2">"{bio}"</p>}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Badge className="bg-slate-900 text-white hover:bg-slate-800 px-3 py-1 uppercase tracking-wider text-[10px]">
                  <Shield className="w-3 h-3 mr-1" /> {profile?.role || "Siswa"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* 2. Gamification Stats */}
          <Card>
            <CardHeader className="pb-2 border-b border-slate-50">
              <CardTitle className="text-sm uppercase tracking-wide text-slate-500 font-bold flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" /> Statistik Level
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Level & XP */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="text-center p-3 bg-violet-50 rounded-xl border border-violet-100">
                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Level</div>
                    <div className="text-2xl font-extrabold text-violet-700">{calculateLevel(profile?.points || 0)}</div>
                 </div>
                 <div className="text-center p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Total XP</div>
                    <div className="text-2xl font-extrabold text-yellow-700">{profile?.points || 0}</div>
                 </div>
              </div>
              
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-xs mb-2 font-medium text-slate-600">
                   <span>Menuju Level {calculateLevel(profile?.points || 0) + 1}</span>
                   <span>{calculateProgress(profile?.points || 0)} / 100 XP</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                   <div 
                     className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                     style={{ width: `${calculateProgress(profile?.points || 0)}%` }}
                   />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Academic Stats */}
          <Card>
             <CardHeader className="pb-2 border-b border-slate-50">
              <CardTitle className="text-sm uppercase tracking-wide text-slate-500 font-bold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-500" /> Akademik
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
               <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                     <div className="bg-blue-100 p-2 rounded-md text-blue-600"><BookOpen className="h-4 w-4"/></div>
                     <span className="text-sm font-medium text-slate-700">Kelas Diikuti</span>
                  </div>
                  <span className="font-bold text-slate-900">{stats.joinedClasses}</span>
               </div>
               <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                     <div className="bg-green-100 p-2 rounded-md text-green-600"><CheckCircle className="h-4 w-4"/></div>
                     <span className="text-sm font-medium text-slate-700">Tugas Selesai</span>
                  </div>
                  <span className="font-bold text-slate-900">{stats.completedAssignments}</span>
               </div>
            </CardContent>
          </Card>
        </div>

        {/* KOLOM KANAN: FORM EDIT */}
        <div className="md:col-span-2">
          <Card className="h-full border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Edit Informasi</CardTitle>
              <CardDescription>Perbarui data diri kamu agar terlihat keren di Leaderboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Nama Lengkap</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input 
                        placeholder="Nama Lengkap Kamu" 
                        className="pl-9"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Username (Unik)</Label>
                    <Input 
                      placeholder="username_keren" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Bio Singkat</Label>
                  <textarea 
                    className="flex min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Ceritakan sedikit tentang hobimu, cita-citamu, atau kata-kata motivasi..." 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                  <p className="text-xs text-slate-500 text-right">{bio.length}/150 Karakter</p>
                </div>

                <div className="pt-6 border-t flex justify-end">
                  <Button type="submit" className="bg-violet-600 hover:bg-violet-700 min-w-[150px]" disabled={saving}>
                    {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                    Simpan Profil
                  </Button>
                </div>

              </form>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}