import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Pencil, Eye, BookOpen, CalendarDays, FileText, CheckCircle2 } from 'lucide-react'
import { AdminBlogActions } from './AdminBlogActions'

export default async function AdminBlogPage() {
    const supabase = await createClient()

    const { data: posts } = await supabase
        .from('blog_posts')
        .select('id, title, slug, status, category, created_at, profiles(full_name)')
        .order('created_at', { ascending: false })

    const publishedCount = posts?.filter(p => p.status === 'published').length || 0
    const draftCount = posts?.filter(p => p.status === 'draft').length || 0

    return (
        <div className="p-6 md:p-8 space-y-10 max-w-5xl mx-auto min-h-screen font-sans">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-pink-300 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] p-8 md:p-10 relative overflow-hidden mt-2">
                <div className="relative z-10">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        <div className="bg-white p-3 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] transform -rotate-6">
                            <BookOpen className="h-10 w-10 text-pink-600" />
                        </div>
                        Pusat Berita
                    </h1>
                    <p className="text-slate-900 font-bold text-lg mt-3 bg-white/60 inline-block px-4 py-1 border-2 border-slate-900 rounded-xl shadow-sm rotate-1">
                        Sampaikan kabar gembira dan aktivitas ekskul ke publik.
                    </p>
                </div>
                <div className="relative z-10 shrink-0 mt-4 sm:mt-0">
                    <Link href="/admin/blog/new">
                        <Button className="h-14 px-6 md:px-8 text-lg font-black bg-pink-500 hover:bg-pink-400 text-slate-900 border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] hover:translate-y-1 hover:shadow-[2px_2px_0px_#0f172a] transition-all rounded-2xl">
                            <Plus className="mr-2 h-6 w-6" /> Tulis Artikel
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-[24px] bg-white transform rotate-1 hover:rotate-0 hover:-translate-y-1 transition-all">
                    <CardHeader className="p-4 pb-0 flex flex-row items-center gap-3">
                        <div className="w-12 h-12 bg-slate-200 border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#0f172a]">
                            <BookOpen className="h-6 w-6 text-slate-900" />
                        </div>
                        <CardTitle className="text-sm font-black text-slate-500 uppercase">Total Artikel</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="text-5xl font-black text-slate-900">{posts?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card className="border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-[24px] bg-white transform -rotate-1 hover:rotate-0 hover:-translate-y-1 transition-all">
                    <CardHeader className="p-4 pb-0 flex flex-row items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-300 border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#0f172a]">
                            <CheckCircle2 className="h-6 w-6 text-slate-900" />
                        </div>
                        <CardTitle className="text-sm font-black text-slate-500 uppercase">Published</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="text-5xl font-black text-slate-900">{publishedCount}</div>
                    </CardContent>
                </Card>
                <Card className="border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-[24px] bg-white transform rotate-1 hover:rotate-0 hover:-translate-y-1 transition-all">
                    <CardHeader className="p-4 pb-0 flex flex-row items-center gap-3">
                        <div className="w-12 h-12 bg-yellow-300 border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#0f172a]">
                            <FileText className="h-6 w-6 text-slate-900" />
                        </div>
                        <CardTitle className="text-sm font-black text-slate-500 uppercase">Perlu Disunting</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="text-5xl font-black text-slate-900">{draftCount}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Article List */}
            <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] bg-white overflow-hidden flex flex-col">
                <div className="h-6 w-full bg-pink-400 border-b-4 border-slate-900"></div>
                <CardContent className="p-0 bg-white">
                    {!posts || posts.length === 0 ? (
                        <div className="text-center py-20 px-4">
                            <div className="w-24 h-24 bg-slate-100 rounded-full border-4 border-slate-300 border-dashed flex items-center justify-center mx-auto mb-6 transform -rotate-12">
                                <BookOpen className="h-12 w-12 text-slate-400" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900">Jejak Karya Masih Kosong</h3>
                            <p className="font-bold text-slate-500 mt-2 text-lg">Mulai bagikan pengetahuanmu dengan klik tombol Tulis Artikel Baru.</p>
                        </div>
                    ) : (
                        <div className="divide-y-4 divide-slate-100 p-2">
                            {posts.map((post: any) => (
                                <div key={post.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 m-2 hover:bg-pink-50 rounded-2xl border-2 border-transparent hover:border-slate-900 gap-4 transition-all group">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap mb-2">
                                            <Badge className={`text-xs font-black px-3 py-1 uppercase tracking-wider border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] ${post.status === 'published'
                                                ? 'bg-emerald-400 text-slate-900'
                                                : 'bg-yellow-300 text-slate-900'
                                                }`}>
                                                {post.status === 'published' ? 'Published' : 'Draft'}
                                            </Badge>
                                            {post.category && (
                                                <Badge className="text-xs font-bold bg-white text-slate-600 border-2 border-slate-300 px-3 py-1">
                                                    {post.category}
                                                </Badge>
                                            )}
                                        </div>
                                        <h3 className="font-black text-slate-900 text-xl leading-snug line-clamp-2 mt-1 group-hover:text-pink-700 transition-colors">
                                            {post.title}
                                        </h3>
                                        <p className="text-sm font-bold text-slate-500 mt-2 flex items-center gap-2">
                                            <CalendarDays className="h-4 w-4" />
                                            {new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            <span className="text-slate-300 mx-1">|</span>
                                            Oleh: <span className="text-violet-600 underline decoration-wavy decoration-violet-300 underline-offset-4">{(post.profiles as any)?.full_name || 'Admin'}</span>
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0 sm:ml-4 w-full sm:w-auto mt-4 sm:mt-0">
                                        {post.status === 'published' && (
                                            <Link href={`/blog/${post.slug}`} target="_blank" className="flex-1 sm:flex-none">
                                                <Button className="w-full sm:w-auto h-12 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] hover:translate-y-1 transition-transform">
                                                    <Eye className="h-5 w-5 mr-2 sm:mr-0" /> <span className="sm:hidden">Lihat</span>
                                                </Button>
                                            </Link>
                                        )}
                                        <Link href={`/admin/blog/${post.id}/edit`} className="flex-1 sm:flex-none">
                                            <Button className="w-full sm:w-auto h-12 px-4 bg-yellow-300 hover:bg-yellow-400 text-slate-900 font-bold border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] hover:translate-y-1 transition-transform">
                                                <Pencil className="h-5 w-5 mr-2 sm:mr-0" /> <span className="sm:hidden">Edit</span>
                                            </Button>
                                        </Link>
                                        {/* Wraps delete and maybe other actions */}
                                        <div className="flex-1 sm:flex-none">
                                            <AdminBlogActions postId={post.id} postTitle={post.title} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
