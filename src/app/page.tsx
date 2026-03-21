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
  Newspaper,
  CalendarDays,
  Globe,
  Rocket,
  Code2,
  Cpu
} from 'lucide-react'

export const revalidate = 60

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
      desc: 'Tidak ada hafalan kode rumit! Kita mulai dengan memecahkan teka-teki logika lewat blok warna-warni layaknya menyusun LEGO.',
      color: 'bg-orange-400',
      textColor: 'text-orange-900',
      rotation: '-rotate-2',
      marginTop: 'mt-0'
    },
    {
      icon: Paintbrush,
      title: 'Mewarnai Dunia Web: HTML & CSS',
      desc: 'Belajar kerangka dasar web dan menyulapnya menjadi cantik. Kita mengatur tata letak, dan mendesain sesuatu untuk dunia.',
      color: 'bg-emerald-400',
      textColor: 'text-emerald-950',
      rotation: 'rotate-3',
      marginTop: 'md:mt-12'
    },
    {
      icon: Zap,
      title: 'Memberi Nyawa lewat JavaScript',
      desc: 'Tambahkan interaktivitas! Bikin tombol yang bisa ditekan, animasi bergerak, dan website kita tidak lagi diam bagai patung.',
      color: 'bg-yellow-400',
      textColor: 'text-yellow-950',
      rotation: '-rotate-1',
      marginTop: 'md:mt-24'
    },
    {
      icon: Bot,
      title: 'Pintar dengan Tools AI & Hosting',
      desc: 'Pakai alat industri seperti GitHub & Netlify, dan manfaatkan AI Prompting untuk bantu kita mikir lebih efisien dan modern.',
      color: 'bg-violet-400',
      textColor: 'text-violet-950',
      rotation: 'rotate-2',
      marginTop: 'md:mt-36'
    },
  ]

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 selection:bg-orange-300 selection:text-orange-950 overflow-x-hidden font-sans scroll-smooth relative z-0">
      
      {/* GLOBAL DOT PATTERN */}
      <div className="absolute inset-0 z-[-1] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-50"></div>

      {/* ====== NAVBAR ====== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FDFBF7]/90 backdrop-blur-md border-b-4 border-slate-900 transition-all">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3 font-bold text-slate-900 group cursor-pointer hover:-rotate-2 transition-transform duration-300">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-400 rounded-xl flex items-center justify-center border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] group-hover:shadow-[0px_0px_0px_#0f172a] group-hover:translate-y-[2px] group-hover:translate-x-[2px] transition-all shrink-0">
              <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-slate-900 fill-slate-900 animate-pulse" />
            </div>
            <span className="text-lg md:text-2xl tracking-tight font-black">Ekskul<span className="text-violet-600">PAK</span>.</span>
          </div>

          <nav className="hidden lg:flex items-center gap-8 text-sm md:text-base font-bold text-slate-700">
            <a href="#petualangan" className="hover:text-slate-900 hover:-translate-y-1 transition-all relative group">
              Petualangan Kita
              <span className="absolute -bottom-2 left-0 w-0 h-1.5 bg-violet-400 transition-all duration-300 group-hover:w-full rounded-full"></span>
            </a>
            <a href="#karya" className="hover:text-slate-900 hover:-translate-y-1 transition-all relative group">
              Kotak Karya
              <span className="absolute -bottom-2 left-0 w-0 h-1.5 bg-emerald-400 transition-all duration-300 group-hover:w-full rounded-full"></span>
            </a>
            <Link href="/blog" className="hover:text-slate-900 transition-all flex items-center gap-2 group hover:-translate-y-1">
              <Newspaper className="h-4 w-4 text-orange-500 group-hover:rotate-12 transition-transform" />
              Majalah
              <span className="absolute -bottom-2 left-0 w-0 h-1.5 bg-orange-400 transition-all duration-300 group-hover:w-full rounded-full"></span>
            </Link>
          </nav>

          <div className="flex items-center gap-3 md:gap-5">
            <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 hidden md:block transition-colors hover:underline decoration-2 underline-offset-4 decoration-violet-400">
              Masuk
            </Link>
            <Link href="/login">
              <Button size="sm" className="bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black rounded-xl px-4 md:px-6 h-10 md:h-12 border-2 border-emerald-950 shadow-[3px_3px_0px_#022c22] md:shadow-[4px_4px_0px_#022c22] hover:-translate-y-1 hover:shadow-[5px_5px_0px_#022c22] active:translate-y-[3px] active:translate-x-[3px] active:shadow-[0px_0px_0px_#022c22] transition-all text-xs md:text-sm whitespace-nowrap">
                Mulai Main!
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ====== HERO SECTION ====== */}
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden flex flex-col items-center">
        {/* Dekorasi Mengambang */}
        <div className="absolute top-20 left-4 md:top-32 md:left-[10%] w-12 h-12 md:w-16 md:h-16 bg-blue-400 rounded-2xl md:rounded-3xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] -rotate-12 flex items-center justify-center animate-[bounce_5s_infinite] opacity-50 md:opacity-100">
          <Code2 className="text-slate-900 w-6 h-6 md:w-8 md:h-8" />
        </div>
        <div className="absolute bottom-32 right-4 md:bottom-40 md:right-[12%] w-10 h-10 md:w-14 md:h-14 bg-pink-400 rounded-full border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rotate-12 flex items-center justify-center animate-[bounce_4s_infinite_0.5s] opacity-50 md:opacity-100">
          <Cpu className="text-slate-900 w-5 h-5 md:w-7 md:h-7" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 md:px-6 text-center z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 bg-white border-2 md:border-4 border-slate-900 text-slate-900 px-4 py-2 md:px-6 md:py-2.5 rounded-full text-xs md:text-sm font-bold mb-8 transform -rotate-2 hover:rotate-2 hover:scale-105 transition-all shadow-[4px_4px_0px_#0f172a] cursor-default">
            <Rocket className="h-4 w-4 md:h-5 md:w-5 text-orange-500" /> Tempat asyik bikin website!
          </div>

          {/* Pengaturan Ukuran Teks agar tidak terlalu Zoom-in */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[1.05] mb-8 drop-shadow-sm">
            Belajar Teknologi <br />
            <span className="relative inline-block mt-2">
              <span className="relative z-10 text-white [-webkit-text-stroke:2px_#0f172a]">Secara Menyenangkan.</span>
              <span className="absolute bottom-2 md:bottom-3 left-0 w-full h-6 md:h-8 bg-yellow-400 -z-10 transform -rotate-1 border-2 md:border-4 border-slate-900 shadow-[3px_3px_0px_#0f172a]"></span>
            </span>
          </h1>

          <p className="text-base md:text-lg text-slate-700 font-semibold max-w-2xl mx-auto leading-relaxed mb-10 bg-white/50 p-4 md:p-6 rounded-2xl border-2 border-slate-900 border-dashed">
            Kami bukan superhero kode yang mengetik 1000 baris dalam semalam. Di sini kita belajar fondasi logika, merangkai web interaktif, dan menggunakan AI sebagai teman belajar.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md mx-auto sm:max-w-none px-4">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-14 bg-violet-500 hover:bg-violet-400 text-white font-black text-base md:text-lg rounded-xl px-8 border-2 md:border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] md:shadow-[6px_6px_0px_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0f172a] md:hover:shadow-[8px_8px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-[0px_0px_0px_#0f172a] transition-all">
                Gabung Komunitas
              </Button>
            </Link>
            <a href="#petualangan" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 bg-white border-2 md:border-4 border-slate-900 text-slate-900 font-black text-base md:text-lg rounded-xl px-8 hover:bg-slate-100 shadow-[4px_4px_0px_#0f172a] md:shadow-[6px_6px_0px_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0f172a] md:hover:shadow-[8px_8px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-[0px_0px_0px_#0f172a] transition-all">
                <PlayCircle className="mr-2 h-5 w-5 text-orange-500 fill-orange-100" />
                Lihat Petualangan
              </Button>
            </a>
          </div>

          {totalStudents ? (
            <div className="mt-16 inline-flex flex-col sm:flex-row items-center justify-center gap-3 bg-white border-2 md:border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] px-6 py-3 rounded-full font-bold text-slate-700 transform rotate-1 hover:-rotate-1 transition-transform mx-4">
              <div className="flex -space-x-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-emerald-300 border-2 border-slate-900 flex items-center justify-center text-xs shadow-sm z-[3] relative">🤖</div>
                ))}
              </div>
              <span className="text-center sm:text-left text-sm md:text-base">Bersama <span className="text-violet-600 font-black">{totalStudents}+</span> siswa bereksperimen.</span>
            </div>
          ) : null}
        </div>
      </section>

      {/* ====== INFINITE TICKER (MARQUEE) ====== */}
      {/* Solusi perbaikan typo di dangerouslySetInnerHTML */}
      <div className="w-full bg-yellow-400 border-y-4 border-slate-900 overflow-hidden flex whitespace-nowrap py-3 transform -rotate-2 scale-105 relative z-20 shadow-[0px_8px_0px_rgba(15,23,42,0.1)]">
        <div className="animate-[marquee_20s_linear_infinite] flex items-center gap-6 font-black text-xl md:text-2xl text-slate-900 tracking-widest uppercase">
          <span>HTML & CSS</span> <Sparkles className="h-5 w-5 md:h-6 md:w-6" />
          <span>JAVASCRIPT</span> <Sparkles className="h-5 w-5 md:h-6 md:w-6" />
          <span>NEXT.JS</span> <Sparkles className="h-5 w-5 md:h-6 md:w-6" />
          <span>UI/UX DESIGN</span> <Sparkles className="h-5 w-5 md:h-6 md:w-6" />
          <span>AI PROMPTING</span> <Sparkles className="h-5 w-5 md:h-6 md:w-6" />
          <span>HTML & CSS</span> <Sparkles className="h-5 w-5 md:h-6 md:w-6" />
          <span>JAVASCRIPT</span> <Sparkles className="h-5 w-5 md:h-6 md:w-6" />
          <span>NEXT.JS</span> <Sparkles className="h-5 w-5 md:h-6 md:w-6" />
          <span>UI/UX DESIGN</span> <Sparkles className="h-5 w-5 md:h-6 md:w-6" />
          <span>AI PROMPTING</span> <Sparkles className="h-5 w-5 md:h-6 md:w-6" />
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
        `}} />
      </div>

      {/* ====== PETUALANGAN KITA (JOURNEY) ====== */}
      <section id="petualangan" className="py-24 md:py-32 bg-slate-900 text-white relative border-b-4 border-slate-900 overflow-hidden mt-8 md:mt-10">
        <div className="absolute inset-0 bg-[radial-gradient(#334155_2px,transparent_2px)] [background-size:32px_32px] opacity-30"></div>

        <div className="max-w-6xl mx-auto px-4 md:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <Badge className="bg-emerald-400 text-emerald-950 font-black text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 border-2 border-emerald-950 mb-4 md:mb-6 hover:bg-emerald-300 transform rotate-2">Roadmap Belajar</Badge>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 drop-shadow-sm">Bagaimana Kita Belajar?</h2>
            <p className="text-lg md:text-xl text-slate-300 opacity-90 leading-relaxed font-semibold">Lupakan rumus rumit. Mari mulai dari konsep sederhana, hingga webmu bisa diakses nenekmu di desa.</p>
          </div>

          <div className="relative">
            {/* Garis Peta - Hanya Desktop */}
            <div className="absolute top-[40%] left-10 right-10 border-t-4 border-dashed border-slate-600 -z-10 hidden md:block"></div>

            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12 md:gap-y-16 pt-6">
              {journeySteps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={idx} className={`${step.marginTop} bg-slate-800 rounded-[2rem] p-6 md:p-8 border-4 border-slate-900 hover:border-slate-400 hover:-translate-y-2 md:hover:-translate-y-4 transition-all duration-300 relative group shadow-[6px_6px_0px_#0f172a] hover:shadow-[10px_10px_0px_#0f172a] mt-6 md:mt-0`}>
                    
                    {/* Perbaikan posisi anchor di HP agar tidak keluar layar */}
                    <div className={`absolute -top-5 left-4 md:-top-6 md:-left-6 w-12 h-12 md:w-14 md:h-14 ${step.color} ${step.rotation} rounded-2xl flex items-center justify-center border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] text-xl md:text-2xl font-black ${step.textColor} z-10 group-hover:scale-110 transition-transform`}>
                      {idx + 1}
                    </div>

                    <div className="mb-6 p-4 bg-slate-900 rounded-2xl inline-block group-hover:bg-slate-700 transition-colors border-2 border-slate-700">
                      <Icon className={`w-8 h-8 md:w-10 md:h-10 ${step.color.replace('bg-', 'text-')} group-hover:scale-110 transition-transform`} />
                    </div>

                    <h3 className="text-xl md:text-2xl font-black mb-3 leading-tight">{step.title}</h3>
                    <p className="text-sm md:text-base text-slate-400 font-medium leading-relaxed">{step.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ====== KOTAK KARYA ====== */}
      <section id="karya" className="py-24 md:py-32 bg-[#FDFBF7] relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 md:px-6 text-center">
          <Badge className="mb-6 bg-red-400 text-red-950 font-black hover:bg-red-300 border-2 md:border-4 border-slate-900 px-4 py-1.5 md:px-6 md:py-2 text-sm md:text-base shadow-[3px_3px_0px_#0f172a] md:shadow-[4px_4px_0px_#0f172a] -rotate-2 hover:rotate-0 transition-transform">
            Taman Bermain Ekskul
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">Kreasi Bebas Aturan.</h2>
          <p className="text-lg md:text-xl text-slate-600 font-bold max-w-2xl mx-auto mb-16 bg-white p-4 md:p-6 rounded-2xl border-2 md:border-4 border-slate-900 border-dashed shadow-sm">
            Ini bukan sekadar teori panjang. Setiap anggota didorong menciptakan proyek iseng yang seru namun tetap bermanfaat.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px] md:auto-rows-[280px]">
            {/* Box 1 */}
            <div className="md:col-span-2 bg-emerald-100 rounded-[2rem] border-4 border-slate-900 p-6 md:p-10 flex flex-col justify-center items-start text-left hover:rotate-1 hover:-translate-y-2 shadow-[6px_6px_0px_#0f172a] md:shadow-[8px_8px_0px_#0f172a] transition-all duration-300 group overflow-hidden relative">
              <div className="absolute -right-5 -bottom-5 opacity-20 group-hover:scale-125 transition-transform duration-700">
                <Paintbrush className="w-48 h-48 md:w-64 md:h-64 text-emerald-900" />
              </div>
              <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-300 rounded-full border-2 md:border-4 border-slate-900 flex items-center justify-center mb-4 md:mb-6 group-hover:-rotate-12 transition-transform relative z-10">
                <Paintbrush className="w-6 h-6 md:w-8 md:h-8 text-emerald-900" />
              </div>
              <h3 className="text-2xl md:text-4xl font-black text-slate-900 mb-2 md:mb-4 relative z-10">Portfolio Diri</h3>
              <p className="text-emerald-950 text-sm md:text-lg font-bold max-w-sm relative z-10">Membangun mading digital tentang jati dirimu dengan struktur HTML & CSS yang nyentrik.</p>
            </div>

            {/* Box 2 */}
            <div className="bg-violet-200 rounded-[2rem] border-4 border-slate-900 p-6 flex flex-col justify-center text-center hover:-rotate-2 hover:-translate-y-2 shadow-[6px_6px_0px_#0f172a] md:shadow-[8px_8px_0px_#0f172a] transition-all duration-300 bg-[radial-gradient(#a78bfa_2px,transparent_2px)] [background-size:20px_20px]">
              <h3 className="text-5xl md:text-6xl font-black text-slate-900 mb-2 bg-white/80 inline-block mx-auto px-4 rounded-xl border-2 border-slate-900 rotate-2">35+</h3>
              <p className="text-violet-950 font-black text-base md:text-lg mt-3 md:mt-4 bg-white/80 py-1.5 md:py-2 px-2 rounded-xl border-2 border-slate-900 -rotate-1">Karya Iseng Tercipta</p>
            </div>

            {/* Box 3 */}
            <div className="bg-orange-200 rounded-[2rem] border-4 border-slate-900 p-6 md:p-8 flex flex-col justify-between text-left hover:-translate-y-2 shadow-[6px_6px_0px_#0f172a] md:shadow-[8px_8px_0px_#0f172a] transition-all duration-300 group">
              <div>
                <Badge className="bg-white text-orange-900 mb-4 border-2 border-slate-900 font-bold px-3 py-1 text-xs md:text-sm shadow-[2px_2px_0px_#0f172a] group-hover:scale-105 transition-transform">Interaktif</Badge>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900">JS Mini Quiz</h3>
              </div>
              <p className="text-orange-950 font-bold text-sm md:text-base leading-snug">Game kuis tebak hewan lucu menggunakan Array & Loop dasar!</p>
            </div>

            {/* Box 4 */}
            <div className="md:col-span-2 bg-blue-200 rounded-[2rem] border-4 border-slate-900 p-6 md:p-10 flex flex-col-reverse sm:flex-row justify-between items-start sm:items-center gap-4 md:gap-6 hover:rotate-[1deg] hover:-translate-y-2 shadow-[6px_6px_0px_#0f172a] md:shadow-[8px_8px_0px_#0f172a] transition-all duration-300">
              <div className="text-left w-full sm:w-2/3">
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 md:mb-4">Kolaborasi Tim AI</h3>
                <p className="text-blue-950 font-bold text-sm md:text-lg leading-snug">Belajar prompting cerdik pada ChatGPT untuk mempercepat perbaikan bug dan memahami kode rumit.</p>
              </div>
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-white rounded-full sm:rounded-[30%] rotate-12 flex items-center justify-center shrink-0 border-2 md:border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] group-hover:rotate-45 transition-transform duration-500">
                <Bot className="w-8 h-8 sm:w-12 sm:h-12 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== INTERNAL PLATFORM ====== */}
      <section className="py-24 md:py-32 bg-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,#cbd5e1_0,#cbd5e1_2px,transparent_2px,transparent_12px)] z-0"></div>

        <div className="max-w-5xl mx-auto px-4 md:px-6 relative z-10">
          <div className="bg-yellow-400 rounded-[2rem] md:rounded-[3rem] border-4 md:border-8 border-slate-900 p-8 md:p-16 text-center shadow-[10px_10px_0px_#0f172a] md:shadow-[20px_20px_0px_#0f172a] transform rotate-1 hover:-rotate-1 transition-transform duration-500">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">Oh ya, kita punya "Basecamp" Sendiri!</h2>
            <p className="text-base md:text-xl text-yellow-950 font-bold mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed bg-white/40 p-4 md:p-6 rounded-2xl border-2 md:border-4 border-slate-900 border-dashed">
              Daripada repot kirim materi lewat grup chat, kami merancang ruang kelas digital layaknya RPG. Kumpul tugas, absen, diskusi &mdash; semuanya ngasih kamu poin XP dan badge!
            </p>
            <Link href="/login">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white font-black text-base md:text-xl h-14 md:h-16 px-8 md:px-12 rounded-full shadow-[4px_4px_0px_#ffffff] border-2 md:border-4 border-slate-900 ring-2 md:ring-4 ring-slate-900 hover:translate-y-1 md:hover:translate-y-2 hover:shadow-none active:translate-y-2 transition-all">
                Intip Basecamp Kelas
                <ArrowRight className="ml-3 h-5 w-5 animate-pulse" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ====== BLOG / MAGAZINE ====== */}
      {latestPosts && latestPosts.length > 0 && (
        <section className="py-24 md:py-32 bg-[#FDFBF7] relative">
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 md:mb-16 gap-4 md:gap-6">
              <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] transform -rotate-1">
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 md:mb-3">Jurnal & Corat-coret.</h2>
                <p className="text-slate-700 text-base md:text-lg font-bold">Buku harian ekskul, rangkuman, dan tutorial.</p>
              </div>
              <Link href="/blog" className="self-start sm:self-auto">
                <Button className="bg-violet-300 hover:bg-violet-200 text-slate-900 font-black text-base md:text-lg h-12 md:h-14 px-6 md:px-8 rounded-xl md:rounded-2xl transition-all border-2 md:border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-[0px_0px_0px_#0f172a]">
                  Baca Semua
                </Button>
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
              {latestPosts.map((post: any, idx: number) => {
                const rotation = idx % 2 === 0 ? 'hover:-rotate-2' : 'hover:rotate-2';
                return (
                  <Link key={post.id} href={`/blog/${post.slug}`} className={`group relative block ${rotation} transition-transform duration-300 bg-white p-3 md:p-4 rounded-[1.5rem] md:rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] hover:shadow-[10px_10px_0px_#0f172a] hover:-translate-y-1`}>
                    <div className="relative aspect-[4/3] rounded-xl md:rounded-2xl overflow-hidden bg-slate-100 border-2 md:border-4 border-slate-900 mb-4 md:mb-5">
                      {post.cover_url ? (
                        <img
                          src={post.cover_url}
                          alt={post.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                        />
                      ) : (
                        <div className="w-full h-full bg-orange-200 flex items-center justify-center">
                          <Newspaper className="h-12 w-12 md:h-16 md:w-16 text-slate-900" />
                        </div>
                      )}
                      {post.category && (
                        <div className="absolute top-3 left-3 md:top-4 md:left-4">
                          <Badge className="bg-yellow-400 text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] px-3 py-1 font-black text-xs md:text-sm tracking-wider uppercase">
                            {post.category}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="px-2 md:px-3 pb-2">
                      <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm font-black text-slate-600 mb-3">
                        <span className="flex items-center gap-1.5 bg-slate-100 border-2 border-slate-900 px-2 py-0.5 md:px-3 md:py-1 rounded-lg md:rounded-xl">
                          <CalendarDays className="h-3 w-3 md:h-4 md:w-4" />
                          {new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span>• {(post.profiles as any)?.full_name?.split(' ')[0] || 'Tim'}</span>
                      </div>
                      <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-snug group-hover:text-violet-600 transition-colors line-clamp-3 md:line-clamp-2">
                        {post.title}
                      </h3>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ====== CTA & FOOTER ====== */}
      <footer className="bg-slate-900 pt-24 md:pt-32 pb-8 md:pb-12 text-slate-300 border-t-[8px] md:border-t-[12px] border-violet-500 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>

        <div className="max-w-6xl mx-auto px-4 md:px-6 text-center mb-24 md:mb-32 relative z-10">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-8 tracking-tighter leading-[1.1]">Mulai Belajar Web,<br /><span className="text-yellow-400">Satu Baris Sehari.</span></h2>
          <Link href="/login">
            <Button size="lg" className="w-full sm:w-auto bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black text-xl md:text-2xl h-16 md:h-20 px-8 md:px-12 rounded-[2rem] md:rounded-[2.5rem] border-4 border-white shadow-[6px_6px_0px_#ffffff] md:shadow-[8px_8px_0px_#ffffff] -rotate-2 hover:rotate-0 hover:-translate-y-1 md:hover:-translate-y-2 active:translate-y-2 active:shadow-none transition-all">
              Ayo Mulai Sekarang!
            </Button>
          </Link>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-6 border-t-2 border-slate-700 border-dashed pt-8 md:pt-12 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8 text-center md:text-left relative z-10">
          <div className="flex items-center gap-2 md:gap-3 font-bold text-white group cursor-pointer hover:rotate-3 transition-transform duration-300">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-400 rounded-lg md:rounded-xl flex items-center justify-center border-2 border-white shadow-[2px_2px_0px_#ffffff]">
              <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-slate-900 fill-slate-900" />
            </div>
            <span className="text-xl md:text-2xl tracking-tight font-black">Ekskul<span className="text-violet-400">PAK</span>.</span>
          </div>

          <div className="flex flex-wrap justify-center gap-x-4 md:gap-x-8 gap-y-3 text-sm md:text-base font-bold text-slate-400">
            <a href="#petualangan" className="hover:text-yellow-400 transition-colors">Petualangan</a>
            <a href="#karya" className="hover:text-emerald-400 transition-colors">Karya</a>
            <Link href="/blog" className="hover:text-orange-400 transition-colors flex items-center gap-1">
              <Newspaper className="h-4 w-4" /> Majalah
            </Link>
            <Link href="/login" className="hover:text-violet-400 transition-colors underline decoration-2 underline-offset-4">Basecamp</Link>
          </div>
        </div>

        <div className="text-center mt-10 md:mt-16 text-slate-600 text-xs md:text-sm font-bold px-6 relative z-10">
          Dibangun dengan penuh keisengan oleh Tim Ekskul PAK &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  )
}