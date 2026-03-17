import { Metadata, ResolvingMetadata } from 'next'
import { createClient } from '@/lib/supabase/client' // for client logic if needed, but this is a server module if we want metadata
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Flame, BookOpen, CheckCircle, ArrowLeft, Shield } from 'lucide-react'
import ShareableCard from '@/components/ShareableCard'

// Fungsi generateMetadata untuk menghasilkan Open Graph tags yang dibaca bot Sosmed
export async function generateMetadata(
  props: { params: Promise<{ userId: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const params = await props.params;
  const { userId } = params;

  // Ideally, you'd fetch basic title info here, but we'll use a standard format
  const title = `Kartu Profil Siswa | EkskulPAK`;
  const description = `Lihat pencapaian, level, XP, dan badge terbaru saya di EkskulPAK!`;

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      // Mengarahkan og:image ke API route generator OG image yang kita buat
      images: [`/api/share/${userId}`],
      url: `/share/${userId}`,
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [`/api/share/${userId}`],
    },
  }
}

// Komponen Server Component untuk halaman Share (Publik)
export default async function PublicProfileSharePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  
  // Menggunakan fungsi fetch standar Next.js untuk mendapatkan public profile (jika RLS diatur public)
  // Untuk public page yang lebih reliable tanpa auth, pastikan 'profiles' RLS mengizinkan select dari anon!
  // Atur environment variables Supabase URL & ANON KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  // URL Encode query
  const res = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    },
    next: { revalidate: 60 } // Cache per menit
  })
  
  const profiles = await res.json()
  const profile = profiles[0]

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4 text-center">
        <div className="bg-red-200 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] p-8 rounded-[32px] max-w-md w-full">
          <h1 className="text-3xl font-black text-slate-900 mb-4">WADUH! 🚧</h1>
          <p className="font-bold text-slate-700 text-lg">Profil siswa ini tidak dapat ditemukan (mungkin dihapus atau URL salah).</p>
          <Link href="/">
            <Button className="mt-8 bg-slate-900 text-white font-black border-4 border-slate-900 hover:bg-slate-800 rounded-xl px-8 h-12 shadow-[4px_4px_0px_#cbd5e1]">
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Fetch stats public (butuh RLS public select)
  const classesRes = await fetch(`${supabaseUrl}/rest/v1/class_members?user_id=eq.${userId}&select=id`, { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Prefer': 'count=exact' } })
  const joinedClassesCount = parseInt(classesRes.headers.get('content-range')?.split('/')[1] || '0')

  const submissionRes = await fetch(`${supabaseUrl}/rest/v1/submissions?user_id=eq.${userId}&select=id`, { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Prefer': 'count=exact' } })
  const submissionCount = parseInt(submissionRes.headers.get('content-range')?.split('/')[1] || '0')

  const badgesRes = await fetch(`${supabaseUrl}/rest/v1/user_badges?user_id=eq.${userId}&select=*,badges(id,name,icon,description)&order=earned_at.desc`, { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } })
  const badgesData = await badgesRes.json()
  const recentBadges = badgesData.map((b: any) => b.badges)

  const { full_name, username, role, points, avatar_url, bio, streak } = profile
  const level = Math.floor((points || 0) / 100) + 1
  const progressPercent = (points || 0) % 100

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-4 md:p-12 font-sans flex items-center justify-center relative overflow-hidden">
      
      {/* Dekorasi Background */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-violet-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute top-10 right-10 w-64 h-64 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-64 h-64 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>

      <div className="max-w-4xl w-full z-10 space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
        
        {/* Tombol ke Beranda */}
        <div className="flex justify-between items-center mb-4">
          <Link href="/">
            <Button variant="outline" className="bg-white border-4 border-slate-900 font-black shadow-[4px_4px_0px_#0f172a] hover:bg-violet-100 hover:-translate-y-1 transition-transform rounded-2xl h-12">
              <ArrowLeft className="w-5 h-5 mr-2" /> Kenali EkskulPAK
            </Button>
          </Link>
        </div>

        {/* CONTAINER KARTU UTAMA DIBUNGKUS SHAREABLE CARD */}
        <ShareableCard username={username || full_name || 'siswa'}>
          <Card className="border-8 border-slate-900 shadow-[16px_16px_0px_#0f172a] rounded-[48px] overflow-hidden relative bg-white transform md:-rotate-1 hover:rotate-0 transition-transform duration-500 w-full">
          
          <div className="absolute inset-0 bg-grid-slate-100 bg-[size:20px_20px] pointer-events-none opacity-50" />

          {/* Aksentuasi Header */}
          <div className="h-40 bg-violet-400 border-b-8 border-slate-900 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/20 to-transparent"></div>
          </div>

          <CardContent className="pt-0 relative flex flex-col md:flex-row p-8 md:p-12 gap-12 z-10">
            
            {/* KIRI: Avatar & Identitas */}
            <div className="flex flex-col items-center md:w-1/3 -mt-24">
              <Avatar className="h-48 w-48 border-8 border-slate-900 shadow-[8px_8px_0px_#0f172a] bg-yellow-300 text-slate-900 transform -rotate-3 hover:scale-105 transition-transform">
                <AvatarImage src={avatar_url} />
                <AvatarFallback className="text-6xl font-black bg-yellow-300">
                  {full_name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>

              <Badge className="mt-6 bg-emerald-400 text-slate-900 hover:bg-emerald-300 px-6 py-2 uppercase font-black text-lg border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] transform rotate-2 z-10">
                <Shield className="w-5 h-5 mr-2" /> {role || "Siswa"}
              </Badge>

              <div className="mt-6 text-center">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">{full_name}</h1>
                <p className="text-slate-500 font-bold text-xl mt-1">@{username || 'username'}</p>
              </div>

              {bio && (
                <div className="mt-6 bg-slate-50 border-4 border-slate-900 p-4 rounded-2xl shadow-[4px_4px_0px_#0f172a] w-full relative">
                  <div className="absolute -top-3 -left-2 text-4xl font-black text-violet-400 opacity-50">"</div>
                  <p className="text-slate-700 font-bold text-center italic relative z-10">
                    {bio}
                  </p>
                </div>
              )}
            </div>

            {/* KANAN: Statistik Level & Poin */}
            <div className="flex flex-col md:w-2/3 space-y-8">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-violet-200 p-6 rounded-[32px] border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] flex flex-col items-center justify-center transform -rotate-2 hover:rotate-0 transition-transform">
                  <span className="text-slate-700 font-black uppercase text-sm mb-2 flex items-center gap-2"><Trophy className="w-5 h-5 text-violet-700" /> LEVEL</span>
                  <span className="text-6xl font-black text-slate-900">{level}</span>
                </div>
                
                <div className="bg-yellow-300 p-6 rounded-[32px] border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] flex flex-col items-center justify-center transform rotate-1 hover:rotate-0 transition-transform">
                  <span className="text-slate-700 font-black uppercase text-sm mb-2 flex items-center gap-2">🏆 TOTAL XP</span>
                  <span className="text-6xl font-black text-slate-900">{points || 0}</span>
                </div>
              </div>

              {/* Progress Bar level selanjutnya */}
              <div className="bg-white border-4 border-slate-900 p-5 rounded-3xl shadow-[4px_4px_0px_#0f172a]">
                <div className="flex justify-between text-base mb-3 font-bold text-slate-700">
                  <span>Ke Level {level + 1}</span>
                  <span>{progressPercent} / 100 XP</span>
                </div>
                <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden border-4 border-slate-900 relative">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-1000 ease-out absolute left-0 top-0 bottom-0"
                    style={{ width: `${progressPercent}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20" style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }}></div>
                  </div>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-3 md:gap-4">
                 <div className="flex flex-col items-center p-3 border-4 border-slate-900 rounded-2xl bg-orange-100 shadow-[4px_4px_0px_#0f172a]">
                   <Flame className="h-8 w-8 text-orange-600 mb-2 fill-orange-500" />
                   <span className="font-black text-2xl text-slate-900">{streak || 0}</span>
                   <span className="font-bold text-[10px] md:text-sm text-slate-600 text-center uppercase leading-tight mt-1">Hari Streak</span>
                 </div>
                 <div className="flex flex-col items-center p-3 border-4 border-slate-900 rounded-xl bg-blue-100 shadow-[4px_4px_0px_#0f172a]">
                   <BookOpen className="h-8 w-8 text-blue-600 mb-2" />
                   <span className="font-black text-2xl text-slate-900">{joinedClassesCount}</span>
                   <span className="font-bold text-[10px] md:text-sm text-slate-600 text-center uppercase leading-tight mt-1">Kelas Diikuti</span>
                 </div>
                 <div className="flex flex-col items-center p-3 border-4 border-slate-900 rounded-xl bg-pink-100 shadow-[4px_4px_0px_#0f172a]">
                   <CheckCircle className="h-8 w-8 text-pink-600 mb-2" />
                   <span className="font-black text-2xl text-slate-900">{submissionCount}</span>
                   <span className="font-bold text-[10px] md:text-sm text-slate-600 text-center uppercase leading-tight mt-1">Tugas Tuntas</span>
                 </div>
              </div>

              {/* Koleksi Badges */}
              <div className="pt-4 border-t-4 border-slate-200">
                <h3 className="font-black text-slate-900 uppercase mb-4 text-center md:text-left">Koleksi Lencana</h3>
                {recentBadges.length > 0 ? (
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    {recentBadges.map((badge: any, idx: number) => (
                      <div key={idx} className="bg-white border-4 border-slate-900 p-3 rounded-2xl shadow-[4px_4px_0px_#0f172a] flex flex-col items-center w-24 transform hover:-translate-y-2 hover:rotate-3 transition-transform cursor-pointer" title={badge.description}>
                        <span className="text-4xl filter drop-shadow-md mb-2">{badge.icon}</span>
                        <span className="text-[10px] font-black text-slate-900 text-center uppercase leading-tight line-clamp-2">{badge.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6 bg-slate-50 border-4 border-slate-200 border-dashed rounded-3xl">
                    <p className="font-bold text-slate-400">Belum ada lencana yang dikumpulkan.</p>
                  </div>
                )}
              </div>

            </div>

          </CardContent>
        </Card>
        </ShareableCard>

      </div>
    </div>
  )
}
