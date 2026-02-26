import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarDays, ArrowRight, BookOpen, Terminal } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Blog & Berita',
    description: 'Artikel, berita, dan update terbaru dari Ekstrakurikuler PAK.',
}

export default async function BlogListPage() {
    const supabase = await createClient()

    const { data: posts } = await supabase
        .from('blog_posts')
        .select('id, title, slug, cover_url, category, created_at, author_id, profiles(full_name)')
        .eq('status', 'published')
        .order('created_at', { ascending: false })

    const firstPost = posts?.[0]
    const restPosts = posts?.slice(1) || []

    return (
        <div className="min-h-screen bg-white">

            {/* Navbar */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
                        <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                            <Terminal className="h-4 w-4 text-white" />
                        </div>
                        EkskulDev <span className="text-violet-600">LMS</span>
                    </Link>
                    <Link href="/login">
                        <Button size="sm" className="bg-violet-600 hover:bg-violet-700">Masuk</Button>
                    </Link>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-6 py-16">

                {/* Header */}
                <div className="text-center mb-16">
                    <Badge className="mb-4 bg-violet-100 text-violet-700 border-0 hover:bg-violet-100 font-semibold">
                        Blog & Publikasi
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
                        Artikel & Berita
                    </h1>
                    <p className="text-slate-500 max-w-xl mx-auto">
                        Update terbaru, panduan belajar, dan cerita inspiratif dari komunitas Ekskul PAK.
                    </p>
                </div>

                {/* Empty State */}
                {(!posts || posts.length === 0) && (
                    <div className="text-center py-24 space-y-4">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                            <BookOpen className="h-10 w-10 text-slate-400" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Belum Ada Artikel</h2>
                        <p className="text-slate-500 max-w-sm mx-auto">
                            Artikel belum dipublikasikan. Cek kembali nanti!
                        </p>
                        <Link href="/">
                            <Button variant="outline" className="mt-4">← Kembali ke Beranda</Button>
                        </Link>
                    </div>
                )}

                {/* Featured Post (first artikel) */}
                {firstPost && (
                    <Link href={`/blog/${firstPost.slug}`} className="group block mb-16">
                        <div className="grid md:grid-cols-2 gap-8 bg-slate-50 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-slate-100">
                            {/* Cover Image */}
                            <div className="relative h-64 md:h-auto bg-gradient-to-br from-violet-600 to-indigo-700 overflow-hidden">
                                {firstPost.cover_url ? (
                                    <img
                                        src={firstPost.cover_url}
                                        alt={firstPost.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <BookOpen className="h-20 w-20 text-white/30" />
                                    </div>
                                )}
                                <div className="absolute top-4 left-4">
                                    <Badge className="bg-violet-600 text-white border-0 font-bold">Featured</Badge>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-8 md:p-10 flex flex-col justify-center">
                                {firstPost.category && (
                                    <Badge variant="outline" className="mb-4 w-fit text-violet-600 border-violet-200">
                                        {firstPost.category}
                                    </Badge>
                                )}
                                <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mb-4 group-hover:text-violet-700 transition-colors">
                                    {firstPost.title}
                                </h2>
                                <div className="flex items-center gap-3 text-sm text-slate-500 mb-6">
                                    <span className="font-medium text-slate-700">
                                        {(firstPost.profiles as any)?.full_name || 'Tim EkskulDev'}
                                    </span>
                                    <span>·</span>
                                    <span className="flex items-center gap-1">
                                        <CalendarDays className="h-3.5 w-3.5" />
                                        {new Date(firstPost.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                                <span className="inline-flex items-center gap-2 text-violet-600 font-semibold group-hover:gap-3 transition-all">
                                    Baca Selengkapnya <ArrowRight className="h-4 w-4" />
                                </span>
                            </div>
                        </div>
                    </Link>
                )}

                {/* Rest of Posts Grid */}
                {restPosts.length > 0 && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {restPosts.map((post: any) => (
                            <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                                <div className="rounded-2xl overflow-hidden border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                                    {/* Cover */}
                                    <div className="relative h-48 bg-gradient-to-br from-slate-700 to-slate-900 overflow-hidden">
                                        {post.cover_url ? (
                                            <img
                                                src={post.cover_url}
                                                alt={post.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <BookOpen className="h-12 w-12 text-white/20" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 flex flex-col flex-1">
                                        {post.category && (
                                            <Badge variant="outline" className="mb-3 w-fit text-xs text-violet-600 border-violet-200">
                                                {post.category}
                                            </Badge>
                                        )}
                                        <h3 className="font-bold text-slate-900 text-lg leading-snug mb-3 group-hover:text-violet-700 transition-colors flex-1">
                                            {post.title}
                                        </h3>
                                        <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
                                            <span className="font-medium">{(post.profiles as any)?.full_name || 'Tim EkskulDev'}</span>
                                            <span className="flex items-center gap-1">
                                                <CalendarDays className="h-3 w-3" />
                                                {new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer minimal */}
            <footer className="border-t border-slate-100 mt-24 py-8 text-center text-sm text-slate-400">
                © 2025 EkskulDev LMS ·{' '}
                <Link href="/" className="hover:text-violet-600 transition-colors">Beranda</Link>
                {' · '}
                <Link href="/login" className="hover:text-violet-600 transition-colors">Login</Link>
            </footer>
        </div>
    )
}
