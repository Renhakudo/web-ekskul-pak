import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarDays, ArrowRight, BookOpen, Terminal, Sparkles } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Blog & Berita',
    description: 'Artikel, berita, dan update terbaru dari Ekstrakurikuler PAK.',
}

export const dynamic = 'force-dynamic'

export default async function BlogListPage(props: { searchParams?: Promise<any> | any }) {
    const supabase = await createClient()

    // Handle Next.js 15+ async searchParams gracefully
    const searchParams = await props.searchParams || {}
    const page = Math.max(1, Number(searchParams?.page) || 1)
    const limit = 7 // 1 featured + 6 grid = 7 per page
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: posts, count, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, cover_url, category, created_at, author_id, profiles(full_name)', { count: 'exact' })
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(from, to)

    if (error) {
        console.error("Error fetching public posts:", error.message)
    }

    const totalPages = Math.ceil((count || 0) / limit)
    const firstPost = page === 1 ? posts?.[0] : null
    const restPosts = page === 1 ? (posts?.slice(1) || []) : (posts || [])

    return (
        <div className="min-h-screen bg-[#FDFBF7] font-sans text-slate-900 selection:bg-violet-300 selection:text-violet-900 relative z-0 overflow-x-hidden">

            {/* Background Dot Pattern */}
            <div className="absolute inset-0 z-[-1] bg-[radial-gradient(#cbd5e1_2px,transparent_2px)] [background-size:32px_32px] opacity-40"></div>

            {/* ====== NAVBAR ====== */}
            <header className="sticky top-0 z-50 bg-[#FDFBF7]/90 backdrop-blur-md border-b-4 border-slate-900 transition-all shadow-sm">
                <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 md:gap-3 font-bold text-slate-900 group cursor-pointer hover:-rotate-2 transition-transform duration-300">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-400 rounded-xl flex items-center justify-center border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] group-hover:shadow-[0px_0px_0px_#0f172a] group-hover:translate-y-[2px] group-hover:translate-x-[2px] transition-all">
                            <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-slate-900 fill-slate-900" />
                        </div>
                        <span className="text-xl md:text-2xl tracking-tight font-black hidden sm:block">Ekskul<span className="text-violet-600">PAK</span>.</span>
                    </Link>
                    <Link href="/login">
                        <Button className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-black border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] active:translate-y-[3px] active:translate-x-[3px] active:shadow-[0px_0px_0px_#0f172a] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#0f172a] rounded-xl text-xs md:text-sm transition-all h-10 md:h-12 px-4 md:px-6">
                            Masuk Basecamp
                        </Button>
                    </Link>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-20 relative z-10">

                {/* ====== HEADER ====== */}
                <div className="text-center mb-16 md:mb-24 relative">
                    <Badge className="bg-emerald-400 text-emerald-950 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] px-4 py-1.5 text-sm md:text-base transform -rotate-2 hover:rotate-2 transition-transform mb-6">
                        Kabar Terbaru
                    </Badge>
                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tighter drop-shadow-sm uppercase">
                        Jurnal <span className="text-violet-600">&</span> Berita.
                    </h1>
                    <p className="text-base md:text-xl font-bold text-slate-700 max-w-2xl mx-auto bg-white p-4 md:p-6 rounded-2xl border-4 border-slate-900 border-dashed shadow-sm">
                        Catatan perjalanan, tutorial koding, dan cerita seru dari markas EkskulPAK.
                    </p>
                </div>

                {/* ====== EMPTY STATE ====== */}
                {(!posts || posts.length === 0) && (
                    <div className="bg-yellow-100 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[2rem] text-center py-20 px-6 transform -rotate-1 hover:rotate-0 transition-transform">
                        <div className="w-24 h-24 bg-white border-4 border-slate-900 rounded-full flex items-center justify-center mx-auto shadow-inner mb-6">
                            <BookOpen className="h-10 w-10 text-slate-400" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-4 uppercase">Kertas Masih Kosong!</h2>
                        <p className="text-lg font-bold text-slate-600 max-w-md mx-auto mb-8">
                            Belum ada satupun artikel yang dipublikasikan. Coba intip lagi nanti ya!
                        </p>
                        <Link href="/">
                            <Button className="bg-slate-900 hover:bg-slate-800 text-white font-black h-14 px-8 rounded-xl border-4 border-transparent shadow-[4px_4px_0px_#0f172a] hover:-translate-y-1 transition-all">
                                ← Balik ke Beranda
                            </Button>
                        </Link>
                    </div>
                )}

                {/* ====== FEATURED POST (Artikel Pertama) ====== */}
                {firstPost && (
                    <Link href={`/blog/${firstPost.slug}`} className="group block mb-16 md:mb-24">
                        <div className="flex flex-col md:flex-row bg-white rounded-[2rem] md:rounded-[3rem] overflow-hidden border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] hover:shadow-[16px_16px_0px_#0f172a] hover:-translate-y-2 transition-all duration-300">

                            {/* Cover Image Featured */}
                            <div className="relative w-full md:w-1/2 aspect-video md:aspect-auto bg-slate-100 border-b-4 md:border-b-0 md:border-r-4 border-slate-900 overflow-hidden">
                                {firstPost.cover_url ? (
                                    <img
                                        src={firstPost.cover_url}
                                        alt={firstPost.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full bg-violet-200">
                                        <BookOpen className="h-24 w-24 text-violet-400 opacity-50" />
                                    </div>
                                )}
                                <div className="absolute top-4 left-4 md:top-6 md:left-6">
                                    <Badge className="bg-pink-400 text-slate-900 border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] font-black uppercase tracking-widest px-4 py-1.5 transform -rotate-3">
                                        Rilisan Terbaru
                                    </Badge>
                                </div>
                            </div>

                            {/* Content Featured */}
                            <div className="p-8 md:p-12 flex flex-col justify-center w-full md:w-1/2 bg-[#FDFBF7]">
                                {firstPost.category && (
                                    <Badge className="bg-white text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] mb-6 w-fit font-black uppercase text-xs md:text-sm px-3 py-1">
                                        {firstPost.category}
                                    </Badge>
                                )}
                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 leading-[1.1] mb-6 group-hover:text-violet-600 transition-colors">
                                    {firstPost.title}
                                </h2>
                                <div className="flex items-center gap-3 text-sm md:text-base font-bold text-slate-600 mb-8 bg-white p-3 rounded-xl border-2 border-slate-900 shadow-sm w-fit">
                                    <span className="flex items-center gap-2 text-violet-700">
                                        <CalendarDays className="h-4 w-4" />
                                        {new Date(firstPost.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                    <span>•</span>
                                    <span>{(firstPost.profiles as any)?.full_name || 'Tim EkskulDev'}</span>
                                </div>
                                <div className="inline-flex items-center gap-2 text-slate-900 font-black text-lg bg-yellow-400 w-fit px-6 py-3 rounded-xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] group-hover:bg-yellow-300 transition-colors">
                                    Baca Kisahnya <ArrowRight className="h-5 w-5" />
                                </div>
                            </div>
                        </div>
                    </Link>
                )}

                {/* ====== REST OF POSTS GRID ====== */}
                {restPosts.length > 0 && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                        {restPosts.map((post: any, idx: number) => {
                            const rotation = idx % 2 === 0 ? 'hover:-rotate-2' : 'hover:rotate-2';
                            return (
                                <Link key={post.id} href={`/blog/${post.slug}`} className={`group relative block ${rotation} transition-transform duration-300 bg-white p-4 rounded-[2rem] border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] hover:shadow-[12px_12px_0px_#0f172a] hover:-translate-y-2 flex flex-col h-full`}>

                                    {/* Cover Grid */}
                                    <div className="relative h-56 rounded-xl overflow-hidden bg-slate-100 border-4 border-slate-900 mb-5">
                                        {post.cover_url ? (
                                            <img
                                                src={post.cover_url}
                                                alt={post.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full bg-orange-100">
                                                <BookOpen className="h-16 w-16 text-orange-200" />
                                            </div>
                                        )}
                                        {post.category && (
                                            <div className="absolute top-3 left-3">
                                                <Badge className="bg-yellow-400 text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] px-3 py-1 font-black text-xs uppercase tracking-wider">
                                                    {post.category}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content Grid */}
                                    <div className="flex flex-col flex-1 px-2 pb-2">
                                        <div className="flex items-center gap-2 text-xs font-black text-slate-500 mb-3">
                                            <span className="flex items-center gap-1.5 bg-slate-100 border-2 border-slate-900 px-2 py-1 rounded-lg text-slate-700">
                                                <CalendarDays className="h-3.5 w-3.5" />
                                                {new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                            <span className="truncate flex-1">• {(post.profiles as any)?.full_name?.split(' ')[0] || 'Tim'}</span>
                                        </div>
                                        <h3 className="font-black text-slate-900 text-2xl leading-snug mb-3 group-hover:text-violet-600 transition-colors line-clamp-3">
                                            {post.title}
                                        </h3>
                                        <div className="mt-auto pt-4 flex items-center text-sm font-black text-slate-400 group-hover:text-slate-900 transition-colors uppercase">
                                            Baca Selengkapnya <ArrowRight className="ml-1 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}

                {/* ====== PAGINATION CONTROLS ====== */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-16 md:mt-24">
                        {page > 1 ? (
                            <Link href={`/blog?page=${page - 1}`}>
                                <Button variant="outline" className="bg-white hover:bg-slate-100 text-slate-900 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] h-12 px-6 rounded-xl hover:-translate-y-1 transition-all">
                                    ← Sebelumnya
                                </Button>
                            </Link>
                        ) : (
                            <Button disabled variant="outline" className="bg-slate-100 text-slate-400 font-black border-4 border-slate-200 h-12 px-6 rounded-xl opacity-50 cursor-not-allowed">
                                ← Sebelumnya
                            </Button>
                        )}
                        
                        <div className="font-black text-slate-700 bg-white border-4 border-slate-900 px-4 py-2 rounded-xl shadow-sm transform -rotate-2">
                            {page} / {totalPages}
                        </div>

                        {page < totalPages ? (
                            <Link href={`/blog?page=${page + 1}`}>
                                <Button variant="outline" className="bg-white hover:bg-slate-100 text-slate-900 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] h-12 px-6 rounded-xl hover:-translate-y-1 transition-all">
                                    Selanjutnya →
                                </Button>
                            </Link>
                        ) : (
                            <Button disabled variant="outline" className="bg-slate-100 text-slate-400 font-black border-4 border-slate-200 h-12 px-6 rounded-xl opacity-50 cursor-not-allowed">
                                Selanjutnya →
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* ====== FOOTER ====== */}
            <footer className="border-t-4 border-slate-900 mt-20 bg-white py-12 text-center text-sm font-bold text-slate-500">
                <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-slate-900 font-black flex items-center gap-2">
                        <Terminal className="h-5 w-5 text-violet-600" />
                        EkskulDev LMS © {new Date().getFullYear()}
                    </div>
                    <div className="flex gap-6">
                        <Link href="/" className="hover:text-violet-600 transition-colors underline decoration-2 underline-offset-4">Beranda</Link>
                        <Link href="/login" className="hover:text-violet-600 transition-colors underline decoration-2 underline-offset-4">Login Area</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}