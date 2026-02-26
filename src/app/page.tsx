import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight,
  Star,
  Trophy,
  Users,
  BookOpen,
  Zap,
  Code2,
  Globe,
  Cpu,
  ChevronRight,
  CalendarCheck,
  MessageSquare,
  Award,
  TrendingUp,
  Terminal,
} from 'lucide-react'

export default async function LandingPage() {
  const supabase = await createClient()

  // Ambil statistik publik untuk ditampilkan di landing page
  const [
    { count: totalStudents },
    { count: totalMaterials },
    { count: totalClasses },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'siswa'),
    supabase.from('materials').select('*', { count: 'exact', head: true }),
    supabase.from('classes').select('*', { count: 'exact', head: true }),
  ])

  const programs = [
    {
      icon: Code2,
      title: 'Web Development',
      desc: 'Pelajari HTML, CSS, JavaScript, dan framework modern seperti React & Next.js.',
      color: 'from-violet-500 to-purple-600',
      bg: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
    {
      icon: Globe,
      title: 'UI/UX Design',
      desc: 'Kuasai Figma, prinsip desain, prototyping, dan user research.',
      color: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      icon: Cpu,
      title: 'Programming Dasar',
      desc: 'Logika pemrograman, algoritma, dan struktur data menggunakan Python.',
      color: 'from-blue-500 to-cyan-600',
      bg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
  ]

  const features = [
    {
      icon: Star,
      title: 'Sistem XP & Level',
      desc: 'Dapatkan Experience Points dari setiap materi dan absensi. Naiki level dan tunjukkan kemampuanmu!',
      color: 'text-yellow-500',
      bg: 'bg-yellow-50',
    },
    {
      icon: Trophy,
      title: 'Leaderboard Global',
      desc: 'Bersaing sehat dengan teman sekelas di papan peringkat. Siapa yang teratas?',
      color: 'text-orange-500',
      bg: 'bg-orange-50',
    },
    {
      icon: MessageSquare,
      title: 'Forum Diskusi Real-time',
      desc: 'Ajukan pertanyaan, bantu temanmu, dan diskusikan materi langsung di setiap kelas.',
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
    },
    {
      icon: CalendarCheck,
      title: 'Absensi Pintar',
      desc: 'Catat kehadiran dengan mudah. Hadir = XP bonus! Sistem terhubung dengan kontrol admin.',
      color: 'text-violet-500',
      bg: 'bg-violet-50',
    },
    {
      icon: BookOpen,
      title: 'Materi Terstruktur',
      desc: 'Modul belajar yang terorganisir per kelas dan topik, dengan berbagai format konten.',
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      icon: Award,
      title: 'Sistem Penilaian',
      desc: 'Kumpulkan tugas, terima penilaian dari guru, dan pantau progresmu secara transparan.',
      color: 'text-pink-500',
      bg: 'bg-pink-50',
    },
  ]

  const statData = [
    { value: totalStudents ?? 0, label: 'Siswa Aktif', icon: Users, suffix: '+' },
    { value: totalClasses ?? 0, label: 'Kelas Tersedia', icon: BookOpen, suffix: '' },
    { value: totalMaterials ?? 0, label: 'Modul Materi', icon: Zap, suffix: '+' },
    { value: 100, label: 'XP Per Level', icon: TrendingUp, suffix: '' },
  ]

  return (
    <div className="min-h-screen bg-white">

      {/* ====== NAVBAR ====== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <Terminal className="h-4 w-4 text-white" />
            </div>
            <span>EkskulDev <span className="text-violet-600">LMS</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#tentang" className="hover:text-violet-600 transition-colors">Tentang</a>
            <a href="#program" className="hover:text-violet-600 transition-colors">Program</a>
            <a href="#fitur" className="hover:text-violet-600 transition-colors">Fitur</a>
            <a href="#statistik" className="hover:text-violet-600 transition-colors">Statistik</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-violet-600">
                Masuk
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white font-semibold">
                Daftar Gratis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ====== HERO SECTION ====== */}
      <section className="relative pt-32 pb-24 overflow-hidden bg-slate-900">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.15),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.1),transparent_70%)]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-violet-600/20 border border-violet-500/30 text-violet-300 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
            <Zap className="h-3.5 w-3.5 fill-violet-400 text-violet-400" />
            Platform LMS Gamified Pertama untuk Ekskul
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-tight mb-6">
            Belajar Lebih{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-emerald-400">
              Seru & Kompetitif
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
            Platform digital ekstrakurikuler dengan sistem gamifikasi XP, Level, dan Leaderboard.
            Belajar, bersaing, dan bertumbuh bersama.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-8 shadow-lg shadow-violet-900/30 group">
                Mulai Belajar Sekarang
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <a href="#fitur">
              <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 font-semibold px-8">
                Kenali Fiturnya
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>

          {/* Hero Stats Bar */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-xl mx-auto">
            {[
              { value: `${totalStudents ?? 0}+`, label: 'Siswa' },
              { value: `${totalClasses ?? 0}`, label: 'Kelas' },
              { value: `${totalMaterials ?? 0}+`, label: 'Materi' },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-3xl font-black text-white">{item.value}</div>
                <div className="text-sm text-slate-400 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== TENTANG SECTION ====== */}
      <section id="tentang" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="mb-4 bg-violet-100 text-violet-700 hover:bg-violet-100 border-0 font-semibold">
                Tentang Kami
              </Badge>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-6">
                Ekstrakurikuler yang{' '}
                <span className="text-violet-600">Mengubah Cara</span>{' '}
                Kamu Belajar
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Ekskul PAK (Pemrograman, Animasi & Kreasi) adalah ekstrakurikuler berbasis teknologi
                yang dirancang untuk mempersiapkan siswa menghadapi era digital. Kami bukan sekadar
                ekskul biasa — kami adalah komunitas belajar yang penuh semangat.
              </p>
              <p className="text-slate-600 leading-relaxed mb-8">
                Dengan platform LMS berbasis gamifikasi, belajar jadi lebih menyenangkan. Kumpulkan
                XP dari setiap aktivitas, naiki level, dan bersaing di leaderboard!
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: '🎯', title: 'Visi', desc: 'Menjadi ekskul teknologi terbaik yang melahirkan inovator muda.' },
                  { icon: '🚀', title: 'Misi', desc: 'Belajar praktis, kolaboratif, dan menyenangkan dengan teknologi terkini.' },
                ].map((item) => (
                  <div key={item.title} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <div className="font-bold text-slate-900 mb-1">{item.title}</div>
                    <div className="text-sm text-slate-600 leading-relaxed">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gamification Preview Card */}
            <div className="relative">
              <div className="bg-slate-900 rounded-3xl p-6 shadow-2xl">
                {/* Level Card Mock */}
                <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-6 mb-4 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-violet-200 text-xs font-semibold uppercase tracking-wider">Current Level</p>
                      <div className="text-4xl font-black mt-1">12</div>
                    </div>
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <Star className="h-8 w-8 fill-yellow-400 text-yellow-400" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-violet-200">
                      <span>Progress ke Level 13</span>
                      <span>750/800 XP</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white/80 rounded-full" style={{ width: '93.75%' }} />
                    </div>
                  </div>
                </div>

                {/* Leaderboard Mock */}
                <div className="bg-slate-800 rounded-2xl p-4">
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">🏆 Top Siswa</p>
                  <div className="space-y-2.5">
                    {[
                      { rank: '🥇', name: 'Dimas Prasetya', xp: 1240 },
                      { rank: '🥈', name: 'Ayu Rahmawati', xp: 1180 },
                      { rank: '🥉', name: 'Fajar Nugroho', xp: 950 },
                    ].map((student) => (
                      <div key={student.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{student.rank}</span>
                          <span className="text-white text-sm font-medium">{student.name}</span>
                        </div>
                        <span className="text-violet-400 text-sm font-bold">{student.xp} XP</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -top-4 -right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                +10 XP Absensi! ✅
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== PROGRAM SECTION ====== */}
      <section id="program" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 font-semibold">
              Program & Kegiatan
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              Apa yang Kamu Pelajari?
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Kurikulum kami dirancang oleh praktisi industri untuk memberikan skill yang relevan di dunia kerja.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {programs.map((program) => {
              const Icon = program.icon
              return (
                <div
                  key={program.title}
                  className="bg-white rounded-2xl p-8 border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className={`w-14 h-14 ${program.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-7 w-7 ${program.iconColor}`} />
                  </div>
                  <h3 className="font-bold text-xl text-slate-900 mb-3">{program.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{program.desc}</p>
                  <div className={`mt-6 h-0.5 w-12 bg-gradient-to-r ${program.color} rounded-full group-hover:w-full transition-all duration-500`} />
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ====== FITUR SECTION ====== */}
      <section id="fitur" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-violet-100 text-violet-700 hover:bg-violet-100 border-0 font-semibold">
              Fitur Platform
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              Semua yang Kamu Butuhkan
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Dari materi belajar hingga sistem gamifikasi, semua tersedia dalam satu platform.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all group"
                >
                  <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ====== STATISTIK SECTION ====== */}
      <section id="statistik" className="py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.15),transparent_70%)]" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-violet-600/20 text-violet-300 hover:bg-violet-600/20 border border-violet-500/30 font-semibold">
              Dalam Angka
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Komunitas yang Terus Berkembang
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statData.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="text-center group">
                  <div className="w-14 h-14 bg-violet-600/20 border border-violet-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-violet-600/30 transition-colors">
                    <Icon className="h-7 w-7 text-violet-400" />
                  </div>
                  <div className="text-4xl md:text-5xl font-black text-white mb-2">
                    {stat.value}{stat.suffix}
                  </div>
                  <div className="text-slate-400 text-sm font-medium">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ====== CTA SECTION ====== */}
      <section className="py-24 bg-gradient-to-br from-violet-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.1),transparent_60%)]" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <div className="text-5xl mb-6">🚀</div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Siap Mulai Perjalananmu?
          </h2>
          <p className="text-violet-100 text-lg mb-10 max-w-xl mx-auto">
            Bergabunglah dengan ratusan siswa yang sudah belajar, bersaing, dan bertumbuh di platform kami.
            Daftar gratis sekarang!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-white text-violet-700 hover:bg-violet-50 font-bold px-10 shadow-lg shadow-violet-900/20 group">
                Daftar Sekarang — Gratis!
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 font-bold text-white mb-4">
                <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                  <Terminal className="h-4 w-4 text-white" />
                </div>
                <span>EkskulDev <span className="text-violet-400">LMS</span></span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                Platform pembelajaran digital gamified untuk Ekstrakurikuler PAK.
                Belajar, bersaing, dan bertumbuh bersama komunitas kami.
              </p>
              <div className="flex items-center gap-2 mt-6">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-400 text-xs font-medium">Platform aktif & terus berkembang</span>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Platform</h4>
              <ul className="space-y-2.5">
                {['Dashboard', 'Materi & Kelas', 'Leaderboard', 'Absensi', 'Profil'].map((item) => (
                  <li key={item}>
                    <Link href="/dashboard" className="text-slate-400 text-sm hover:text-violet-400 transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Akses</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Login', href: '/login' },
                  { label: 'Daftar Akun', href: '/login' },
                  { label: 'Admin Panel', href: '/admin' },
                ].map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-slate-400 text-sm hover:text-violet-400 transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-xs">
              © 2025 EkskulDev LMS. Dibuat dengan ❤️ untuk ekskul PAK.
            </p>
            <div className="flex items-center gap-1 text-slate-500 text-xs">
              <span>Ditenagai oleh</span>
              <span className="text-violet-400 font-semibold">Next.js</span>
              <span>&</span>
              <span className="text-emerald-400 font-semibold">Supabase</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}