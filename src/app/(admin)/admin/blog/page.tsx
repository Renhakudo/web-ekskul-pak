'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Pencil, Eye, BookOpen, CalendarDays, FileText, CheckCircle2, PenTool, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { AdminBlogActions } from './AdminBlogActions'

const ITEMS_PER_PAGE = 10

export default function AdminBlogPage() {
    const supabase = createClient()
    
    const [posts, setPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    
    // State untuk Search, Filter & Pagination
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
    const [currentPage, setCurrentPage] = useState(1)

    const fetchPosts = async () => {
        if (posts.length === 0) setLoading(true)
        
        const { data, error } = await supabase
            .from('blog_posts')
            .select('id, title, slug, status, category, created_at, profiles(full_name)')
            .order('created_at', { ascending: false })

        if (!error && data) {
            setPosts(data)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchPosts()

        // Real-time Update
        const channel = supabase
            .channel('public:blog_posts')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'blog_posts' }, () => {
                fetchPosts()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    // Hitung Statistik
    const publishedCount = posts.filter(p => p.status === 'published').length
    const draftCount = posts.filter(p => p.status === 'draft').length

    // Logika Filter & Pencarian
    const filteredPosts = posts.filter(post => {
        const matchesSearch = post.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              post.category?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
        return matchesSearch && matchesStatus;
    })

    // Logika Pagination
    const totalPages = Math.max(1, Math.ceil(filteredPosts.length / ITEMS_PER_PAGE))
    const paginatedPosts = filteredPosts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    // Reset ke halaman 1 kalau user mengetik di pencarian atau ubah filter
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, statusFilter])

    return (
        <div className="p-4 md:p-8 space-y-10 max-w-7xl mx-auto min-h-screen font-sans relative z-0 overflow-x-hidden pb-24">

            {/* ====== BACKGROUND DOT PATTERN ====== */}
            <div className="absolute inset-0 z-[-1] bg-[radial-gradient(#cbd5e1_2px,transparent_2px)] [background-size:32px_32px] opacity-40 fixed"></div>

            {/* ====== HEADER ====== */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-pink-300 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] md:shadow-[12px_12px_0px_#0f172a] rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 relative overflow-hidden mt-4">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 10px)' }}></div>
                
                <div className="relative z-10 flex-1">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4 uppercase drop-shadow-sm">
                        <div className="bg-white p-3 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] transform -rotate-3 hover:rotate-6 transition-transform shrink-0">
                            <BookOpen className="h-8 w-8 md:h-10 md:w-10 text-pink-600" />
                        </div>
                        Pusat Berita
                    </h1>
                    <p className="text-slate-800 font-bold text-base md:text-lg mt-4 md:mt-5 bg-white/70 inline-block px-4 py-1.5 border-2 border-slate-900 rounded-xl shadow-sm rotate-1 hover:-rotate-1 transition-transform backdrop-blur-sm">
                        Sampaikan kabar gembira dan dokumentasi aktivitas ekskul ke publik.
                    </p>
                </div>
                
                <div className="relative z-10 shrink-0 mt-2 lg:mt-0">
                    <Link href="/admin/blog/new">
                        <Button className="w-full lg:w-auto h-14 md:h-16 px-6 md:px-8 text-base md:text-lg font-black uppercase tracking-wider bg-pink-500 hover:bg-pink-400 text-slate-900 border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] active:shadow-none active:translate-y-[6px] active:translate-x-[6px] hover:-translate-y-1 hover:shadow-[8px_8px_0px_#0f172a] transition-all rounded-[1.5rem]">
                            <Plus className="mr-2 h-6 w-6" /> Tulis Artikel Baru
                        </Button>
                    </Link>
                </div>
            </div>

            {/* ====== STATS CARDS ====== */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                <Card className="group border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-[1.5rem] md:rounded-[24px] bg-white transform transition-all duration-300 overflow-hidden flex flex-col hover:-rotate-2 hover:-translate-y-2 hover:shadow-[10px_10px_0px_#0f172a] cursor-default">
                    <div className="h-4 md:h-5 bg-blue-400 border-b-4 border-slate-900 w-full" />
                    <CardHeader className="p-6 pb-2 flex flex-row items-center gap-4">
                        <div className="w-12 h-12 bg-blue-200 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <BookOpen className="h-6 w-6 text-blue-700" />
                        </div>
                        <CardTitle className="text-sm md:text-base font-black text-slate-500 uppercase tracking-widest mt-1">Total Artikel</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-2 mt-auto">
                        <div className="text-5xl md:text-6xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">{posts.length}</div>
                    </CardContent>
                </Card>

                <Card className="group border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-[1.5rem] md:rounded-[24px] bg-white transform transition-all duration-300 overflow-hidden flex flex-col hover:rotate-2 hover:-translate-y-2 hover:shadow-[10px_10px_0px_#0f172a] cursor-default">
                    <div className="h-4 md:h-5 bg-emerald-400 border-b-4 border-slate-900 w-full" />
                    <CardHeader className="p-6 pb-2 flex flex-row items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-200 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <CheckCircle2 className="h-6 w-6 text-emerald-700" />
                        </div>
                        <CardTitle className="text-sm md:text-base font-black text-slate-500 uppercase tracking-widest mt-1">Tayang Publik</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-2 mt-auto">
                        <div className="text-5xl md:text-6xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{publishedCount}</div>
                    </CardContent>
                </Card>

                <Card className="group border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-[1.5rem] md:rounded-[24px] bg-white transform transition-all duration-300 overflow-hidden flex flex-col hover:-rotate-2 hover:-translate-y-2 hover:shadow-[10px_10px_0px_#0f172a] cursor-default">
                    <div className="h-4 md:h-5 bg-yellow-400 border-b-4 border-slate-900 w-full" />
                    <CardHeader className="p-6 pb-2 flex flex-row items-center gap-4">
                        <div className="w-12 h-12 bg-yellow-200 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FileText className="h-6 w-6 text-yellow-700" />
                        </div>
                        <CardTitle className="text-sm md:text-base font-black text-slate-500 uppercase tracking-widest mt-1">Draft Rahasia</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-2 mt-auto">
                        <div className="text-5xl md:text-6xl font-black text-slate-900 group-hover:text-yellow-600 transition-colors">{draftCount}</div>
                    </CardContent>
                </Card>
            </div>

            {/* ====== CONTROL BAR (SEARCH & FILTER) ====== */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-white p-4 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a]">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" />
                    <Input 
                        placeholder="Cari judul atau kategori..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-14 pl-12 bg-slate-50 border-2 border-slate-300 focus:border-slate-900 rounded-2xl font-bold text-base focus-visible:ring-0 focus:shadow-[4px_4px_0px_#0f172a] transition-all"
                    />
                </div>
                <div className="flex bg-slate-100 border-2 border-slate-300 p-1.5 rounded-2xl overflow-x-auto hide-scrollbar shrink-0">
                    <button onClick={() => setStatusFilter('all')} className={`px-5 py-3 font-black text-xs md:text-sm uppercase rounded-xl transition-all whitespace-nowrap ${statusFilter === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>Semua</button>
                    <button onClick={() => setStatusFilter('published')} className={`px-5 py-3 font-black text-xs md:text-sm uppercase rounded-xl transition-all whitespace-nowrap ${statusFilter === 'published' ? 'bg-emerald-400 text-slate-900 shadow-[2px_2px_0px_#0f172a] border-2 border-slate-900' : 'text-slate-500 hover:bg-slate-200 border-2 border-transparent'}`}>Tayang</button>
                    <button onClick={() => setStatusFilter('draft')} className={`px-5 py-3 font-black text-xs md:text-sm uppercase rounded-xl transition-all whitespace-nowrap ${statusFilter === 'draft' ? 'bg-yellow-300 text-slate-900 shadow-[2px_2px_0px_#0f172a] border-2 border-slate-900' : 'text-slate-500 hover:bg-slate-200 border-2 border-transparent'}`}>Draft</button>
                </div>
            </div>

            {/* ====== ARTICLE LIST ====== */}
            <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[2rem] bg-slate-50 overflow-hidden">
                <CardHeader className="border-b-4 border-slate-900 bg-amber-100 p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <CardTitle className="text-2xl md:text-3xl font-black flex items-center gap-3 text-slate-900 uppercase">
                        <PenTool className="h-8 w-8 md:h-10 md:w-10 text-amber-600" />
                        Jejak Karya
                    </CardTitle>
                    <Badge variant="secondary" className="bg-white border-4 border-slate-900 text-slate-900 font-black shadow-[4px_4px_0px_#0f172a] text-sm md:text-base px-4 py-1.5 transform rotate-2">
                        {filteredPosts.length} Ditemukan
                    </Badge>
                </CardHeader>

                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-24 flex flex-col items-center justify-center bg-white">
                            <Loader2 className="w-12 h-12 animate-spin text-pink-500 mb-4" />
                            <p className="font-black text-slate-500 uppercase tracking-widest">Mencari Arsip...</p>
                        </div>
                    ) : paginatedPosts.length === 0 ? (
                        <div className="text-center py-20 px-4 bg-white border-b-4 border-slate-900">
                            <div className="w-24 h-24 bg-slate-100 rounded-3xl border-4 border-slate-300 border-dashed flex items-center justify-center mx-auto mb-6 transform -rotate-12">
                                <BookOpen className="h-12 w-12 text-slate-400" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase">
                                {searchQuery ? 'Artikel Tidak Ditemukan' : 'Jejak Karya Masih Kosong'}
                            </h3>
                            <p className="font-bold text-slate-500 mt-2 text-lg">
                                {searchQuery ? 'Coba gunakan kata kunci pencarian yang lain.' : 'Mulai bagikan pengetahuanmu dengan klik tombol Tulis Artikel Baru.'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y-4 divide-slate-900 bg-white">
                            {paginatedPosts.map((post: any) => (
                                <div key={post.id} className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 md:p-8 hover:bg-pink-50 transition-colors gap-6 group cursor-default">
                                    
                                    <div className="flex-1 min-w-0 w-full">
                                        <div className="flex items-center gap-3 flex-wrap mb-3">
                                            {post.status === 'published' ? (
                                                <Badge className="text-xs md:text-sm font-black px-3 py-1 uppercase tracking-wider border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] bg-emerald-400 text-slate-900 transform -rotate-2">
                                                    Tayang
                                                </Badge>
                                            ) : (
                                                <Badge className="text-xs md:text-sm font-black px-3 py-1 uppercase tracking-wider border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] bg-yellow-300 text-slate-900 transform rotate-2">
                                                    Draft
                                                </Badge>
                                            )}
                                            
                                            {post.category && (
                                                <Badge className="text-xs md:text-sm font-bold bg-white text-slate-600 border-2 border-slate-300 px-3 py-1 uppercase tracking-wider shadow-sm">
                                                    {post.category}
                                                </Badge>
                                            )}
                                        </div>
                                        <h3 className="font-black text-slate-900 text-2xl md:text-3xl leading-snug line-clamp-2 mt-1 group-hover:text-pink-600 transition-colors">
                                            {post.title}
                                        </h3>
                                        <p className="text-sm md:text-base font-bold text-slate-500 mt-3 flex items-center gap-2 flex-wrap">
                                            <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg border-2 border-slate-200 text-slate-700 shadow-sm">
                                                <CalendarDays className="h-4 w-4" />
                                                {new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                            <span className="text-slate-300 hidden sm:inline">|</span>
                                            Oleh: <span className="text-violet-600 bg-violet-100 px-2 py-0.5 rounded-md border-2 border-violet-200 shadow-sm">{(post.profiles as any)?.full_name || 'Sistem'}</span>
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto shrink-0 justify-end mt-2 lg:mt-0 p-4 lg:p-0 bg-slate-50 lg:bg-transparent rounded-2xl border-4 border-slate-900 lg:border-transparent">
                                        {post.status === 'published' && (
                                            <Link href={`/blog/${post.slug}`} target="_blank" className="w-full sm:w-auto flex-1 sm:flex-none">
                                                <Button className="w-full h-12 md:h-14 px-4 bg-white hover:bg-slate-100 text-slate-900 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0f172a] active:translate-y-1 active:shadow-none transition-all rounded-xl uppercase">
                                                    <Eye className="h-5 w-5 sm:mr-2" /> <span className="hidden sm:inline">Lihat</span>
                                                </Button>
                                            </Link>
                                        )}
                                        <Link href={`/admin/blog/${post.id}/edit`} className="w-full sm:w-auto flex-1 sm:flex-none">
                                            <Button className="w-full h-12 md:h-14 px-4 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0f172a] active:translate-y-1 active:shadow-none transition-all rounded-xl uppercase">
                                                <Pencil className="h-5 w-5 sm:mr-2" /> <span className="hidden sm:inline">Edit</span>
                                            </Button>
                                        </Link>
                                        <div className="flex-none">
                                            <div className="transform hover:-translate-y-1 transition-transform">
                                                <AdminBlogActions postId={post.id} postTitle={post.title} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>

                {/* ====== PAGINATION CONTROLS ====== */}
                {!loading && totalPages > 1 && (
                    <div className="p-6 bg-slate-100 border-t-4 border-slate-900 flex items-center justify-between gap-4">
                        <Button 
                            variant="outline" 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="h-12 border-2 border-slate-900 font-black uppercase text-slate-700 bg-white hover:bg-slate-200"
                        >
                            <ChevronLeft className="w-5 h-5 mr-1" /> Prev
                        </Button>
                        <span className="font-black text-slate-600 bg-white px-4 py-2 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]">
                            {currentPage} / {totalPages}
                        </span>
                        <Button 
                            variant="outline" 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="h-12 border-2 border-slate-900 font-black uppercase text-slate-700 bg-white hover:bg-slate-200"
                        >
                            Next <ChevronRight className="w-5 h-5 ml-1" />
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    )
}