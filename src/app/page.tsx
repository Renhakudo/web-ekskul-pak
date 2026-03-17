import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight,
  Sparkles,
  PlayCircle,
  Puzzle,
  Paintbrush,
  Zap,
  Bot,
  Terminal,
  Newspaper,
  CalendarDays,
  Users,
  MessageSquare,
  Award,
  Globe,
  Rocket
} from 'lucide-react'

export default async function LandingPage() {
  const supabase = await createClient()

  const [
    { count: totalStudents },
    { data: latestPosts },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'siswa'),
    supabase
      .from('blog_posts')
      .select('id, title, slug, cover_url, category, created_at, author_id, profiles(full_name)')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  const journeySteps = [
    {
      icon: Puzzle,
      title: 'Bermain Logika dengan Scratch',
      desc: 'Tidak ada hafalan kode rumit! Kita mulai dengan memecahkan teka-teki logika lewat blok warna-warni layaknya menyusun LEGO. Logika dulu, baru kode.',
      color: 'bg-orange-400',
      textColor: 'text-orange-900',
      rotation: '-rotate-2',
      marginTop: 'mt-0'
    },
    {
      icon: Paintbrush,
      title: 'Mewarnai Dunia Web: HTML & CSS',
      desc: 'Belajar kerangka dasar web dan menyulapnya menjadi cantik. Kita mengatur tata letak, memilih warna, dan mendesain sesuatu yang bisa dilihat seluruh dunia.',
      color: 'bg-emerald-400',
      textColor: 'text-emerald-950',
      rotation: 'rotate-3',
      marginTop: 'md:mt-16'
    },
    {
      icon: Zap,
      title: 'Memberi Nyawa lewat JavaScript',
      desc: 'Tambahkan interaktivitas! Bikin tombol yang bisa ditekan, animasi yang bergerak, dan buat website kita tidak lagi sekadar diam bagai patung.',
      color: 'bg-yellow-400',
      textColor: 'text-yellow-950',
      rotation: '-rotate-1',
      marginTop: 'md:mt-32'
    },
    {
      icon: Bot,
      title: 'Pintar dengan Tools AI & Hosting',
      desc: 'Kita pakai alat industri seperti GitHub & Netlify untuk online, dan manfaatkan AI Prompting untuk bantu kita mikir lebih efisien, bukan menggantikan kita belajar.',
      color: 'bg-violet-400',
      textColor: 'text-violet-950',
      rotation: 'rotate-2',
      marginTop: 'md:mt-48'
    },
  ]

  const funProjects = [
    { name: 'Kalkulator Neobrutalism', tech: 'Dasar JS & CSS', bgColor: 'bg-amber-100' },
    { name: 'Portfolio Animasi Hover', tech: 'HTML/CSS Frame', bgColor: 'bg-sky-100' },
    { name: 'Kuis Interaktif Singkat', tech: 'JS Data Logic', bgColor: 'bg-rose-100' },
    { name: 'Prompt & AI Website Clone', tech: 'Prompting & Tailwind', bgColor: 'bg-lime-100' }
  ]

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 selection:bg-orange-300 selection:text-orange-950 overflow-x-hidden font-sans">

      {/* ====== NAVBAR (CLEAN & CASUAL) ====== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FDFBF7]/80 backdrop-blur-xl border-b-2 border-slate-900/5 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 font-bold text-slate-900 group cursor-pointer hover:-rotate-2 transition-transform duration-300">
            <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]">
              <Sparkles className="h-5 w-5 text-slate-900 fill-slate-900" />
            </div>
            <span className="text-xl tracking-tight font-black">Ekskul<span className="text-violet-600">PAK</span>.</span>
          </div>

          <nav className="hidden md:flex items-center gap-10 text-sm font-bold text-slate-600">
            <a href="#petualangan" className="hover:text-slate-900 transition-colors relative group">
              Petualangan Kita
              <span className="absolute -bottom-1 left-0 w-0 h-1 bg-violet-400 transition-all duration-300 group-hover:w-full rounded-full"></span>
            </a>
            <a href="#karya" className="hover:text-slate-900 transition-colors relative group">
              Kotak Karya
              <span className="absolute -bottom-1 left-0 w-0 h-1 bg-emerald-400 transition-all duration-300 group-hover:w-full rounded-full"></span>
            </a>
            <Link href="/blog" className="hover:text-slate-900 transition-colors flex items-center gap-2 group">
              <Newspaper className="h-4 w-4 text-orange-500 group-hover:rotate-12 transition-transform" />
              Majalah
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 hidden sm:block transition-colors">
              Masuk
            </Link>
            <Link href="/login">
              <Button size="sm" className="bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black rounded-full px-6 border-2 border-emerald-950 shadow-[4px_4px_0px_#022c22] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#022c22] transition-all">
                Mulai Main!
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ====== HERO SECTION (ORGANIC & PLAYFUL) ====== */}
      <section className="relative pt-40 pb-32 overflow-hidden">
        {/* Playful Floating Shapes */}
        <div className="absolute top-20 right-10 md:top-32 md:right-32 w-48 h-48 bg-violet-200 rounded-full blur-[80px] -z-10" />
        <div className="absolute bottom-10 left-10 md:bottom-20 md:left-20 w-64 h-64 bg-yellow-200 rounded-full blur-[90px] -z-10" />

        <div className="absolute top-48 left-[10%] w-16 h-16 bg-blue-400 rounded-3xl border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] -rotate-12 hidden lg:flex items-center justify-center animate-[bounce_8s_infinite]">
          <Puzzle className="text-slate-900 w-8 h-8" />
        </div>
        <div className="absolute bottom-56 right-[15%] w-14 h-14 bg-emerald-400 rounded-full border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rotate-12 hidden lg:flex items-center justify-center animate-[bounce_6s_infinite_0.5s]">
          <Globe className="text-slate-900 w-7 h-7" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 text-center z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 bg-orange-100 border-2 border-orange-200 text-orange-800 px-5 py-2 rounded-full text-sm font-bold mb-8 transform -rotate-2 hover:rotate-0 transition-transform cursor-default">
            <Rocket className="h-4 w-4" /> Tempat asyik bikin website pertamamu!
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-8">
            Belajar Teknologi <br />
            <span className="relative inline-block mt-2">
              <span className="relative z-10">Secara Menyenangkan.</span>
              <span className="absolute bottom-3 left-0 w-full h-4 bg-yellow-300 -z-10 rounded-sm transform -rotate-1"></span>
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed mb-12">
            Kami bukan superhero kode yang mengetik 1000 baris dalam semalam. Di sini kita belajar fondasi logika, memahami dunia internet, merangkai kerangka web interaktif, dan menggunakan AI tools sebagai pendamping belajar yang ramah.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center w-full max-w-md mx-auto sm:max-w-none">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-14 bg-violet-500 hover:bg-violet-400 text-white font-black text-lg rounded-2xl px-10 border-2 border-slate-900 shadow-[6px_6px_0px_#0f172a] hover:-translate-y-1 hover:shadow-[8px_8px_0px_#0f172a] transition-all">
                Gabung Komunitas Kita
              </Button>
            </Link>
            <a href="#petualangan" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 bg-white border-2 border-slate-200 text-slate-700 font-bold text-lg rounded-2xl px-8 hover:bg-slate-50 transition-all hover:-translate-y-1">
                <PlayCircle className="mr-2 h-5 w-5 text-orange-500" />
                Lihat Petualangannya
              </Button>
            </a>
          </div>

          {totalStudents ? (
            <div className="mt-20 pt-8 border-t-2 border-dashed border-slate-200 text-sm font-bold text-slate-500 flex items-center justify-center gap-3">
              <div className="flex -space-x-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px]">🤖</div>
                ))}
              </div>
              <span>Bersama {totalStudents}+ siswa lain yang terus bereksperimen.</span>
            </div>
          ) : null}
        </div>
      </section>

      {/* ====== PETUALANGAN KITA (JOURNEY) ====== */}
      <section id="petualangan" className="py-32 bg-slate-900 text-white relative border-y-4 border-slate-900 overflow-hidden">
        {/* Overlay grid subtle */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_2px,transparent_2px),linear-gradient(90deg,rgba(255,255,255,0.05)_2px,transparent_2px)] bg-[size:40px_40px]"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Bagaimana Kita Belajar?</h2>
            <p className="text-xl text-slate-300 opacity-90 leading-relaxed font-medium">Lupakan rumus rumit. Mari kita mulai dari konsep sederhana, hingga akhirnya situs webmu bisa diakses oleh nenekmu di desa.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
            {journeySteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className={`${step.marginTop} bg-slate-800 rounded-3xl p-8 border-2 border-slate-700 hover:border-slate-500 hover:-translate-y-4 transition-all duration-300 relative group`}>

                  {/* Nomor langkah lucuk */}
                  <div className={`absolute -top-5 -left-5 w-12 h-12 ${step.color} ${step.rotation} rounded-2xl flex items-center justify-center border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] text-xl font-black ${step.textColor} z-10 group-hover:scale-110 transition-transform`}>
                    {idx + 1}
                  </div>

                  <div className="mb-8 p-4 bg-slate-900/50 rounded-2xl inline-block group-hover:bg-slate-700/50 transition-colors">
                    <Icon className={`w-8 h-8 ${step.color.replace('bg-', 'text-')}`} />
                  </div>

                  <h3 className="text-2xl font-black mb-4 leading-tight">{step.title}</h3>
                  <p className="text-slate-400 font-medium leading-relaxed">{step.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ====== KOTAK KARYA ====== */}
      <section id="karya" className="py-32 bg-[#FDFBF7] relative">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <Badge className="mb-6 bg-red-100 text-red-700 hover:bg-red-200 border-2 border-red-200 px-4 py-2 text-sm">
            Taman Bermain Ekskul
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">Kreasi Bebas Aturan.</h2>
          <p className="text-xl text-slate-600 font-medium max-w-2xl mx-auto mb-20">
            Ini bukan sekadar teori panjang. Setiap anggota didorong untuk menciptakan proyek-proyek iseng yang seru namun tetap bermanfaat untuk melatih nalar.
          </p>

          {/* Asymmetrical Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">

            {/* Box 1 - Big Text */}
            <div className="md:col-span-2 bg-emerald-100 rounded-[40px] border-2 border-emerald-300 p-10 flex flex-col justify-center items-start text-left hover:rotate-1 hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 bg-emerald-200 rounded-full flex items-center justify-center mb-6 group-hover:scale-125 transition-transform">
                <Paintbrush className="w-6 h-6 text-emerald-800" />
              </div>
              <h3 className="text-3xl font-black text-emerald-950 mb-3">Portfolio Diri</h3>
              <p className="text-emerald-900 font-medium max-w-md">Membangun mading digital tentang jati dirimu dengan struktur HTML silsilah keluarga dan CSS yang nyentrik.</p>
            </div>

            {/* Box 2 */}
            <div className="bg-violet-100 rounded-[40px] border-2 border-violet-200 p-8 flex flex-col justify-center text-center hover:-rotate-2 hover:shadow-xl transition-all duration-300">
              <h3 className="text-4xl font-black text-violet-900 mb-2">35+</h3>
              <p className="text-violet-800 font-bold">Karya Iseng Tercipta</p>
            </div>

            {/* Box 3 */}
            <div className="bg-orange-100 rounded-[40px] border-2 border-orange-200 p-8 flex flex-col justify-between text-left hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
              <div>
                <Badge className="bg-orange-200 text-orange-900 mb-4 border-0">Interaktif</Badge>
                <h3 className="text-2xl font-black text-orange-950">JS Mini Quiz</h3>
              </div>
              <p className="text-orange-900 font-medium text-sm">Game kuis tebak-tebakan hewan lucu menggunakan Array & Loop dasar!</p>
            </div>

            {/* Box 4 */}
            <div className="md:col-span-2 bg-blue-100 rounded-[40px] border-2 border-blue-200 p-10 flex justify-between items-center hover:rotate-[1deg] hover:shadow-xl transition-all duration-300">
              <div className="text-left w-2/3">
                <h3 className="text-3xl font-black text-blue-950 mb-3">Kolaborasi Tim AI</h3>
                <p className="text-blue-900 font-medium">Belajar prompting cerdik pada ChatGPT untuk mempercepat perbaikan bug dan memahami kode rumit secara lebih manusiawi.</p>
              </div>
              <div className="w-24 h-24 bg-blue-200 rounded-[30%] -rotate-12 flex items-center justify-center shrink-0 border-2 border-blue-300 shadow-[4px_4px_0px_#1e3a8a]">
                <Bot className="w-10 h-10 text-blue-800" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ====== INTERNAL PLATFORM (GENTLE MENTION) ====== */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-slate-200 -z-10 rotate-3"></div>
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-slate-200 -z-10 -rotate-3"></div>

        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-yellow-300 rounded-[40px] border-4 border-slate-900 p-10 md:p-16 text-center shadow-[15px_15px_0px_#0f172a] transform rotate-1 hover:-rotate-1 transition-transform duration-500">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6">Oh ya, kita punya "Basecamp" Sendiri!</h2>
            <p className="text-xl text-yellow-950 font-bold mb-10 max-w-2xl mx-auto">
              Daripada repot kirim materi lewat grup chat, kami merancang ruang kelas digital layaknya RPG. Kumpul tugas, absen, diskusi &mdash; semuanya ngasih kamu poin XP dan badge prestasi yang keren.
            </p>
            <Link href="/login">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white font-black text-lg h-14 px-8 rounded-full shadow-[4px_4px_0px_#facc15] border-2 border-white hover:translate-y-1 hover:shadow-none transition-all">
                Intip Basecamp Kelas
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ====== BLOG / MAGAZINE ====== */}
      {latestPosts && latestPosts.length > 0 && (
        <section className="py-32 bg-[#FDFBF7] relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
              <div>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">Jurnal & Corat-coret.</h2>
                <p className="text-slate-600 text-xl font-medium">Buku harian ekskul kami, rangkuman, dan tutorial pendek.</p>
              </div>
              <Link href="/blog">
                <Button className="bg-violet-200 hover:bg-violet-300 text-violet-900 font-bold rounded-full transition-colors border-2 border-violet-400">
                  Baca Semuanya
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {latestPosts.map((post: any, idx: number) => {
                const rotation = idx % 2 === 0 ? 'hover:-rotate-3' : 'hover:rotate-3';
                return (
                  <Link key={post.id} href={`/blog/${post.slug}`} className={`group relative block ${rotation} transition-transform duration-300`}>
                    <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-white border-2 border-slate-200 mb-6 shadow-sm group-hover:shadow-[8px_8px_0px_#0f172a] group-hover:border-slate-900 transition-all duration-300">
                      {post.cover_url ? (
                        <img
                          src={post.cover_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                        />
                      ) : (
                        <div className="w-full h-full bg-orange-100 flex items-center justify-center">
                          <Newspaper className="h-10 w-10 text-orange-300" />
                        </div>
                      )}
                      {post.category && (
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-white text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] px-3 py-1 font-bold tracking-wider">
                            {post.category}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-500 mb-3">
                      <span className="flex items-center gap-1.5 text-orange-600 bg-orange-100 px-2 py-1 rounded-md">
                        <CalendarDays className="h-4 w-4" />
                        {new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span>• {post.profiles?.full_name?.split(' ')[0] || 'Tim'}</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 leading-snug group-hover:text-violet-600 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ====== CTA & FOOTER ====== */}
      <footer className="bg-slate-900 pt-24 pb-12 text-slate-300 border-t-8 border-violet-500">
        <div className="max-w-7xl mx-auto px-6 text-center mb-24">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight">Mulai Belajar Bikin Web,<br />Satu Baris Sehari.</h2>
          <Link href="/login">
            <Button size="lg" className="bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black text-2xl h-20 px-12 rounded-[2rem] border-4 border-emerald-950 shadow-[8px_8px_0px_#34d399] -rotate-2 hover:rotate-0 hover:-translate-y-2 transition-all">
              Ayo Mulai Petualangan!
            </Button>
          </Link>
        </div>

        <div className="max-w-7xl mx-auto px-6 border-t border-slate-700 pt-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 font-bold text-white group cursor-pointer hover:rotate-2 transition-transform duration-300">
            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center border-2 border-slate-900">
              <Sparkles className="h-4 w-4 text-slate-900 fill-slate-900" />
            </div>
            <span className="text-xl tracking-tight font-black">Ekskul<span className="text-violet-400">PAK</span>.</span>
          </div>

          <div className="flex gap-6 text-sm font-bold text-slate-400">
            <a href="#petualangan" className="hover:text-white transition-colors">Petualangan Utama</a>
            <a href="#karya" className="hover:text-white transition-colors">Galeri Karya</a>
            <Link href="/blog" className="hover:text-white transition-colors flex items-center gap-1">
              <Newspaper className="h-3.5 w-3.5" /> Majalah
            </Link>
            <Link href="/login" className="hover:text-white transition-colors">Masuk Basecamp</Link>
          </div>
        </div>

        <div className="text-center mt-12 text-slate-600 text-sm font-semibold">
          Dibangun dengan penuh keisengan menggunakan Next.js & Tailwind oleh Tim Ekskul PAK &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  )
}