import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, ArrowLeft, Terminal, Sparkles } from 'lucide-react'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

// Bypass Cache agar halaman detail selalu update jika ada revisi
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, content, cover_url')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!post) return { title: 'Artikel Tidak Ditemukan' }

  return {
    title: post.title,
    description: post.content?.slice(0, 160),
    openGraph: {
      title: post.title,
      description: post.content?.slice(0, 160),
      images: post.cover_url ? [post.cover_url] : undefined,
      type: 'article',
    },
  }
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('*, profiles(full_name, avatar_url)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !post) {
    console.error("Post not found or error:", error?.message)
    notFound()
  }

  const authorFullName = (post.profiles as any)?.full_name || 'Tim EkskulDev'
  const authorAvatarUrl = (post.profiles as any)?.avatar_url || null

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-slate-900 selection:bg-violet-300 selection:text-violet-900 relative z-0 overflow-x-hidden">
      
      {/* Background Dot Pattern */}
      <div className="absolute inset-0 z-[-1] bg-[radial-gradient(#cbd5e1_2px,transparent_2px)] [background-size:32px_32px] opacity-40"></div>

      {/* Navbar Neobrutalism */}
      <header className="sticky top-0 z-50 bg-[#FDFBF7]/90 backdrop-blur-md border-b-4 border-slate-900 transition-all shadow-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 md:gap-3 font-bold text-slate-900 group cursor-pointer hover:-rotate-2 transition-transform duration-300">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-400 rounded-xl flex items-center justify-center border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] group-hover:shadow-[0px_0px_0px_#0f172a] group-hover:translate-y-[2px] group-hover:translate-x-[2px] transition-all">
              <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-slate-900 fill-slate-900" />
            </div>
            <span className="text-xl md:text-2xl tracking-tight font-black hidden sm:block">Ekskul<span className="text-violet-600">PAK</span>.</span>
          </Link>
          <Link href="/blog">
            <Button className="bg-white hover:bg-slate-100 text-slate-900 font-black border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] active:translate-y-[3px] active:translate-x-[3px] active:shadow-[0px_0px_0px_#0f172a] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#0f172a] rounded-xl text-xs md:text-sm transition-all h-10 md:h-12 px-4 md:px-6">
              <ArrowLeft className="h-4 w-4 mr-2" /> Semua Artikel
            </Button>
          </Link>
        </div>
      </header>

      {/* Article Container */}
      <article className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-20 relative z-10">

        {/* Header Artikel */}
        <div className="mb-10 md:mb-14 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 md:gap-4 mb-6 md:mb-8">
            {post.category && (
              <Badge className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] font-black uppercase tracking-wider text-xs md:text-sm px-4 py-1.5 transform -rotate-2 hover:rotate-0 transition-transform">
                {post.category}
              </Badge>
            )}
            <div className="bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] px-4 py-1.5 rounded-xl flex items-center gap-2 font-bold text-xs md:text-sm text-slate-700">
              <CalendarDays className="w-4 h-4 text-violet-600" />
              {new Date(post.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.1] md:leading-[1.05] tracking-tight mb-8 drop-shadow-sm">
            {post.title}
          </h1>

          {/* Author Card Neobrutalism */}
          <div className="inline-flex items-center gap-4 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] px-4 py-3 md:px-6 md:py-4 rounded-2xl md:rounded-3xl transform rotate-1 hover:rotate-0 transition-transform">
            {authorAvatarUrl ? (
              <img src={authorAvatarUrl} alt={authorFullName} className="w-12 h-12 md:w-14 md:h-14 rounded-xl border-2 border-slate-900 object-cover" />
            ) : (
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-violet-300 border-2 border-slate-900 flex items-center justify-center font-black text-violet-900 text-xl shadow-inner">
                {authorFullName?.[0]?.toUpperCase() || 'T'}
              </div>
            )}
            <div className="text-left">
              <div className="font-black text-slate-900 text-sm md:text-base uppercase tracking-wide">Ditulis Oleh</div>
              <div className="font-bold text-violet-700 text-base md:text-lg">{authorFullName}</div>
            </div>
          </div>
        </div>

        {/* Cover Image */}
        {post.cover_url && (
          <div className="w-full aspect-video rounded-[2rem] md:rounded-[3rem] overflow-hidden mb-12 md:mb-16 bg-slate-100 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] md:shadow-[16px_16px_0px_#0f172a]">
            <img
              src={post.cover_url}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content Body (Kertas Digital) */}
        <div className="bg-white border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] md:shadow-[16px_16px_0px_#0f172a] rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 lg:p-16 relative">
          {/* Pita Isolasi Dekoratif */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-8 bg-pink-400/80 border-2 border-slate-900 transform -rotate-2 opacity-80 mix-blend-multiply"></div>

          <div className="prose prose-slate prose-lg md:prose-xl max-w-none text-slate-800 font-medium leading-relaxed whitespace-pre-wrap prose-headings:font-black prose-headings:text-slate-900 prose-a:text-violet-600 prose-a:font-bold prose-a:underline-offset-4 hover:prose-a:text-orange-500 transition-colors">
            {post.content}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-20 text-center flex justify-center">
          <Link href="/blog">
            <Button className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-black border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] active:translate-y-[6px] active:translate-x-[6px] active:shadow-[0px_0px_0px_#0f172a] hover:-translate-y-1 hover:shadow-[8px_8px_0px_#0f172a] rounded-2xl text-lg uppercase transition-all h-16 px-10">
              <ArrowLeft className="h-6 w-6 mr-3" /> Jelajahi Artikel Lain
            </Button>
          </Link>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t-4 border-slate-900 mt-12 py-10 bg-white text-center text-sm font-bold text-slate-500">
        © {new Date().getFullYear()} EkskulDev LMS ·{' '}
        <Link href="/" className="hover:text-violet-600 transition-colors underline decoration-2 underline-offset-4">Beranda</Link>
        {' · '}
        <Link href="/blog" className="hover:text-violet-600 transition-colors underline decoration-2 underline-offset-4">Majalah</Link>
      </footer>
    </div>
  )
}