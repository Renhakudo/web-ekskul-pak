import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, ArrowLeft, Terminal } from 'lucide-react'
import type { Metadata } from 'next'

interface Props {
    params: Promise<{ slug: string }>
}

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

    const { data: post } = await supabase
        .from('blog_posts')
        .select('*, profiles(full_name, avatar_url)')
        .eq('slug', slug)
        .eq('status', 'published')
        .single()

    if (!post) notFound()

    const author = post.profiles as any

    return (
        <div className="min-h-screen bg-white">

            {/* Navbar */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
                        <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                            <Terminal className="h-4 w-4 text-white" />
                        </div>
                        EkskulDev <span className="text-violet-600">LMS</span>
                    </Link>
                    <Link href="/blog">
                        <Button variant="ghost" size="sm" className="gap-2 text-slate-600">
                            <ArrowLeft className="h-4 w-4" /> Semua Artikel
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Article */}
            <article className="max-w-4xl mx-auto px-6 py-12">

                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8">
                    <Link href="/" className="hover:text-violet-600 transition-colors">Beranda</Link>
                    <span>/</span>
                    <Link href="/blog" className="hover:text-violet-600 transition-colors">Blog</Link>
                    <span>/</span>
                    <span className="text-slate-600 truncate max-w-xs">{post.title}</span>
                </nav>

                {/* Category */}
                {post.category && (
                    <Badge variant="outline" className="mb-4 text-violet-600 border-violet-200">
                        {post.category}
                    </Badge>
                )}

                {/* Title */}
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-6">
                    {post.title}
                </h1>

                {/* Meta */}
                <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100">
                    {author?.avatar_url ? (
                        <img src={author.avatar_url} alt={author.full_name} className="w-10 h-10 rounded-full border border-slate-200" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center font-bold text-violet-700">
                            {author?.full_name?.[0]?.toUpperCase() || 'T'}
                        </div>
                    )}
                    <div>
                        <div className="font-semibold text-slate-800 text-sm">{author?.full_name || 'Tim EkskulDev'}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {new Date(post.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                    </div>
                </div>

                {/* Cover Image */}
                {post.cover_url && (
                    <div className="w-full aspect-video rounded-2xl overflow-hidden mb-10 bg-slate-100">
                        <img
                            src={post.cover_url}
                            alt={post.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Content */}
                <div className="prose prose-slate prose-lg max-w-none">
                    <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-lg">
                        {post.content}
                    </div>
                </div>

                {/* Footer Navigation */}
                <div className="mt-16 pt-8 border-t border-slate-100">
                    <Link href="/blog">
                        <Button variant="outline" className="gap-2">
                            <ArrowLeft className="h-4 w-4" /> Kembali ke Semua Artikel
                        </Button>
                    </Link>
                </div>
            </article>

            {/* Footer */}
            <footer className="border-t border-slate-100 mt-12 py-8 text-center text-sm text-slate-400">
                © 2025 EkskulDev LMS ·{' '}
                <Link href="/" className="hover:text-violet-600 transition-colors">Beranda</Link>
                {' · '}
                <Link href="/blog" className="hover:text-violet-600 transition-colors">Blog</Link>
            </footer>
        </div>
    )
}
