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
  CalendarDays,
  Medal,
  Award,
  Share2,
  Flame,
  Dice5,
  KeyRound
} from 'lucide-react'
import { toast } from 'sonner'

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  const [stats, setStats] = useState({
    joinedClasses: 0,
    completedAssignments: 0
  })

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [badges, setBadges] = useState<any[]>([])

  useEffect(() => {
    const initData = async () => {
      setLoading(true)

      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        router.push('/login')
        return
      }
      setUser(authUser)

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
        setAvatarUrl(profileData.avatar_url || authUser.user_metadata?.avatar_url || '')

        try {
          const classesPromise = supabase
            .from('class_members')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', authUser.id)

          const assignmentsPromise = supabase
            .from('submissions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', authUser.id)

          const badgesPromise = supabase
            .from('user_badges')
            .select('earned_at, badges(id, name, description, icon)')
            .eq('user_id', authUser.id)
            .order('earned_at', { ascending: false })

          const [classesRes, assignRes, badgesRes] = await Promise.all([classesPromise, assignmentsPromise, badgesPromise])

          setStats({
            joinedClasses: classesRes.count || 0,
            completedAssignments: assignRes.count || 0
          })
          setBadges((badgesRes.data || []).map((b: any) => ({ ...b.badges, earned_at: b.earned_at })))
        } catch (err) {
          console.error("Gagal ambil statistik:", err)
        }
      } else {
        setFullName(authUser.user_metadata?.full_name || '')
      }

      setLoading(false)
    }

    initData()
  }, [])

  const handleGenerateAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7)
    const newAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}&backgroundColor=ffdfbf,c0aede,b6e3f4`
    setAvatarUrl(newAvatar)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveMessage(null)

    if (!user) return

    // Update password if fields are filled
    if (newPassword) {
      if (newPassword !== confirmNewPassword) {
        toast.error('Wah, kata sandi baru dan konfirmasinya tidak cocok!', { position: 'top-center' })
        setSaving(false)
        return
      }
      if (newPassword.length < 6) {
        toast.error('Kata sandi harus minimal 6 karakter ya!', { position: 'top-center' })
        setSaving(false)
        return
      }
      const { error: pwdError } = await supabase.auth.updateUser({ password: newPassword })
      if (pwdError) {
        toast.error('Gagal mengganti sandi: ' + pwdError.message)
        setSaving(false)
        return
      } else {
        toast.success('Pintu brankas baru telah terkunci rapat! (Sandi diganti)')
        setNewPassword('')
        setConfirmNewPassword('')
      }
    }

    const payload = {
      id: user.id,
      full_name: fullName,
      username: username,
      bio: bio,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('profiles')
      .upsert(payload)
      .select()
      .single()

    if (error) {
      setSaveMessage({ text: 'Gagal merakit identitas! ' + error.message, type: 'error' })
      toast.error('Gagal memperbarui profil.')
    } else {
      setSaveMessage({ text: 'Keren! Identitas dan avatarmu sudah diperbarui.', type: 'success' })
      toast.success('Profil sukses diperbarui!', {
        icon: '🚀'
      })
      setTimeout(() => window.location.reload(), 1500)
    }
    setSaving(false)
  }

  const calculateLevel = (xp: number) => Math.floor(xp / 100) + 1
  const calculateProgress = (xp: number) => xp % 100

  // Fungsi share kartu profil
  const handleShareProfile = async () => {
    if (!user) return
    const shareUrl = `${window.location.origin}/share/${user.id}`
    const shareData = {
      title: `Kartu Profil ${fullName || 'Siswa'} di EkskulPAK`,
      text: `Lihat kartu profil belajarku di EkskulPAK! Level ${calculateLevel(profile?.points || 0)}, ${profile?.points || 0} XP.`,
      url: shareUrl,
    }
    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData)
      } else {
        // Fallback: copy link ke clipboard
        await navigator.clipboard.writeText(shareUrl)
        setSaveMessage({ text: 'Link profil berhasil disalin ke clipboard!', type: 'success' })
        setTimeout(() => setSaveMessage(null), 3000)
      }
    } catch {
      // User cancelled or not supported
    }
  }

  if (loading) return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 flex justify-center">
      <Loader2 className="animate-spin text-slate-900 w-12 h-12" />
    </div>
  )

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 min-h-screen font-sans">

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4">
        <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3">
          <div className="bg-orange-400 p-2 rounded-xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] transform -rotate-6">
            <User className="w-8 h-8 text-slate-900" />
          </div>
          Kartu Identitas
        </h1>
        <div className="text-sm font-bold text-slate-500 bg-white border-2 border-slate-900 px-4 py-2 rounded-xl shadow-[4px_4px_0px_#0f172a] flex items-center gap-2 transform rotate-1">
          <CalendarDays className="h-5 w-5 text-violet-600" />
          Eksplorasi Dimulai: {new Date(profile?.created_at || user?.created_at || Date.now()).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* KOLOM KIRI: KARTU IDENTITAS & STATS */}
        <div className="md:col-span-1 space-y-8">

          {/* 1. Identity Card */}
          <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] overflow-hidden relative bg-white transform hover:-translate-y-1 transition-transform">
            <div className="h-28 bg-violet-400 border-b-4 border-slate-900 relative">
              <div className="absolute inset-0 bg-pattern-stripes opacity-20"></div>
            </div>
            <CardContent className="pt-0 relative flex flex-col items-center text-center -mt-14 pb-8">
              <div className="relative group">
                <Avatar className="h-28 w-28 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] bg-white text-slate-900 transition-transform group-hover:scale-105">
                  <AvatarImage src={avatarUrl || profile?.avatar_url || user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="text-4xl font-black bg-yellow-300">
                    {fullName?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={handleGenerateAvatar}
                  className="absolute bottom-0 right-0 bg-orange-400 p-2 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] hover:bg-orange-300 hover:scale-110 active:translate-y-1 active:shadow-none animate-bounce transition-all cursor-pointer"
                  title="Ganti Avatar Robot Acak"
                >
                  <Dice5 className="h-5 w-5 text-slate-900" />
                </button>
              </div>

              <div className="mt-4">
                <h2 className="text-2xl font-black text-slate-900">{fullName || "Pendatang Baru"}</h2>
                <p className="text-slate-500 font-bold text-base mb-3">@{username || "username"}</p>
                {bio && <p className="text-slate-700 text-sm font-medium px-4 leading-relaxed line-clamp-3 bg-slate-50 border-2 border-slate-200 rounded-xl p-3 shadow-sm italic">"{bio}"</p>}
              </div>

              <div className="mt-6 flex flex-col items-center gap-3 w-full px-4">
                <Badge className="bg-emerald-400 text-slate-900 hover:bg-emerald-300 px-4 py-2 uppercase font-black text-sm border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]">
                  <Shield className="w-4 h-4 mr-2" /> {profile?.role || "Siswa Cerdas"}
                </Badge>
                {/* Streak display */}
                {(profile?.streak || 0) > 0 && (
                  <div className="flex items-center gap-2 bg-orange-300 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] px-4 py-2 rounded-xl">
                    <Flame className="h-4 w-4 text-orange-900 fill-orange-900" />
                    <span className="text-sm font-black text-slate-900">{profile.streak} Hari Streak!</span>
                  </div>
                )}
                {/* Tombol Share */}
                <Button
                  onClick={handleShareProfile}
                  variant="outline"
                  className="w-full mt-2 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] font-bold hover:bg-violet-100 hover:border-violet-600 transition-all rounded-xl"
                  title="Salin link gambar profil untuk dibagikan"
                >
                  <Share2 className="h-4 w-4 mr-2" /> Bagikan Kartu Profil
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 2. Gamification Stats */}
          <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] overflow-hidden bg-white">
            <CardHeader className="pb-4 border-b-4 border-slate-900 bg-slate-50">
              <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-500" /> Pencapaian Level
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6 bg-white">
              {/* Level & XP */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-violet-200 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] transform -rotate-1">
                  <div className="text-sm text-slate-800 uppercase font-black mb-1">Level</div>
                  <div className="text-4xl font-black text-slate-900">{calculateLevel(profile?.points || 0)}</div>
                </div>
                <div className="text-center p-4 bg-yellow-300 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] transform rotate-1">
                  <div className="text-sm text-slate-800 uppercase font-black mb-1">Total XP</div>
                  <div className="text-4xl font-black text-slate-900">{profile?.points || 0}</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="bg-slate-50 border-2 border-slate-900 p-4 rounded-2xl shadow-sm">
                <div className="flex justify-between text-sm mb-3 font-bold text-slate-700">
                  <span>Ke Level {calculateLevel(profile?.points || 0) + 1}</span>
                  <span>{calculateProgress(profile?.points || 0)} / 100 XP</span>
                </div>
                <div className="h-4 w-full bg-white rounded-full overflow-hidden border-2 border-slate-900">
                  <div
                    className="h-full bg-violet-500 transition-all duration-500"
                    style={{ width: `${calculateProgress(profile?.points || 0)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Academic & Badge */}
          <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] overflow-hidden bg-white">
            <CardHeader className="pb-4 border-b-4 border-slate-900 bg-slate-50">
              <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Award className="h-6 w-6 text-emerald-500" /> Prestasi
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-3 border-2 border-slate-900 rounded-xl bg-orange-100 shadow-[3px_3px_0px_#0f172a]">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg border-2 border-slate-900"><BookOpen className="h-5 w-5 text-slate-900" /></div>
                    <span className="font-bold text-slate-800">Kelas Diikuti</span>
                  </div>
                  <span className="font-black text-2xl text-slate-900">{stats.joinedClasses}</span>
                </div>
                <div className="flex items-center justify-between p-3 border-2 border-slate-900 rounded-xl bg-blue-100 shadow-[3px_3px_0px_#0f172a]">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg border-2 border-slate-900"><CheckCircle className="h-5 w-5 text-slate-900" /></div>
                    <span className="font-bold text-slate-800">Tugas Tuntas</span>
                  </div>
                  <span className="font-black text-2xl text-slate-900">{stats.completedAssignments}</span>
                </div>
              </div>

              {/* Badges Section */}
              <div className="pt-6 border-t-2 border-slate-100">
                <h4 className="font-black text-sm text-slate-500 uppercase mb-4 pl-1">Penghargaan Diterima:</h4>
                {badges.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 border-2 border-slate-200 border-dashed rounded-xl">
                    <Medal className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-500">Koleksimu masih kosong.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {badges.map((badge: any) => (
                      <div
                        key={badge.id}
                        title={`${badge.name}: ${badge.description}`}
                        className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] hover:bg-yellow-50 hover:shadow-none hover:translate-y-1 transition-all cursor-crosshair group"
                      >
                        <span className="text-3xl filter drop-shadow-sm">{badge.icon}</span>
                        <span className="text-[10px] font-black text-slate-800 tracking-tight text-center leading-tight line-clamp-2 uppercase">
                          {badge.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KOLOM KANAN: FORM EDIT */}
        <div className="md:col-span-2">
          <Card className="h-full border-4 border-slate-900 shadow-[10px_10px_0px_#0f172a] rounded-[40px] overflow-hidden bg-white">
            <CardHeader className="bg-slate-50 border-b-4 border-slate-900 p-8 pb-6">
              <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <Save className="h-6 w-6 text-blue-600" /> Setting Karakter
              </CardTitle>
              <CardDescription className="text-base font-bold text-slate-500 mt-2">
                Perbarui persona kamu agar lebih dikenali sesama anggota ekskul.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSaveProfile} className="space-y-8">

                {saveMessage && (
                  <div className={`flex items-center gap-3 p-4 rounded-2xl border-4 font-black text-lg ${saveMessage.type === 'success'
                    ? 'bg-emerald-300 text-slate-900 border-slate-900 shadow-[4px_4px_0px_#0f172a]'
                    : 'bg-red-300 text-slate-900 border-slate-900 shadow-[4px_4px_0px_#0f172a]'
                    }`}>
                    {saveMessage.type === 'success'
                      ? <CheckCircle className="h-6 w-6 shrink-0" />
                      : <Shield className="h-6 w-6 shrink-0" />}
                    {saveMessage.text}
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-sm font-black text-slate-800 uppercase">Nama Lengkap</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                      <Input
                        placeholder="Ketik namamu..."
                        className="pl-12 h-14 bg-white border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-2xl font-bold text-lg text-slate-900 focus-visible:ring-0 focus:shadow-none focus:translate-y-1 transition-all"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-black text-slate-800 uppercase">Username (Kode Unik)</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-4 text-slate-400 font-bold text-lg">@</span>
                      <Input
                        placeholder="hacker_muda"
                        className="pl-10 h-14 bg-white border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-2xl font-bold text-lg text-slate-900 focus-visible:ring-0 focus:shadow-none focus:translate-y-1 transition-all"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-black text-slate-800 uppercase">Quotes / Bio</Label>
                  <textarea
                    className="flex min-h-[120px] w-full rounded-3xl border-4 border-slate-900 bg-white p-5 text-lg font-bold shadow-[4px_4px_0px_#0f172a] placeholder:text-slate-400 focus-visible:outline-none focus:shadow-none focus:translate-y-1 transition-all resize-none"
                    placeholder="Satu baris kode hari ini, satu karya nyata esok hari..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                  <p className="text-sm font-bold text-slate-500 text-right">{bio.length}/150 Huruf</p>
                </div>

                <div className="pt-4 border-t-2 border-slate-100 border-dashed">
                  <h4 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-4">
                    <KeyRound className="h-5 w-5 text-red-500" /> Ganti Kata Sandi
                  </h4>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-sm font-black text-slate-800 uppercase">Sandi Baru</Label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="h-14 bg-slate-50 border-4 border-slate-900 shadow-sm rounded-2xl font-bold text-lg text-slate-900 focus-visible:ring-0 focus:bg-white focus:translate-y-1 transition-all tracking-widest placeholder:tracking-normal"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <p className="text-xs font-bold text-slate-400">Kosongkan jika tidak ingin merubah sandi.</p>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-black text-slate-800 uppercase">Ketik Ulang Sandi Baru</Label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="h-14 bg-slate-50 border-4 border-slate-900 shadow-sm rounded-2xl font-bold text-lg text-slate-900 focus-visible:ring-0 focus:bg-white focus:translate-y-1 transition-all tracking-widest placeholder:tracking-normal"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-8 flex justify-end">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-black text-lg h-14 px-8 rounded-2xl border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] hover:translate-y-1 hover:shadow-[2px_2px_0px_#0f172a] transition-all" disabled={saving}>
                    {saving ? <Loader2 className="animate-spin mr-3 h-6 w-6" /> : <Save className="mr-3 h-6 w-6" />}
                    Simpan Perubahan
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