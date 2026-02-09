import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  Terminal, 
  Code2, 
  Cpu, 
  Globe, 
  Zap, 
  Layout, 
  ChevronRight,
  ArrowRight
} from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-violet-500/30 font-sans overflow-x-hidden">
      
      {/* Background Gradients (Hiasan Latar Belakang) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Navbar: Glassmorphism */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/70 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2">
            <div className="bg-violet-600 p-1.5 rounded-lg">
              <Terminal className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Ekskul<span className="text-violet-400">Dev.</span>
            </span>
          </div>
          
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5">
                Masuk
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-white text-slate-950 hover:bg-slate-200 font-semibold transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                Gabung Kelas
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 pt-32 pb-20">
        
        {/* HERO SECTION */}
        <section className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center mb-24">
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
              </span>
              Pendaftaran Anggota Baru Dibuka
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
              Kuasai Skill <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
                Masa Depan
              </span>
            </h1>
            
            <p className="text-lg text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Platform pembelajaran koding eksklusif untuk siswa. 
              Belajar HTML, CSS, React, dan bangun portofolio digitalmu sejak dini.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <Link href="/login">
                <Button size="lg" className="h-12 px-8 bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/25 transition-all w-full sm:w-auto">
                  Mulai Belajar Gratis <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="h-12 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white w-full sm:w-auto">
                  Lihat Kurikulum
                </Button>
              </Link>
            </div>
          </div>

          {/* Code Preview Mockup (Hiasan Visual Kanan) */}
          <div className="relative group perspective-1000 hidden md:block">
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative rounded-xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border-b border-slate-700">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="text-xs text-slate-500 font-mono ml-2">app.tsx — React</div>
              </div>
              <div className="p-6 font-mono text-sm leading-relaxed text-slate-300">
                <p><span className="text-violet-400">export default</span> <span className="text-cyan-400">function</span> <span className="text-yellow-200">HelloWorld</span>() {'{'}</p>
                <p className="pl-4"><span className="text-violet-400">return</span> (</p>
                <p className="pl-8 text-green-300">&lt;div className="container"&gt;</p>
                <p className="pl-12 text-green-300">&lt;h1&gt;<span className="text-white">Halo Dunia! 👋</span>&lt;/h1&gt;</p>
                <p className="pl-12 text-green-300">&lt;p&gt;<span className="text-white">Saya siap belajar coding.</span>&lt;/p&gt;</p>
                <p className="pl-8 text-green-300">&lt;/div&gt;</p>
                <p className="pl-4">);</p>
                <p>{'}'}</p>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section id="features" className="container mx-auto px-6 py-20 border-t border-slate-800/50">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Mengapa Gabung Ekskul Ini?</h2>
            <p className="text-slate-400">Bukan sekadar teori, kita praktik membuat aplikasi nyata.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<Code2 className="h-8 w-8 text-cyan-400" />}
              title="Kurikulum Industri"
              desc="Materi disusun berdasarkan teknologi yang dipakai perusahaan teknologi besar saat ini (React, Tailwind)."
            />
            <FeatureCard 
              icon={<Zap className="h-8 w-8 text-yellow-400" />}
              title="Gamified Learning"
              desc="Belajar jadi tidak membosankan. Kejar XP, pertahankan Streak, dan naikkan Levelmu."
            />
            <FeatureCard 
              icon={<Globe className="h-8 w-8 text-violet-400" />}
              title="Portofolio Online"
              desc="Setiap tugas adalah project. Lulus ekskul, kamu sudah punya website buatan sendiri."
            />
          </div>
        </section>

        {/* TECH STACK STRIP */}
        <section className="py-10 bg-slate-900/30 border-y border-slate-800/50">
          <div className="container mx-auto px-6 text-center">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-6">Teknologi yang akan dipelajari</p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
               <span className="text-xl font-bold flex items-center gap-2"><Cpu className="text-blue-400"/> React</span>
               <span className="text-xl font-bold flex items-center gap-2"><Layout className="text-teal-400"/> Tailwind</span>
               <span className="text-xl font-bold flex items-center gap-2"><Code2 className="text-yellow-400"/> JavaScript</span>
               <span className="text-xl font-bold flex items-center gap-2"><Globe className="text-orange-400"/> HTML5</span>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="container mx-auto px-6 py-24 text-center">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-8 md:p-16 rounded-3xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 via-cyan-500 to-violet-600"></div>
             
             <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Siap Menjadi Digital Talent?</h2>
             <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
               Jangan tunggu kuliah untuk belajar koding. Mulai langkah pertamamu hari ini bersama teman-teman ekskul lainnya.
             </p>
             <Link href="/login">
               <Button size="lg" className="h-14 px-8 text-lg bg-white text-slate-950 hover:bg-cyan-50 font-bold rounded-full">
                 Daftar Ekskul Sekarang
               </Button>
             </Link>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm bg-slate-950">
        <p>© 2026 Ekskul Programming. All rights reserved.</p>
        <p className="mt-2">Dibuat dengan Next.js & Supabase.</p>
      </footer>
    </div>
  )
}

// Komponen Kecil untuk Card Fitur
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="group p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-violet-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10">
      <div className="mb-4 p-3 bg-slate-800 rounded-lg w-fit group-hover:bg-slate-700 transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-100 mb-2">{title}</h3>
      <p className="text-slate-400 leading-relaxed text-sm">
        {desc}
      </p>
    </div>
  )
}